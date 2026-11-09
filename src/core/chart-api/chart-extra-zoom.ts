// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import * as Styles from "../../internal/chart-styles";
import { fireNonCancelableEvent } from "../../internal/events";
import AsyncStore from "../../internal/utils/async-store";
import { SafeChart } from "../../internal/utils/highcharts";
import { SVGRendererSingle } from "../../internal/utils/renderer-utils";
import {
  canZoomInto,
  getInteraction,
  getOverlayView,
  getPress,
  IDLE_ZOOM_STATE,
  ZoomAnnouncement,
  ZoomEffect,
  ZoomEvent,
  ZoomFocusTarget,
  ZoomPress,
  zoomReducer,
  ZoomSelection,
  ZoomState,
} from "../chart-zoom/zoom-state-machine";
import { createStopMapper, findNearestIndex, getCursorStops, getPageStep } from "../chart-zoom/zoom-utils";
import { getFormatter } from "../formatters";
import { CoreChartProps, Rect } from "../interfaces";
import { isInsidePlot } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

// How far the pointer must travel before a press is treated as a drag. Shorter movements are clicks, which
// must not commit a zoom: in zoom mode a click sets a range boundary.
const DRAG_THRESHOLD = 10;

export type ZoomControlsFocusTarget = Exclude<ZoomFocusTarget, "cursor">;

interface ZoomCommonState {
  zoomed: boolean;
  canZoom: boolean;
  announcement: string;
  // Counts the announcements, so that the same text is announced again when it is repeated.
  announcementCount: number;
}

// The single zoom state: the state of the interaction, as the zoom state machine defines it, together with what the
// zoom controls and the announcer show. It is reactive, so that the components render from it. A focus request for
// the zoom buttons only exists while idle, which is the only state that moves focus to them.
export type ReactiveZoomState = ZoomCommonState &
  (
    | { type: "idle"; focusRequest: null | { target: ZoomControlsFocusTarget } }
    | { type: "selecting"; selection: ZoomSelection }
    | { type: "pressed"; press: ZoomPress; resume: null | ZoomSelection }
    | { type: "dragging"; press: ZoomPress; resume: null | ZoomSelection }
  );

export interface ChartExtraZoomHandlers {
  onClearHighlight(): void;
  onFocusChart(): void;
}

interface ZoomExtremes {
  min: number;
  max: number;
}

// Chart helper that implements zooming into a range of the first x-axis: by dragging across the plot, by setting
// the range boundaries with a click or a tap, or with the keyboard cursor. The interaction itself is the state
// machine in zoom-state-machine; this helper resolves its stops to values, applies the zoomed range to the axis,
// and draws the range and the selection on the plot.
export class ChartExtraZoom extends AsyncStore<ReactiveZoomState> {
  private context: ChartExtraContext;
  private handlers: ChartExtraZoomHandlers;
  private localExtremes: null | ZoomExtremes = null;
  private values: number[] = [];
  private valuesStale = true;
  private swallowClick = false;
  private stopTrackingPress: null | (() => void) = null;
  private cursorElement: null | HTMLElement = null;
  private controlsElement: null | HTMLElement = null;
  private rangeBand = new SVGRendererSingle();
  private rangeBorders = new SVGRendererSingle();
  private selectionBand = new SVGRendererSingle();
  private selectionStart = new SVGRendererSingle();
  private selectionEnd = new SVGRendererSingle();

  constructor(context: ChartExtraContext, handlers: ChartExtraZoomHandlers) {
    super({
      type: "idle",
      focusRequest: null,
      zoomed: false,
      canZoom: true,
      announcement: "",
      announcementCount: 0,
    });
    this.context = context;
    this.handlers = handlers;
  }

  public get isActive() {
    return getInteraction(this.get()) !== "idle";
  }

  public setCursor = (element: null | HTMLElement) => {
    this.cursorElement = element;
  };

  public setControls = (element: null | HTMLElement) => {
    this.controlsElement = element;
  };

  public onChartLoad = (chart: SafeChart) => {
    if (!chart.container) {
      return;
    }
    chart.container.addEventListener("pointerdown", this.onPlotPointerDown);
    chart.container.addEventListener("pointermove", this.onPlotPointerMove);
    chart.container.addEventListener("click", this.onPlotClickCapture, true);
    this.applyContainerStyle(chart);
  };

  public onChartRender = () => {
    // The interaction refers to the stops by their index in the last values read.
    const previousValues = this.values;
    this.valuesStale = true;
    this.reconcile(this.context.chart());
    if (!this.enabled) {
      return;
    }
    this.dispatch({ type: "chartRendered", stopMapper: createStopMapper(previousValues, this.getValues()) });
    this.updateCanZoom();
  };

  public onChartDestroy = () => {
    const container = this.context.chartOrNull?.container;
    container?.removeEventListener("pointerdown", this.onPlotPointerDown);
    container?.removeEventListener("pointermove", this.onPlotPointerMove);
    container?.removeEventListener("click", this.onPlotClickCapture, true);
    this.stopPress();
    this.rangeBand.destroy();
    this.rangeBorders.destroy();
    this.selectionBand.destroy();
    this.selectionStart.destroy();
    this.selectionEnd.destroy();
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (!this.enabled) {
      this.localExtremes = null;
      this.hideOverlay();
      this.set((prev) => withInteraction(prev, IDLE_ZOOM_STATE));
    }
    if (chart) {
      this.applyContainerStyle(chart);
      this.reconcile(chart);
      // The chart can render before the settings enable zoom, and then has not updated whether zooming is possible.
      if (this.enabled) {
        this.updateCanZoom();
      }
    }
  };

  public enterZoomMode = () => {
    const xAxis = this.xAxis;
    if (!this.enabled || !xAxis) {
      return;
    }
    const values = this.getValues();
    // The cursor always starts at the visible start of the plot, whichever way the axis runs.
    this.dispatch({ type: "enterZoomMode", startIndex: isPixelForward(xAxis, values) ? 0 : values.length - 1 });
  };

  public exitZoomMode = ({ withFocus }: { withFocus: boolean }) => {
    this.dispatch({ type: "exitZoomMode", moveFocus: withFocus });
  };

  public resetZoom = ({ isApiCall }: { isApiCall: boolean }) => {
    this.dispatch({ type: "resetZoom", zoomed: !!this.getExtremes(), isApiCall });
  };

  public focusZoomButton = () => {
    this.moveFocus("zoomButton");
  };

  public clearFocusRequest = () => {
    this.setFocusRequest(null);
  };

  // Moves the cursor by the given number of stops towards the start (-1) or the end (+1) of the plot on screen.
  private stepCursor = (direction: -1 | 1, stops = 1) => {
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (xAxis && values.length > 0) {
      this.dispatch({ type: "stepCursor", offset: (isPixelForward(xAxis, values) ? 1 : -1) * direction * stops });
    }
  };

  public onCursorKeyDown = (event: React.KeyboardEvent) => {
    const xAxis = this.xAxis;
    if (!xAxis || getInteraction(this.get()) !== "cursor") {
      return;
    }
    // On an inverted chart the x-axis runs vertically, and so does the cursor.
    const vertical = !isXAxisHorizontal(xAxis);
    const pageStop = getPageStep(this.getValues().length);
    let handled = true;
    switch (event.keyCode) {
      case vertical ? KeyCode.up : KeyCode.left:
        this.stepCursor(-1);
        break;
      case vertical ? KeyCode.down : KeyCode.right:
        this.stepCursor(1);
        break;
      case KeyCode.pageUp:
        this.stepCursor(1, pageStop);
        break;
      case KeyCode.pageDown:
        this.stepCursor(-1, pageStop);
        break;
      case KeyCode.home:
        this.moveCursorToEdge(-1);
        break;
      case KeyCode.end:
        this.moveCursorToEdge(1);
        break;
      case KeyCode.enter:
      case KeyCode.space:
        this.dispatch({ type: "commitPoint" });
        break;
      case KeyCode.escape:
        this.exitZoomMode({ withFocus: true });
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      // The chart dismisses the tooltip on Escape from a document listener, which must not act on this key too.
      event.stopPropagation();
    }
  };

  public onCursorBlur = (event: React.FocusEvent) => {
    if (!this.isFocusWithinZoom(event.relatedTarget)) {
      this.exitZoomMode({ withFocus: false });
    }
  };

  // Focus can move from the cursor to the zoom controls, so leaving them ends the selection too. A focus request still
  // waiting for its button is dropped, so that it cannot take the focus back later.
  public onControlsBlur = (event: React.FocusEvent) => {
    if (!this.isFocusWithinZoom(event.relatedTarget)) {
      this.exitZoomMode({ withFocus: false });
      this.clearFocusRequest();
    }
  };

  private updateCanZoom() {
    const canZoom = canZoomInto(this.getValues().length);
    if (canZoom !== this.get().canZoom) {
      this.setCommon({ canZoom });
    }
  }

  private isFocusWithinZoom(target: EventTarget | null) {
    return target instanceof Node && (target === this.cursorElement || !!this.controlsElement?.contains(target));
  }

  private get enabled() {
    return this.context.settings.zoomEnabled;
  }

  private get labels() {
    return this.context.settings.labels;
  }

  // The axis instance is replaced on chart updates, so it is always read from the chart.
  private get xAxis(): null | Highcharts.Axis {
    return this.context.chartOrNull?.xAxis?.[0] ?? null;
  }

  // The range is controlled when the property is defined, including null, which shows the full data range.
  private get controlled() {
    return this.context.state.zoomRange !== undefined;
  }

  private getExtremes(): null | ZoomExtremes {
    if (!this.enabled) {
      return null;
    }
    return this.controlled ? extremesFromRange(this.context.state.zoomRange) : this.localExtremes;
  }

  // Applies the zoom range to the chart and draws it. Runs on every chart render, and once more after a zoom prop
  // change, when the context holds the new range.
  private reconcile(chart: SafeChart) {
    this.applyExtremes(chart);
    this.drawRange(chart);
  }

  // The range is applied imperatively: Highcharts keeps the extremes set with setExtremes through chart updates,
  // and falls back to the min and max declared in the axis options when they are cleared. The axis is only
  // updated when its range differs, so the redraw it causes does not update it again. Extremes the zoom did not
  // apply are left to the consumer.
  private applyExtremes(chart: SafeChart) {
    const extremes = this.getExtremes();
    const xAxis = chart.xAxis?.[0];
    if (xAxis) {
      const { userMin, userMax } = xAxis.getExtremes();
      if (extremes && (userMin !== extremes.min || userMax !== extremes.max)) {
        xAxis.setExtremes(extremes.min, extremes.max, true, false);
      } else if (!extremes && this.get().zoomed && (userMin !== undefined || userMax !== undefined)) {
        xAxis.setExtremes(undefined, undefined, true, false);
      }
    }
    // Zooming clears the reset announcement, so that LiveRegion announces the next reset again. Other announcements
    // are kept: the range change is announced just before the zoom is applied.
    if (!!extremes !== this.get().zoomed) {
      const resetText = this.labels.zoomResetAnnouncementText ?? "";
      const { announcement } = this.get();
      this.setCommon({ zoomed: !!extremes, announcement: extremes && announcement === resetText ? "" : announcement });
    }
  }

  private applyContainerStyle(chart: SafeChart) {
    if (!chart.container) {
      return;
    }
    // A drag across the plot must not select text, and a touch drag along the x-axis must not scroll the page.
    chart.container.style.userSelect = this.enabled ? "none" : "";
    chart.container.style.touchAction = this.enabled ? (chart.inverted ? "pan-x" : "pan-y") : "";
  }

  private getValues(): number[] {
    if (this.valuesStale) {
      this.values = getCursorStops(this.context.derived, this.xAxis);
      this.valuesStale = false;
    }
    return this.values;
  }

  private formatValue(value: number): string {
    return getFormatter(this.xAxis ?? undefined)(value);
  }

  private announce(text: string) {
    this.setCommon({ announcement: text, announcementCount: this.get().announcementCount + 1 });
  }

  // Updates what the zoom controls and the announcer show, keeping the state of the interaction.
  private setCommon(update: Partial<ZoomCommonState>) {
    this.set((state) => ({ ...state, ...update }));
  }

  private setFocusRequest(focusRequest: null | { target: ZoomControlsFocusTarget }) {
    this.set((state) =>
      state.type === "idle" && state.focusRequest !== focusRequest ? { ...state, focusRequest } : state,
    );
  }

  // Every zoom interaction goes through here: the state machine decides the next state and its effects.
  private dispatch(event: ZoomEvent) {
    const previous = this.get();
    const { state, effects } = zoomReducer(previous, event, { valuesCount: this.getValues().length });
    // The idle state carries nothing, so any idle state the reducer returns is the same one.
    const changed = state !== previous && !(state.type === "idle" && previous.type === "idle");
    if (!changed && effects.length === 0) {
      return;
    }
    if (changed) {
      this.set((prev) => withInteraction(prev, state));
      // The chart keeps tracking the hovered point during the interaction, and would open the tooltip on it
      // once the interaction ends.
      if (getInteraction(state) === "idle" && getInteraction(previous) !== "idle") {
        this.handlers.onClearHighlight();
      }
    }
    let focusTarget: null | ZoomFocusTarget = null;
    for (const effect of effects) {
      if (effect.type === "focus") {
        focusTarget = effect.target;
      } else {
        this.runEffect(effect);
      }
    }
    this.syncOverlay();
    if (focusTarget) {
      this.moveFocus(focusTarget);
    }
  }

  private runEffect(effect: Exclude<ZoomEffect, { type: "focus" }>) {
    switch (effect.type) {
      case "clearHighlight":
        this.handlers.onClearHighlight();
        break;
      case "announce":
        this.announce(this.describeAnnouncement(effect.announcement));
        break;
      case "applyZoom": {
        const values = this.getValues();
        const fromValue = values[effect.fromIndex];
        const toValue = values[effect.toIndex];
        if (fromValue === undefined || toValue === undefined) {
          break;
        }
        const min = Math.min(fromValue, toValue);
        const max = Math.max(fromValue, toValue);
        this.announce(
          this.labels.zoomRangeChangeAnnouncementText?.(this.formatValue(min), this.formatValue(max)) ?? "",
        );
        if (!this.controlled) {
          this.localExtremes = { min, max };
          this.applyExtremes(this.context.chart());
        }
        fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, {
          zoomRange: { x: { startValue: min, endValue: max } },
        });
        break;
      }
      case "resetZoom":
        // A controlled chart cannot reset on its own: it asks the consumer to show the full range.
        if (!this.controlled) {
          this.localExtremes = null;
          this.applyExtremes(this.context.chart());
        }
        this.announce(this.labels.zoomResetAnnouncementText ?? "");
        // A reset requested through the API is not reported back to an uncontrolled chart's consumer.
        if (this.controlled || !effect.isApiCall) {
          fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
        }
        break;
    }
  }

  private describeAnnouncement(announcement: ZoomAnnouncement): string {
    const values = this.getValues();
    switch (announcement.type) {
      case "zoomModeEntered":
        return this.labels.zoomModeEnteredAnnouncementText?.(this.formatValue(values[announcement.index])) ?? "";
      case "startPointSet":
        return this.labels.zoomStartPointAnnouncementText?.(this.formatValue(values[announcement.index])) ?? "";
      case "zoomModeExited":
        return this.labels.zoomModeExitedAnnouncementText ?? "";
    }
  }

  private moveFocus(target: ZoomFocusTarget) {
    if (target === "cursor") {
      // A request still waiting for the Reset button must not take the focus back from the cursor.
      this.clearFocusRequest();
      this.cursorElement?.focus();
    } else if (this.context.settings.zoomControlsHidden) {
      this.handlers.onFocusChart();
    } else {
      // The buttons to focus are rendered by the controls component, often only as a result of this transition,
      // so the component moves focus once it has rendered.
      this.setFocusRequest({ target });
    }
  }

  private moveCursorToEdge(direction: -1 | 1) {
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (xAxis && values.length > 0) {
      const atStart = isPixelForward(xAxis, values) === (direction === -1);
      this.dispatch({ type: "moveCursorToEdge", edge: atStart ? "first" : "last" });
    }
  }

  // Marks the zoomed range on the plot with a tinted band and a border at each end.
  private drawRange(chart: SafeChart) {
    const extremes = this.getExtremes();
    const xAxis = chart.xAxis?.[0];
    // Hiding first destroys elements that belong to a chart instance Highcharts has replaced, so that they are drawn
    // again on the current one, like the tooltip cursor.
    this.rangeBand.hide();
    this.rangeBorders.hide();
    if (!extremes || !xAxis) {
      return;
    }
    // In an inverted chart the x-axis runs vertically, so the band and the borders span the plot horizontally.
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
    const from = valueToPixel(xAxis, extremes.min);
    const to = valueToPixel(xAxis, extremes.max);
    const border = (pixel: number) =>
      isXAxisHorizontal(xAxis)
        ? `M ${pixel} ${plotTop} L ${pixel} ${plotTop + plotHeight}`
        : `M ${plotLeft} ${pixel} L ${plotLeft + plotWidth} ${pixel}`;
    this.rangeBand.rect(chart.renderer, {
      ...Styles.zoomRangeBand,
      ...getBandRect(chart, xAxis, extremes.min, extremes.max),
      class: testClasses["zoom-range"],
    });
    this.rangeBorders.path(chart.renderer, {
      ...Styles.zoomRangeBorders,
      d: `${border(from)} ${border(to)}`,
      class: testClasses["zoom-range-borders"],
    });
  }

  // Draws the current state of the interaction onto the plot, and describes the cursor to assistive technology.
  private syncOverlay() {
    const chart = this.context.chartOrNull as null | Highcharts.Chart;
    const xAxis = this.xAxis;
    const values = this.getValues();
    const view = getOverlayView(this.get());
    if (!chart || !xAxis || values.length === 0 || view.type === "hidden") {
      this.hideOverlay();
      return;
    }
    const origin = { left: chart.container.offsetLeft, top: chart.container.offsetTop };
    if (view.type === "range") {
      const fromValue = values[view.fromIndex];
      const toValue = values[view.toIndex];
      this.drawSelection(chart, getBandRect(chart, xAxis, fromValue, toValue), [
        getDividerRect(chart, xAxis, fromValue),
        getDividerRect(chart, xAxis, toValue),
      ]);
      // The cursor stays visible while focused, because hiding a focused element moves focus to the body.
      const cursorFocused = !!this.cursorElement && this.cursorElement === document.activeElement;
      applyRect(this.cursorElement, cursorFocused ? getDividerRect(chart, xAxis, toValue) : null, origin);
      return;
    }
    const cursorValue = values[view.cursorIndex];
    const anchorValue = view.anchorIndex === null ? null : values[view.anchorIndex];
    applyRect(this.cursorElement, getDividerRect(chart, xAxis, cursorValue), origin);
    if (anchorValue === null) {
      this.drawSelection(chart, null, []);
    } else {
      this.drawSelection(chart, getBandRect(chart, xAxis, anchorValue, cursorValue), [
        getDividerRect(chart, xAxis, anchorValue),
      ]);
    }
    // The cursor is a slider, so its position is announced from its own value as it moves.
    const cursor = this.cursorElement;
    if (cursor) {
      cursor.setAttribute("aria-valuemin", `${values[0]}`);
      cursor.setAttribute("aria-valuemax", `${values[values.length - 1]}`);
      cursor.setAttribute("aria-valuenow", `${cursorValue}`);
      cursor.setAttribute(
        "aria-valuetext",
        anchorValue === null
          ? (this.labels.zoomCursorPositionAnnouncementText?.(this.formatValue(cursorValue)) ?? "")
          : (this.labels.zoomSelectionAnnouncementText?.(
              this.formatValue(anchorValue),
              this.formatValue(cursorValue),
            ) ?? ""),
      );
    }
  }

  private drawSelection(chart: Highcharts.Chart, band: null | Rect, dividers: Rect[]) {
    this.selectionBand.hide();
    this.selectionStart.hide();
    this.selectionEnd.hide();
    if (band) {
      this.selectionBand.rect(chart.renderer, {
        ...Styles.zoomSelectionBand,
        ...band,
        class: testClasses["zoom-selection"],
      });
    }
    const [start, end] = dividers;
    for (const [element, rect, className] of [
      [this.selectionStart, start, testClasses["zoom-selection-start"]],
      [this.selectionEnd, end, testClasses["zoom-selection-end"]],
    ] as const) {
      if (rect) {
        element.rect(chart.renderer, { ...Styles.zoomSelectionDivider, ...rect, class: className });
      }
    }
  }

  private hideOverlay() {
    this.selectionBand.hide();
    this.selectionStart.hide();
    this.selectionEnd.hide();
    const origin = { left: 0, top: 0 };
    applyRect(this.cursorElement, null, origin);
  }

  private onPlotPointerDown = (event: PointerEvent) => {
    this.swallowClick = false;
    // Secondary mouse buttons open context menus and must not start a selection.
    if (!this.enabled || (event.pointerType === "mouse" && event.button)) {
      return;
    }
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (!chart || !xAxis || values.length === 0) {
      return;
    }
    const { chartX, chartY } = chart.pointer.normalize(event);
    if (!isInsidePlot(chart as Highcharts.Chart, chartX, chartY)) {
      return;
    }
    const inZoomMode = getInteraction(this.get()) === "cursor";
    this.swallowClick = inZoomMode;
    this.trackPress(chart.container, event.pointerId);
    const index = findStopAtPointer(values, xAxis, chartX, chartY);
    this.dispatch({
      type: "pointerDown",
      press: {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        startIndex: index,
        currentIndex: index,
      },
    });
    if (inZoomMode) {
      // In zoom mode the press must not move focus off the cursor, which would end the selection.
      event.preventDefault();
    }
  };

  // Hovering the plot in zoom mode moves the cursor. A press is followed on the document instead.
  private onPlotPointerMove = (event: PointerEvent) => {
    if (this.enabled && !this.stopTrackingPress) {
      this.onPressMove(event);
    }
  };

  // Runs in the capture phase, so the click that set a range boundary does not also reach Highcharts and pin a point.
  private onPlotClickCapture = (event: MouseEvent) => {
    if (this.swallowClick) {
      this.swallowClick = false;
      event.stopPropagation();
    }
  };

  // Follows a press on the document until it ends, so that it is not lost when the pointer passes over the tooltip
  // or leaves the chart.
  private trackPress(container: HTMLElement, pointerId: number) {
    this.stopPress();
    const document = container.ownerDocument;
    const onMove = (event: PointerEvent) => event.pointerId === pointerId && this.onPressMove(event);
    const onUp = (event: PointerEvent) => event.pointerId === pointerId && this.onPressEnd(event, "pointerUp");
    const onCancel = (event: PointerEvent) => event.pointerId === pointerId && this.onPressEnd(event, "pointerCancel");
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
    this.stopTrackingPress = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
    };
  }

  private stopPress() {
    this.stopTrackingPress?.();
    this.stopTrackingPress = null;
  }

  private onPressMove(event: PointerEvent) {
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (!chart || !xAxis || this.get().type === "idle" || values.length === 0) {
      return;
    }
    const press = getPress(this.get());
    const { chartX, chartY } = chart.pointer.normalize(event);
    const distance = press ? travelledAlongAxis(xAxis, event, press.clientX, press.clientY) : 0;
    this.dispatch({
      type: "pointerMove",
      pointerId: event.pointerId,
      index: findStopAtPointer(values, xAxis, chartX, chartY),
      passedThreshold: distance >= DRAG_THRESHOLD,
      insidePlot: isInsidePlot(chart as Highcharts.Chart, chartX, chartY),
    });
    // The pointer is only captured once the press is a drag: capturing on press would retarget the click that
    // follows away from the Highcharts container, and clicking the chart would no longer pin a point.
    if (this.get().type === "dragging") {
      capturePointer(chart.container, event.pointerId);
    }
  }

  private onPressEnd(event: PointerEvent, type: "pointerUp" | "pointerCancel") {
    this.stopPress();
    const container = this.context.chartOrNull?.container;
    if (container) {
      releasePointer(container, event.pointerId);
    }
    this.dispatch({ type, pointerId: event.pointerId });
  }
}

// The next zoom state for a state of the interaction, keeping what the controls and the announcer show.
function withInteraction(prev: ReactiveZoomState, interaction: ZoomState): ReactiveZoomState {
  const { zoomed, canZoom, announcement, announcementCount } = prev;
  const common = { zoomed, canZoom, announcement, announcementCount };
  switch (interaction.type) {
    case "idle":
      return { ...common, type: "idle", focusRequest: prev.type === "idle" ? prev.focusRequest : null };
    case "selecting":
      return { ...common, type: "selecting", selection: interaction.selection };
    case "pressed":
    case "dragging":
      return { ...common, type: interaction.type, press: interaction.press, resume: interaction.resume };
  }
}

function extremesFromRange(zoomRange: undefined | null | CoreChartProps.ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

// The rectangles are in physical pixels relative to the chart, matching chart.plotLeft, plotTop, and toPixels.

// In an inverted chart the x axis runs vertically, so every pixel computation swaps the two dimensions
// and Axis.toValue / toPixels operate on chart y coordinates instead of x ones.
function isXAxisHorizontal(xAxis: Pick<Highcharts.Axis, "horiz">): boolean {
  return xAxis.horiz !== false;
}

// The stop nearest to a pointer position over the chart. On a logarithmic axis the nearest value is not always the
// nearest on screen, so the neighbouring stops are compared by their distance in pixels.
function findStopAtPointer(values: readonly number[], xAxis: Highcharts.Axis, chartX: number, chartY: number): number {
  const pixel = isXAxisHorizontal(xAxis) ? chartX : chartY;
  const index = findNearestIndex(values, xAxis.toValue(pixel, false));
  if (xAxis.options.type !== "logarithmic") {
    return index;
  }
  const distance = (i: number) => Math.abs(valueToPixel(xAxis, values[i]) - pixel);
  let nearest = index;
  for (const candidate of [index - 1, index + 1]) {
    if (candidate >= 0 && candidate < values.length && distance(candidate) < distance(nearest)) {
      nearest = candidate;
    }
  }
  return nearest;
}

// Converts an x-axis value into a chart-relative pixel along the axis.
function valueToPixel(xAxis: Highcharts.Axis, value: number): number {
  return xAxis.toPixels(value, false);
}

// True when increasing x values map to increasing pixel coordinates. Derived from the rendered pixels
// rather than from the reversed / inverted options, so it holds for right-to-left pages, consumer-set
// `reversed` axes, and inverted charts alike, including combinations of the three.
function isPixelForward(xAxis: Highcharts.Axis, values: readonly number[]): boolean {
  if (values.length < 2) {
    return true;
  }
  return valueToPixel(xAxis, values[values.length - 1]) >= valueToPixel(xAxis, values[0]);
}

// A line across the plot at the given x value.
function getDividerRect(chart: SafeChart, xAxis: Highcharts.Axis, value: number): Rect {
  const pixel = valueToPixel(xAxis, value);
  return isXAxisHorizontal(xAxis)
    ? {
        x: pixel - Styles.zoomDividerThickness / 2,
        y: chart.plotTop,
        width: Styles.zoomDividerThickness,
        height: chart.plotHeight,
      }
    : {
        x: chart.plotLeft,
        y: pixel - Styles.zoomDividerThickness / 2,
        width: chart.plotWidth,
        height: Styles.zoomDividerThickness,
      };
}

// The band covering the range between two x values, spanning the plot across the other dimension.
function getBandRect(chart: SafeChart, xAxis: Highcharts.Axis, fromValue: number, toValue: number): Rect {
  const fromPixel = valueToPixel(xAxis, fromValue);
  const toPixel = valueToPixel(xAxis, toValue);
  const start = Math.min(fromPixel, toPixel);
  // A range of a single value still needs a visible band, hence the minimum of one pixel.
  const size = Math.max(1, Math.abs(toPixel - fromPixel));
  return isXAxisHorizontal(xAxis)
    ? { x: start, y: chart.plotTop, width: size, height: chart.plotHeight }
    : { x: chart.plotLeft, y: start, width: chart.plotWidth, height: size };
}

// The offset of the Highcharts container from the element the cursor is positioned against.
interface OverlayOrigin {
  left: number;
  top: number;
}

// Positions the cursor imperatively, so that stepping the cursor causes no React render.
function applyRect(element: null | HTMLElement, rect: null | Rect, origin: OverlayOrigin) {
  if (!element) {
    return;
  }
  if (!rect) {
    element.style.visibility = "hidden";
    return;
  }
  element.style.visibility = "visible";
  element.style.left = `${origin.left + rect.x}px`;
  element.style.top = `${origin.top + rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

// Movement across the axis does not change the range, and counting it would turn a shaky click into a drag.
function travelledAlongAxis(xAxis: Highcharts.Axis, event: PointerEvent, clientX: number, clientY: number) {
  return isXAxisHorizontal(xAxis) ? Math.abs(event.clientX - clientX) : Math.abs(event.clientY - clientY);
}

// The pointer capture API is missing from jsdom, so both calls are feature-detected.
function capturePointer(element: HTMLElement, pointerId: number) {
  if (element.hasPointerCapture?.(pointerId) === false) {
    element.setPointerCapture?.(pointerId);
  }
}

function releasePointer(element: HTMLElement, pointerId: number) {
  if (element.hasPointerCapture?.(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

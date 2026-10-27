// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";
import {
  colorBackgroundItemSelected,
  colorBackgroundToggleButtonNormalPressed,
  colorBorderItemSelected,
} from "@cloudscape-design/design-tokens";

import { fireNonCancelableEvent } from "../../internal/events";
import AsyncStore from "../../internal/utils/async-store";
import { SafeChart } from "../../internal/utils/highcharts";
import { SVGRendererSingle } from "../../internal/utils/renderer-utils";
import { ZoomRange } from "../chart-zoom/interfaces";
import {
  applyPosition,
  applyRect,
  getBandRect,
  getClusterRect,
  getDividerRect,
  isInsidePlot,
  isPixelForward,
  isXAxisHorizontal,
  OverlayRect,
  pixelToValue,
} from "../chart-zoom/zoom-geometry";
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
  ZoomInteraction,
  zoomReducer,
  ZoomState,
} from "../chart-zoom/zoom-state-machine";
import { findNearestIndex, getPageStep, getVisibleXValues } from "../chart-zoom/zoom-values";
import { getFormatter } from "../formatters";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

// How far the pointer must travel before a press is treated as a drag. Shorter movements are clicks, which
// must not commit a zoom: in zoom mode a click sets a range boundary.
const DRAG_THRESHOLD = 10;
const BORDER_WIDTH = 1;

export type ZoomControlsFocusTarget = Exclude<ZoomFocusTarget, "cursor">;

// The reactive state is used to propagate changes to the zoom controls, cursor, and announcer components.
export interface ReactiveZoomState {
  interaction: ZoomInteraction;
  zoomed: boolean;
  canZoom: boolean;
  announcement: string;
  focusRequest: null | { target: ZoomControlsFocusTarget };
}

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
  private machine: ZoomState = IDLE_ZOOM_STATE;
  private localExtremes: null | ZoomExtremes = null;
  private appliedExtremesKey = "";
  private appliedAxis: null | Highcharts.Axis = null;
  private resetRequested = false;
  private values: number[] = [];
  private valuesStale = true;
  private swallowClick = false;
  private stopTrackingPress: null | (() => void) = null;
  private cursorElement: null | HTMLElement = null;
  private clusterElement: null | HTMLElement = null;
  private controlsElement: null | HTMLElement = null;
  private svg = createSvgElements();

  constructor(context: ChartExtraContext, handlers: ChartExtraZoomHandlers) {
    super({ interaction: "idle", zoomed: false, canZoom: true, announcement: "", focusRequest: null });
    this.context = context;
    this.handlers = handlers;
  }

  public get isActive() {
    return getInteraction(this.machine) !== "idle";
  }

  public setCursor = (element: null | HTMLElement) => {
    this.cursorElement = element;
  };

  public setCluster = (element: null | HTMLElement) => {
    this.clusterElement = element;
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
    // Highcharts creates a new chart instance when the chart is re-initialized, which has no extremes applied
    // and no elements drawn yet.
    this.appliedExtremesKey = "";
    this.appliedAxis = null;
    this.svg = createSvgElements();
    this.applyContainerStyle(chart);
    this.applyExtremes(chart);
  };

  public onChartRender = () => {
    this.valuesStale = true;
    this.drawRange(this.context.chart());
    if (!this.enabled) {
      return;
    }
    this.dispatch({ type: "chartRendered" });
    this.syncOverlay();
    const canZoom = canZoomInto(this.getValues().length);
    if (canZoom !== this.get().canZoom) {
      this.set((prev) => ({ ...prev, canZoom }));
    }
  };

  public onChartDestroy = () => {
    const container = this.context.chartOrNull?.container;
    container?.removeEventListener("pointerdown", this.onPlotPointerDown);
    container?.removeEventListener("pointermove", this.onPlotPointerMove);
    container?.removeEventListener("click", this.onPlotClickCapture, true);
    this.stopPress();
    Object.values(this.svg).forEach((element) => element.destroy());
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (!this.enabled) {
      this.localExtremes = null;
      this.machine = IDLE_ZOOM_STATE;
      this.hideOverlay();
      this.set((prev) => ({ ...prev, interaction: "idle" }));
    }
    if (chart) {
      this.applyContainerStyle(chart);
      this.applyExtremes(chart);
    }
    this.syncResetAnnouncement();
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

  public resetZoom = ({ withFocus, isApiCall }: { withFocus: boolean; isApiCall: boolean }) => {
    this.dispatch({ type: "resetZoom", zoomed: !!this.getExtremes(), moveFocus: withFocus, isApiCall });
  };

  public clearFocusRequest = () => {
    this.set((prev) => ({ ...prev, focusRequest: null }));
  };

  // Moves the cursor by the given number of stops towards the start (-1) or the end (+1) of the plot on screen.
  public stepCursor = (direction: -1 | 1, stops = 1) => {
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (xAxis && values.length > 0) {
      this.dispatch({ type: "stepCursor", offset: (isPixelForward(xAxis, values) ? 1 : -1) * direction * stops });
    }
  };

  public onCursorKeyDown = (event: React.KeyboardEvent) => {
    const xAxis = this.xAxis;
    if (!xAxis || getInteraction(this.machine) !== "cursor") {
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
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.controlsElement?.contains(nextTarget)) {
      return;
    }
    this.exitZoomMode({ withFocus: false });
  };

  private get enabled() {
    return !!this.context.settings.zoom?.enabled;
  }

  private get labels() {
    return this.context.settings.zoom!.labels;
  }

  // The axis instance is replaced on chart updates, so it is always read from the chart.
  private get xAxis(): null | Highcharts.Axis {
    return this.context.chartOrNull?.xAxis?.[0] ?? null;
  }

  // The range is controlled when the property is defined, including null, which shows the full data range.
  private get controlled() {
    return this.context.state.zoomRange !== undefined;
  }

  // A controlled reset is announced once the consumer applies it. LiveRegion only announces the same text again
  // once its content changed in between, so the reset announcement is cleared when the chart is zoomed again.
  private syncResetAnnouncement() {
    const resetText = this.context.settings.zoom?.labels.zoomResetAnnouncementText ?? "";
    if (this.resetRequested && !this.getExtremes()) {
      this.resetRequested = false;
      this.announce(resetText);
    } else if (this.getExtremes() && this.get().announcement === resetText) {
      this.announce("");
    }
  }

  private getExtremes(): null | ZoomExtremes {
    if (!this.enabled) {
      return null;
    }
    return this.controlled ? extremesFromRange(this.context.state.zoomRange) : this.localExtremes;
  }

  // The range is applied imperatively: Highcharts keeps the extremes set with setExtremes through chart updates,
  // and falls back to the min and max declared in the axis options when they are cleared.
  private applyExtremes(chart: SafeChart) {
    const extremes = this.getExtremes();
    const key = extremes ? `${extremes.min}:${extremes.max}` : "";
    // An x-axis removed with xAxis: [] and added back is a new axis, which has no range applied yet.
    const xAxis = chart.xAxis?.[0] ?? null;
    const axisReplaced = xAxis !== this.appliedAxis && !!extremes;
    if (xAxis && (key !== this.appliedExtremesKey || axisReplaced)) {
      xAxis.setExtremes(extremes?.min, extremes?.max, true, false);
    }
    this.appliedExtremesKey = key;
    this.appliedAxis = xAxis;
    if (!!extremes !== this.get().zoomed) {
      this.set((prev) => ({ ...prev, zoomed: !!extremes }));
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
      const chart = this.context.chartOrNull;
      this.values = chart ? getVisibleXValues(chart as Highcharts.Chart) : [];
      this.valuesStale = false;
    }
    return this.values;
  }

  private formatValue(value: number): string {
    return getFormatter(this.xAxis ?? undefined)(value);
  }

  private announce(text: string) {
    this.set((prev) => ({ ...prev, announcement: text }));
  }

  // Every zoom interaction goes through here: the machine decides the next state and its effects.
  private dispatch(event: ZoomEvent) {
    const previous = this.machine;
    const { state, effects } = zoomReducer(previous, event, { valuesCount: this.getValues().length });
    if (state === previous && effects.length === 0) {
      return;
    }
    this.machine = state;
    const interaction = getInteraction(state);
    if (interaction !== getInteraction(previous)) {
      this.set((prev) => ({ ...prev, interaction }));
      // The chart keeps tracking the hovered point during the interaction, and would open the tooltip on it
      // once the interaction ends.
      if (interaction === "idle") {
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
        this.announce(this.labels.zoomRangeChangeAnnouncementText(this.formatValue(min), this.formatValue(max)));
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
        if (this.controlled) {
          // A controlled chart cannot reset on its own: the reset is announced once the consumer applies it.
          this.resetRequested = true;
          fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
          break;
        }
        this.localExtremes = null;
        this.applyExtremes(this.context.chart());
        this.announce(this.labels.zoomResetAnnouncementText);
        // A reset requested through the API is not reported back to an uncontrolled chart's consumer.
        if (!effect.isApiCall) {
          fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
        }
        break;
    }
  }

  private describeAnnouncement(announcement: ZoomAnnouncement): string {
    const values = this.getValues();
    switch (announcement.type) {
      case "zoomModeEntered":
        return this.labels.zoomModeEnteredAnnouncementText(this.formatValue(values[announcement.index]));
      case "startPointSet":
        return this.labels.zoomStartPointAnnouncementText(this.formatValue(values[announcement.index]));
      case "zoomModeExited":
        return this.labels.zoomModeExitedAnnouncementText;
    }
  }

  private moveFocus(target: ZoomFocusTarget) {
    if (target === "cursor") {
      this.cursorElement?.focus();
    } else if (this.context.settings.zoom?.hideControls) {
      this.handlers.onFocusChart();
    } else {
      // The buttons to focus are rendered by the controls component, often only as a result of this transition,
      // so the component moves focus once it has rendered.
      this.set((prev) => ({ ...prev, focusRequest: { target } }));
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
    if (!extremes || !xAxis) {
      this.svg.rangeBand.hide();
      this.svg.rangeBorders.hide();
      return;
    }
    const band = getBandRect(chart as Highcharts.Chart, xAxis, extremes.min, extremes.max);
    const start = getDividerRect(chart as Highcharts.Chart, xAxis, extremes.min);
    const end = getDividerRect(chart as Highcharts.Chart, xAxis, extremes.max);
    this.svg.rangeBand.rect(chart.renderer, {
      ...toSvgRect(band),
      fill: colorBackgroundItemSelected,
      zIndex: 0,
      "pointer-events": "none",
      class: testClasses["zoom-range"],
    });
    this.svg.rangeBorders.path(chart.renderer, {
      d: [toSvgLine(start), toSvgLine(end)].join(" "),
      stroke: colorBorderItemSelected,
      "stroke-width": BORDER_WIDTH,
      zIndex: 3,
      "pointer-events": "none",
      class: testClasses["zoom-range-borders"],
    });
  }

  // Draws the current state of the interaction onto the plot, and describes the cursor to assistive technology.
  private syncOverlay() {
    const chart = this.context.chartOrNull as null | Highcharts.Chart;
    const xAxis = this.xAxis;
    const values = this.getValues();
    const view = getOverlayView(this.machine);
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
      applyPosition(this.clusterElement, null, origin);
      return;
    }
    const cursorValue = values[view.cursorIndex];
    const anchorValue = view.anchorIndex === null ? null : values[view.anchorIndex];
    applyRect(this.cursorElement, getDividerRect(chart, xAxis, cursorValue), origin);
    applyPosition(this.clusterElement, getClusterRect(chart, xAxis, cursorValue, this.measureCluster()), origin);
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
          ? this.labels.zoomCursorPositionAnnouncementText(this.formatValue(cursorValue))
          : this.labels.zoomSelectionAnnouncementText(this.formatValue(anchorValue), this.formatValue(cursorValue)),
      );
    }
  }

  private drawSelection(chart: Highcharts.Chart, band: null | OverlayRect, dividers: OverlayRect[]) {
    if (band) {
      this.svg.selectionBand.rect(chart.renderer, {
        ...toSvgRect(band),
        fill: colorBackgroundToggleButtonNormalPressed,
        opacity: 0.5,
        zIndex: 4,
        "pointer-events": "none",
        class: testClasses["zoom-selection"],
      });
    } else {
      this.svg.selectionBand.hide();
    }
    const [start, end] = dividers;
    for (const [element, rect, className] of [
      [this.svg.selectionStart, start, testClasses["zoom-selection-start"]],
      [this.svg.selectionEnd, end, testClasses["zoom-selection-end"]],
    ] as const) {
      if (rect) {
        element.rect(chart.renderer, {
          ...toSvgRect(rect),
          fill: colorBorderItemSelected,
          zIndex: 5,
          "pointer-events": "none",
          class: className,
        });
      } else {
        element.hide();
      }
    }
  }

  private hideOverlay() {
    this.svg.selectionBand.hide();
    this.svg.selectionStart.hide();
    this.svg.selectionEnd.hide();
    const origin = { left: 0, top: 0 };
    applyRect(this.cursorElement, null, origin);
    applyPosition(this.clusterElement, null, origin);
  }

  // The cluster sizes itself from its contents. It keeps its layout box while hidden, so it can be measured.
  private measureCluster() {
    return { width: this.clusterElement?.offsetWidth ?? 0, height: this.clusterElement?.offsetHeight ?? 0 };
  }

  private onPlotPointerDown = (event: PointerEvent) => {
    this.swallowClick = false;
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.getValues();
    // Secondary mouse buttons open context menus and must not start a selection.
    if (!this.enabled || !chart || !xAxis || values.length === 0 || (event.pointerType === "mouse" && event.button)) {
      return;
    }
    const { chartX, chartY } = chart.pointer.normalize(event);
    if (!isInsidePlot(chart as Highcharts.Chart, chartX, chartY)) {
      return;
    }
    const inZoomMode = getInteraction(this.machine) === "cursor";
    this.swallowClick = inZoomMode;
    this.trackPress(chart.container, event.pointerId);
    const index = findNearestIndex(values, pixelToValue(xAxis, chartX, chartY));
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
    if (!chart || !xAxis || this.machine.type === "idle" || values.length === 0) {
      return;
    }
    const press = getPress(this.machine);
    const { chartX, chartY } = chart.pointer.normalize(event);
    const distance = press ? travelledAlongAxis(xAxis, event, press.clientX, press.clientY) : 0;
    this.dispatch({
      type: "pointerMove",
      pointerId: event.pointerId,
      index: findNearestIndex(values, pixelToValue(xAxis, chartX, chartY)),
      passedThreshold: distance >= DRAG_THRESHOLD,
      insidePlot: isInsidePlot(chart as Highcharts.Chart, chartX, chartY),
    });
    // The pointer is only captured once the press is a drag: capturing on press would retarget the click that
    // follows away from the Highcharts container, and clicking the chart would no longer pin a point.
    if (this.machine.type === "dragging") {
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

function createSvgElements() {
  return {
    rangeBand: new SVGRendererSingle(),
    rangeBorders: new SVGRendererSingle(),
    selectionBand: new SVGRendererSingle(),
    selectionStart: new SVGRendererSingle(),
    selectionEnd: new SVGRendererSingle(),
  };
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

function toSvgRect({ left, top, width, height }: OverlayRect) {
  return { x: left, y: top, width, height };
}

function toSvgLine({ left, top, width, height }: OverlayRect) {
  return width <= height
    ? `M ${left + width / 2} ${top} L ${left + width / 2} ${top + height}`
    : `M ${left} ${top + height / 2} L ${left + width} ${top + height / 2}`;
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

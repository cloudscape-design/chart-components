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
  getOverlayView,
  IDLE_ZOOM_STATE,
  isZooming,
  ZoomAnnouncement,
  ZoomEffect,
  ZoomEvent,
  ZoomFocusTarget,
  zoomReducer,
  ZoomState,
} from "../chart-zoom/zoom-state-machine";
import { createStopMapper, findNearestIndex, getCursorStops, getPageStep } from "../chart-zoom/zoom-utils";
import { getFormatter } from "../formatters";
import { Rect } from "../interfaces";
import { ZoomRange } from "../internal-interfaces";
import { isInsidePlot } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

export type ZoomControlsFocusTarget = Exclude<ZoomFocusTarget, "cursor">;

// The reactive state is used to propagate changes to the zoom controls and announcer components.
export interface ReactiveZoomState {
  zoomed: boolean;
  zooming: boolean;
  canZoom: boolean;
  announcement: string;
  announcementKey: number;
}

export interface FocusableButton {
  focus(): void;
}

export interface ChartExtraZoomHandlers {
  onClearHighlight(): void;
  onHideTooltip(): void;
  onFocusChart(): void;
}

interface ZoomExtremes {
  min: number;
  max: number;
}

// Chart helper that implements zooming into a range of the first x-axis.
export class ChartExtraZoom extends AsyncStore<ReactiveZoomState> {
  private context: ChartExtraContext;
  private handlers: ChartExtraZoomHandlers;
  private interaction: ZoomState = IDLE_ZOOM_STATE;
  private localExtremes: null | ZoomExtremes = null;
  private values: number[] = [];
  private valuesStale = true;
  private suppressNextChartClick = false;
  private listenedDocument: null | Document = null;
  private pressPointerId: null | number = null;
  private cursorElement: null | HTMLElement = null;
  private controlsElement: null | HTMLElement = null;
  private zoomButton: null | FocusableButton = null;
  private resetButton: null | FocusableButton = null;
  private pendingButtonFocus: null | ZoomControlsFocusTarget = null;
  private renderedControls: null | { zoomed: boolean; zooming: boolean; canZoom: boolean } = null;
  private rangeBand = new SVGRendererSingle();
  private rangeBorders = new SVGRendererSingle();
  private selectionBand = new SVGRendererSingle();
  private selectionStart = new SVGRendererSingle();

  constructor(context: ChartExtraContext, handlers: ChartExtraZoomHandlers) {
    super({
      zooming: false,
      zoomed: false,
      canZoom: true,
      announcement: "",
      announcementKey: 0,
    });
    this.context = context;
    this.handlers = handlers;
  }

  public get isActive() {
    return isZooming(this.interaction);
  }

  public setCursor = (element: null | HTMLElement) => {
    this.cursorElement = element;
  };

  public consumeChartClick = () => {
    const consumed = this.suppressNextChartClick;
    this.suppressNextChartClick = false;
    return consumed;
  };

  public setControls = (element: null | HTMLElement) => {
    this.controlsElement = element;
  };

  public setZoomButton = (button: null | FocusableButton) => {
    this.zoomButton = button;
  };

  public setResetButton = (button: null | FocusableButton) => {
    this.resetButton = button;
  };

  public onZoomControlsUpdate = () => {
    const { zoomed, zooming, canZoom } = this.get();
    this.renderedControls = { zoomed, zooming, canZoom };
    this.completeButtonFocus();
  };

  public onChartLoad = (chart: SafeChart) => {
    if (!chart.container) {
      return;
    }
    chart.container.addEventListener("pointerdown", this.onPlotPointerDown);
    chart.container.addEventListener("pointermove", this.onPlotPointerMove);
    this.listenedDocument = chart.container.ownerDocument;
    this.listenedDocument.addEventListener("pointerup", this.onDocumentPointerUp);
    this.listenedDocument.addEventListener("pointercancel", this.onDocumentPointerCancel);
  };

  public onChartRender = () => {
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
    this.listenedDocument?.removeEventListener("pointerup", this.onDocumentPointerUp);
    this.listenedDocument?.removeEventListener("pointercancel", this.onDocumentPointerCancel);
    this.listenedDocument = null;
    this.pressPointerId = null;
    this.rangeBand.destroy();
    this.rangeBorders.destroy();
    this.selectionBand.destroy();
    this.selectionStart.destroy();
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (!this.enabled) {
      this.localExtremes = null;
      this.interaction = IDLE_ZOOM_STATE;
      this.hideOverlay();
      this.setCommon({ zooming: false });
    }
    if (chart) {
      this.reconcile(chart);
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
    this.dispatch({ type: "enterZoomMode", startIndex: isPixelForward(xAxis, values) ? 0 : values.length - 1 });
  };

  public exitZoomMode = ({ withFocus }: { withFocus: boolean }) => {
    this.dispatch({ type: "exitZoomMode", moveFocus: withFocus });
  };

  public resetZoom = ({ withFocus }: { withFocus: boolean }) => {
    this.dispatch({ type: "resetZoom", zoomed: !!this.getExtremes() });
    if (withFocus) {
      this.moveFocus("zoomButton");
    }
  };

  public clearPendingButtonFocus = () => {
    this.pendingButtonFocus = null;
  };

  private stepCursor = (direction: -1 | 1, stops = 1) => {
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (xAxis && values.length > 0) {
      this.dispatch({ type: "stepCursor", offset: (isPixelForward(xAxis, values) ? 1 : -1) * direction * stops });
    }
  };

  public onCursorKeyDown = (event: React.KeyboardEvent) => {
    const xAxis = this.xAxis;
    if (!xAxis || !isZooming(this.interaction)) {
      return;
    }
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
        this.dispatch({ type: "stepCursor", offset: -pageStop });
        break;
      case KeyCode.pageDown:
        this.dispatch({ type: "stepCursor", offset: pageStop });
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
      event.stopPropagation();
    }
  };

  public onCursorBlur = (event: React.FocusEvent) => {
    if (!this.isFocusWithinZoom(event.relatedTarget)) {
      this.exitZoomMode({ withFocus: false });
    }
  };

  public onControlsBlur = (event: React.FocusEvent) => {
    if (!this.isFocusWithinZoom(event.relatedTarget)) {
      this.exitZoomMode({ withFocus: false });
      this.clearPendingButtonFocus();
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

  private get xAxis(): null | Highcharts.Axis {
    return this.context.chartOrNull?.xAxis?.[0] ?? null;
  }

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
    // Zooming clears the reset announcement, so that LiveRegion announces the next reset again. When the range is
    // cleared, the announcement made by Reset is kept.
    if (!!extremes !== this.get().zoomed) {
      const resetText = this.labels.zoomResetAnnouncementText ?? "";
      const { announcement } = this.get();
      this.setCommon({ zoomed: !!extremes, announcement: extremes && announcement === resetText ? "" : announcement });
    }
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
    this.setCommon({ announcement: text, announcementKey: this.get().announcementKey + 1 });
  }

  private setCommon(update: Partial<ReactiveZoomState>) {
    this.set((state) => ({ ...state, ...update }));
  }

  private dispatch(event: ZoomEvent) {
    const previous = this.interaction;
    const { state, effects } = zoomReducer(previous, event, { valuesCount: this.getValues().length });
    const changed = state !== previous && !(state.type === "idle" && previous.type === "idle");
    if (!changed && effects.length === 0) {
      return;
    }
    this.interaction = state;
    if (isZooming(state) !== isZooming(previous)) {
      this.setCommon({ zooming: isZooming(state) });
      if (!isZooming(state)) {
        this.handlers.onClearHighlight();
      }
    }
    if (state.type !== "idle") {
      this.pendingButtonFocus = null;
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
        this.handlers.onHideTooltip();
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
        // The chart cannot reset a controlled range on its own: it asks the consumer to show the full range.
        if (!this.controlled) {
          this.localExtremes = null;
          this.applyExtremes(this.context.chart());
        }
        this.announce(this.labels.zoomResetAnnouncementText ?? "");
        fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
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
      this.clearPendingButtonFocus();
      this.cursorElement?.focus();
    } else if (!this.controlsElement) {
      this.handlers.onFocusChart();
    } else {
      this.pendingButtonFocus = target;
      if (!this.controlsWillUpdate()) {
        this.completeButtonFocus();
      }
    }
  }

  private controlsWillUpdate() {
    const rendered = this.renderedControls;
    const { zoomed, zooming, canZoom } = this.get();
    return !rendered || rendered.zoomed !== zoomed || rendered.zooming !== zooming || rendered.canZoom !== canZoom;
  }

  private completeButtonFocus() {
    const target = this.pendingButtonFocus;
    if (!target) {
      return;
    }
    if (target === "resetButton" && this.resetButton) {
      this.pendingButtonFocus = null;
      this.resetButton.focus();
      return;
    }
    const canZoom = !!this.renderedControls?.canZoom;
    const waitForReset = target === "resetButton" && !!this.zoomButton && canZoom;
    if (this.zoomButton && canZoom) {
      this.zoomButton.focus();
    } else {
      this.handlers.onFocusChart();
    }
    if (!waitForReset) {
      this.pendingButtonFocus = null;
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

  private syncOverlay() {
    const chart = this.context.chartOrNull as null | Highcharts.Chart;
    const xAxis = this.xAxis;
    const values = this.getValues();
    const view = getOverlayView(this.interaction);
    if (!chart || !xAxis || values.length === 0 || view.type === "hidden") {
      this.hideOverlay();
      return;
    }
    const origin = { left: chart.container.offsetLeft, top: chart.container.offsetTop };
    const cursorValue = values[view.cursorIndex];
    const anchorValue = view.anchorIndex === null ? null : values[view.anchorIndex];
    applyRect(this.cursorElement, getDividerRect(chart, xAxis, cursorValue), origin);
    this.drawSelection(chart, xAxis, anchorValue, cursorValue);
    const cursor = this.cursorElement;
    if (cursor) {
      cursor.setAttribute("aria-valuemin", `${values[0]}`);
      cursor.setAttribute("aria-valuemax", `${values[values.length - 1]}`);
      cursor.setAttribute("aria-valuenow", `${cursorValue}`);
      cursor.setAttribute(
        "aria-valuetext",
        anchorValue === null
          ? this.formatValue(cursorValue)
          : (this.labels.zoomSelectionAnnouncementText?.(
              this.formatValue(anchorValue),
              this.formatValue(cursorValue),
            ) ?? ""),
      );
    }
  }

  private drawSelection(
    chart: Highcharts.Chart,
    xAxis: Highcharts.Axis,
    anchorValue: null | number,
    cursorValue: number,
  ) {
    this.selectionBand.hide();
    this.selectionStart.hide();
    if (anchorValue === null) {
      return;
    }
    this.selectionBand.rect(chart.renderer, {
      ...Styles.zoomSelectionBand,
      ...getBandRect(chart, xAxis, anchorValue, cursorValue),
      class: testClasses["zoom-selection"],
    });
    this.selectionStart.rect(chart.renderer, {
      ...Styles.zoomSelectionDivider,
      ...getDividerRect(chart, xAxis, anchorValue),
      class: testClasses["zoom-selection-start"],
    });
  }

  private hideOverlay() {
    this.selectionBand.hide();
    this.selectionStart.hide();
    const origin = { left: 0, top: 0 };
    applyRect(this.cursorElement, null, origin);
  }

  private onPlotPointerDown = (event: PointerEvent) => {
    this.suppressNextChartClick = false;
    if (!this.enabled || !isZooming(this.interaction) || (event.pointerType === "mouse" && event.button)) {
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
    this.suppressNextChartClick = true;
    this.pressPointerId = event.pointerId;
    this.dispatch({
      type: "pointerDown",
      press: { pointerId: event.pointerId, startIndex: findStopAtPointer(values, xAxis, chartX, chartY) },
    });
    event.preventDefault();
  };

  private onPlotPointerMove = (event: PointerEvent) => {
    if (!this.enabled || this.interaction.type !== "selecting") {
      return;
    }
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.getValues();
    if (!chart || !xAxis || values.length === 0) {
      return;
    }
    const { chartX, chartY } = chart.pointer.normalize(event);
    this.dispatch({
      type: "pointerMove",
      index: findStopAtPointer(values, xAxis, chartX, chartY),
      insidePlot: isInsidePlot(chart as Highcharts.Chart, chartX, chartY),
    });
  };

  private onDocumentPointerUp = (event: PointerEvent) => {
    if (event.pointerId === this.pressPointerId) {
      this.pressPointerId = null;
      this.dispatch({ type: "pointerUp", pointerId: event.pointerId });
    }
  };

  private onDocumentPointerCancel = (event: PointerEvent) => {
    if (event.pointerId === this.pressPointerId) {
      this.pressPointerId = null;
      this.dispatch({ type: "pointerCancel", pointerId: event.pointerId });
    }
  };
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

function isXAxisHorizontal(xAxis: Pick<Highcharts.Axis, "horiz">): boolean {
  return xAxis.horiz !== false;
}

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

function valueToPixel(xAxis: Highcharts.Axis, value: number): number {
  return xAxis.toPixels(value, false);
}

function isPixelForward(xAxis: Highcharts.Axis, values: readonly number[]): boolean {
  if (values.length < 2) {
    return true;
  }
  return valueToPixel(xAxis, values[values.length - 1]) >= valueToPixel(xAxis, values[0]);
}

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

interface OverlayOrigin {
  left: number;
  top: number;
}

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

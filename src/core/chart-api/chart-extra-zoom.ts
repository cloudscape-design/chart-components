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
  INACTIVE_ZOOM_STATE,
  isZooming,
  ZoomAnnouncement,
  ZoomCancelReason,
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

// The reactive state is used to propagate changes to the zoom controls and announcer components.
export interface ReactiveZoomState {
  zoomed: boolean;
  zooming: boolean;
  canZoom: boolean;
  announcement: string;
  // Changes with every announcement. The live region is keyed by it, so that an announcement repeating the previous
  // text, like setting the same start point twice, is announced again.
  announcementKey: number;
}

export interface ChartExtraZoomHandlers {
  onHideTooltip(): void;
}

export interface FocusableControl {
  focus(): void;
}

interface ZoomExtremes {
  min: number;
  max: number;
}

// Chart helper that implements zooming into a range of the first x-axis.
export class ChartExtraZoom extends AsyncStore<ReactiveZoomState> {
  private context: ChartExtraContext;
  private handlers: ChartExtraZoomHandlers;
  private interaction: ZoomState = INACTIVE_ZOOM_STATE;
  private pressIndex: null | number = null;
  private localExtremes: null | ZoomExtremes = null;
  private values: number[] = [];
  // A press that sets a zoom boundary is followed by a chart click, which can arrive after the press has ended zoom mode.
  // The pointer stays locked until that click, so that it does not pin a tooltip or reach the consumer's click handler.
  private pressClickPending = false;
  private container: null | HTMLElement = null;
  private cursorElement: null | HTMLElement = null;
  private controlsElement: null | HTMLElement = null;
  private zoomButton: null | FocusableControl = null;
  private resetButton: null | FocusableControl = null;
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

  public get pointerLocked() {
    return isZooming(this.interaction) || this.pressClickPending;
  }

  public setCursor = (element: null | HTMLElement) => {
    this.cursorElement = element;
  };

  public setControls = (element: null | HTMLElement) => {
    this.controlsElement = element;
  };

  public setZoomButton = (button: null | FocusableControl) => {
    this.zoomButton = button;
  };

  public setResetButton = (button: null | FocusableControl) => {
    this.resetButton = button;
  };

  public onChartLoad = (chart: SafeChart) => {
    if (!chart.container) {
      return;
    }
    this.container = chart.container;
    this.container.addEventListener("pointerdown", this.onPlotPointerDown);
    this.container.addEventListener("pointermove", this.onPlotPointerMove);
    this.container.addEventListener("click", this.onContainerClick);
    this.container.ownerDocument.addEventListener("pointerup", this.onDocumentPointerUp);
    this.container.ownerDocument.addEventListener("pointercancel", this.onDocumentPointerCancel);
  };

  public onChartRender = () => {
    const previousValues = this.values;
    this.reconcile(this.context.chart());
    if (!this.enabled) {
      return;
    }
    this.updateValues();
    const stopMapper = createStopMapper(previousValues, this.values);
    this.dispatch({ type: "rendered", stopMapper });
    if (this.pressIndex !== null) {
      this.pressIndex = stopMapper.nearest(this.pressIndex);
    }
    this.updateCanZoom();
  };

  public onChartDestroy = () => {
    const container = this.container;
    container?.removeEventListener("pointerdown", this.onPlotPointerDown);
    container?.removeEventListener("pointermove", this.onPlotPointerMove);
    container?.removeEventListener("click", this.onContainerClick);
    container?.ownerDocument.removeEventListener("pointerup", this.onDocumentPointerUp);
    container?.ownerDocument.removeEventListener("pointercancel", this.onDocumentPointerCancel);
    this.container = null;
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
      this.interaction = INACTIVE_ZOOM_STATE;
      this.pressIndex = null;
      this.pressClickPending = false;
      this.hideOverlay();
      this.setCommon({ zooming: false });
    }
    if (chart) {
      this.reconcile(chart);
      if (this.enabled) {
        this.updateValues();
        this.updateCanZoom();
      }
    }
  };

  public enterZoomMode = () => {
    this.dispatch({ type: "enter" });
  };

  public exitZoomMode = (reason: ZoomCancelReason) => {
    this.dispatch({ type: "cancel", reason });
  };

  public resetZoom = () => {
    if (this.getExtremes()) {
      // The chart cannot reset a controlled range on its own: it asks the consumer to show the full range.
      if (!this.controlled) {
        this.localExtremes = null;
        this.applyExtremes(this.context.chart());
      }
      this.announce(this.labels.zoomResetAnnouncementText ?? "");
      fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
    }
    // The Reset button goes away with the range, so the focus moves on before that happens.
    this.moveFocus("zoomButton");
  };

  public onCursorKeyDown = (event: React.KeyboardEvent) => {
    const xAxis = this.xAxis;
    if (!xAxis || this.interaction.type === "inactive") {
      return;
    }
    const { cursorIndex } = this.interaction;
    const vertical = !isXAxisHorizontal(xAxis);
    const pageStop = getPageStep(this.values.length);
    const arrowStop = isPixelForward(xAxis, this.values) ? 1 : -1;
    let handled = true;
    switch (event.keyCode) {
      case vertical ? KeyCode.up : KeyCode.left:
        this.dispatchInput({ type: "move", index: cursorIndex - arrowStop });
        break;
      case vertical ? KeyCode.down : KeyCode.right:
        this.dispatchInput({ type: "move", index: cursorIndex + arrowStop });
        break;
      case KeyCode.pageUp:
        this.dispatchInput({ type: "move", index: cursorIndex - pageStop });
        break;
      case KeyCode.pageDown:
        this.dispatchInput({ type: "move", index: cursorIndex + pageStop });
        break;
      case KeyCode.home:
        this.dispatchInput({ type: "move", index: 0 });
        break;
      case KeyCode.end:
        this.dispatchInput({ type: "move", index: this.values.length - 1 });
        break;
      case KeyCode.enter:
      case KeyCode.space:
        this.dispatchInput({ type: "commit" });
        break;
      case KeyCode.escape:
        this.exitZoomMode("escape");
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  public onBlur = (event: React.FocusEvent) => {
    if (!this.isFocusWithinZoom(event.relatedTarget)) {
      this.exitZoomMode("blur");
    }
  };

  private updateCanZoom() {
    const canZoom = canZoomInto(this.values.length);
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
    if (!!extremes !== this.get().zoomed) {
      this.setCommon({ zoomed: !!extremes });
    }
  }

  private updateValues() {
    this.values = getCursorStops(this.context.derived, this.xAxis);
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
    const { state, effects } = zoomReducer(previous, event, { valuesCount: this.values.length });
    if (state === previous && effects.length === 0) {
      return;
    }
    this.interaction = state;
    if (!isZooming(state)) {
      this.pressIndex = null;
    }
    if (isZooming(state) !== isZooming(previous)) {
      this.setCommon({ zooming: isZooming(state) });
      if (isZooming(state)) {
        this.handlers.onHideTooltip();
      }
    }
    for (const effect of effects) {
      this.runEffect(effect);
    }
    this.syncOverlay();
    // The focus moves last, once the overlay shows the cursor at its position.
    for (const effect of effects) {
      if (effect.type === "focus") {
        this.moveFocus(effect.target);
      }
    }
  }

  private dispatchInput(event: ZoomEvent) {
    if (this.pressIndex === null) {
      this.dispatch(event);
    }
  }

  private moveFocus(target: ZoomFocusTarget) {
    switch (target) {
      case "cursor":
        this.cursorElement?.focus();
        break;
      case "zoomButton":
        this.zoomButton?.focus();
        break;
      case "resetButton":
        this.resetButton?.focus();
        break;
    }
  }

  private runEffect(effect: ZoomEffect) {
    switch (effect.type) {
      case "announce":
        this.announce(this.describeAnnouncement(effect.announcement));
        break;
      case "applyZoom": {
        const values = this.values;
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
    }
  }

  private describeAnnouncement(announcement: ZoomAnnouncement): string {
    const values = this.values;
    switch (announcement.type) {
      case "zoomModeEntered":
        return this.labels.zoomModeEnteredAnnouncementText?.(this.formatValue(values[announcement.index])) ?? "";
      case "startPointSet":
        return this.labels.zoomStartPointAnnouncementText?.(this.formatValue(values[announcement.index])) ?? "";
      case "zoomModeExited":
        return this.labels.zoomModeExitedAnnouncementText ?? "";
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
    const values = this.values;
    const state = this.interaction;
    if (!chart || !xAxis || state.type === "inactive") {
      this.hideOverlay();
      return;
    }
    const origin = { left: chart.container.offsetLeft, top: chart.container.offsetTop };
    const cursorValue = values[state.cursorIndex];
    const anchorValue = state.type === "pendingSecondInput" ? values[state.startIndex] : null;
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
    if (this.cursorElement) {
      this.cursorElement.style.visibility = "hidden";
    }
  }

  private onPlotPointerDown = (event: PointerEvent) => {
    this.pressClickPending = false;
    if (!isZooming(this.interaction) || (event.pointerType === "mouse" && event.button)) {
      return;
    }
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.values;
    if (!chart || !xAxis) {
      return;
    }
    const { chartX, chartY } = chart.pointer.normalize(event);
    if (!isInsidePlot(chart as Highcharts.Chart, chartX, chartY)) {
      return;
    }
    this.pressClickPending = true;
    this.pressIndex = findStopAtPointer(values, xAxis, chartX, chartY);
    event.preventDefault();
  };

  private onPlotPointerMove = (event: PointerEvent) => {
    if (!isZooming(this.interaction) || this.pressIndex !== null) {
      return;
    }
    const chart = this.context.chartOrNull;
    const xAxis = this.xAxis;
    const values = this.values;
    if (!chart || !xAxis) {
      return;
    }
    const { chartX, chartY } = chart.pointer.normalize(event);
    if (isInsidePlot(chart as Highcharts.Chart, chartX, chartY)) {
      this.dispatch({ type: "move", index: findStopAtPointer(values, xAxis, chartX, chartY) });
    }
  };

  private onContainerClick = () => {
    this.pressClickPending = false;
  };

  private onDocumentPointerUp = (event: PointerEvent) => {
    if (!(event.target instanceof Node && this.container?.contains(event.target))) {
      this.pressClickPending = false;
    }
    const index = this.pressIndex;
    if (index !== null) {
      this.pressIndex = null;
      this.dispatch({ type: "move", index });
      this.dispatch({ type: "commit" });
    }
  };

  private onDocumentPointerCancel = () => {
    this.pressIndex = null;
    this.pressClickPending = false;
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

function applyRect(element: null | HTMLElement, rect: Rect, origin: OverlayOrigin) {
  if (!element) {
    return;
  }
  element.style.visibility = "visible";
  element.style.left = `${origin.left + rect.x}px`;
  element.style.top = `${origin.top + rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

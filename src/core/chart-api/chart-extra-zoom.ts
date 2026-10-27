// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorBackgroundItemSelected, colorBorderItemSelected } from "@cloudscape-design/design-tokens";

import { fireNonCancelableEvent } from "../../internal/events";
import AsyncStore from "../../internal/utils/async-store";
import { SafeChart } from "../../internal/utils/highcharts";
import { SVGRendererSingle } from "../../internal/utils/renderer-utils";
import { ZoomRange } from "../chart-zoom/interfaces";
import { getBandRect, getDividerRect, OverlayRect } from "../chart-zoom/zoom-geometry";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

const BORDER_WIDTH = 1;

// The reactive state is used to propagate changes to the zoom controls and announcer components.
export interface ReactiveZoomState {
  zoomed: boolean;
  announcement: string;
}

interface ZoomExtremes {
  min: number;
  max: number;
}

// Chart helper that implements zooming into a range of the first x-axis. The range is controlled by the consumer
// with the zoomRange property: the helper applies it to the axis, and marks it on the plot.
export class ChartExtraZoom extends AsyncStore<ReactiveZoomState> {
  private context: ChartExtraContext;
  private appliedExtremesKey = "";
  private appliedAxis: null | Highcharts.Axis = null;
  private resetRequested = false;
  private svg = createSvgElements();

  constructor(context: ChartExtraContext) {
    super({ zoomed: false, announcement: "" });
    this.context = context;
  }

  public onChartLoad = (chart: SafeChart) => {
    // Highcharts creates a new chart instance when the chart is re-initialized, which has no extremes applied
    // and no elements drawn yet.
    this.appliedExtremesKey = "";
    this.appliedAxis = null;
    this.svg = createSvgElements();
    this.applyExtremes(chart);
  };

  public onChartRender = () => {
    this.drawRange(this.context.chart());
  };

  public onChartDestroy = () => {
    Object.values(this.svg).forEach((element) => element.destroy());
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (chart) {
      this.applyExtremes(chart);
    }
    this.syncResetAnnouncement();
  };

  // The chart cannot reset a controlled range on its own: it asks the consumer, and announces the reset once applied.
  public resetZoom = () => {
    if (this.getExtremes()) {
      this.resetRequested = true;
      fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
    }
  };

  // A controlled reset is announced once the consumer applies it. LiveRegion only announces the same text again
  // once its content changed in between, so the reset announcement is cleared when the chart is zoomed again.
  private syncResetAnnouncement() {
    const resetText = this.context.settings.zoom?.labels.zoomResetAnnouncementText ?? "";
    if (this.resetRequested && !this.getExtremes()) {
      this.resetRequested = false;
      this.set((prev) => ({ ...prev, announcement: resetText }));
    } else if (this.getExtremes() && this.get().announcement === resetText) {
      this.set((prev) => ({ ...prev, announcement: "" }));
    }
  }

  private getExtremes(): null | ZoomExtremes {
    return this.context.settings.zoom?.enabled ? extremesFromRange(this.context.state.zoomRange) : null;
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
}

function createSvgElements() {
  return { rangeBand: new SVGRendererSingle(), rangeBorders: new SVGRendererSingle() };
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

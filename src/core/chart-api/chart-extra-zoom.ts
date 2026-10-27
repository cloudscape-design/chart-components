// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import * as Styles from "../../internal/chart-styles";
import { fireNonCancelableEvent } from "../../internal/events";
import AsyncStore from "../../internal/utils/async-store";
import { SafeChart } from "../../internal/utils/highcharts";
import { SVGRendererSingle } from "../../internal/utils/renderer-utils";
import { ZoomRange } from "../chart-zoom/interfaces";
import { getBandRect, getDividerRect } from "../chart-zoom/zoom-geometry";
import { Rect } from "../interfaces";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

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
  private appliedRange = false;
  private resetRequested = false;
  private svg = createSvgElements();

  constructor(context: ChartExtraContext) {
    super({ zoomed: false, announcement: "" });
    this.context = context;
  }

  // The range is reconciled on every render, because the x-axis can be replaced by any chart update.
  public onChartRender = () => {
    this.reconcile(this.context.chart());
  };

  public onChartDestroy = () => {
    Object.values(this.svg).forEach((element) => element.destroy());
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (chart) {
      this.reconcile(chart);
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
    const resetText = this.context.settings.labels.zoomResetAnnouncementText ?? "";
    if (this.resetRequested && !this.getExtremes()) {
      this.resetRequested = false;
      this.set((prev) => ({ ...prev, announcement: resetText }));
    } else if (this.getExtremes() && this.get().announcement === resetText) {
      this.set((prev) => ({ ...prev, announcement: "" }));
    }
  }

  private getExtremes(): null | ZoomExtremes {
    return this.context.settings.zoomEnabled ? extremesFromRange(this.context.state.zoomRange) : null;
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
      } else if (!extremes && this.appliedRange && (userMin !== undefined || userMax !== undefined)) {
        xAxis.setExtremes(undefined, undefined, true, false);
      }
    }
    this.appliedRange = !!extremes;
    if (!!extremes !== this.get().zoomed) {
      this.set((prev) => ({ ...prev, zoomed: !!extremes }));
    }
  }

  // Marks the zoomed range on the plot with a tinted band and a border at each end.
  private drawRange(chart: SafeChart) {
    const extremes = this.getExtremes();
    const xAxis = chart.xAxis?.[0];
    // Hiding first destroys the elements of a chart instance that Highcharts has replaced, like the tooltip cursor.
    this.svg.rangeBand.hide();
    this.svg.rangeBorders.hide();
    if (!extremes || !xAxis) {
      return;
    }
    const band = getBandRect(chart as Highcharts.Chart, xAxis, extremes.min, extremes.max);
    const start = getDividerRect(chart as Highcharts.Chart, xAxis, extremes.min);
    const end = getDividerRect(chart as Highcharts.Chart, xAxis, extremes.max);
    this.svg.rangeBand.rect(chart.renderer, { ...Styles.zoomRangeBand, ...band, class: testClasses["zoom-range"] });
    this.svg.rangeBorders.path(chart.renderer, {
      ...Styles.zoomRangeBorders,
      d: [toSvgLine(start), toSvgLine(end)].join(" "),
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

function toSvgLine({ x, y, width, height }: Rect) {
  return width <= height
    ? `M ${x + width / 2} ${y} L ${x + width / 2} ${y + height}`
    : `M ${x} ${y + height / 2} L ${x + width} ${y + height / 2}`;
}

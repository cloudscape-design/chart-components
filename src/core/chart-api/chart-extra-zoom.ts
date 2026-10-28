// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as Styles from "../../internal/chart-styles";
import { fireNonCancelableEvent } from "../../internal/events";
import AsyncStore from "../../internal/utils/async-store";
import { SafeChart } from "../../internal/utils/highcharts";
import { SVGRendererSingle } from "../../internal/utils/renderer-utils";
import { ZoomRange } from "../chart-zoom/interfaces";
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
  private rangeBand = new SVGRendererSingle();
  private rangeBorders = new SVGRendererSingle();

  constructor(context: ChartExtraContext) {
    super({ zoomed: false, announcement: "" });
    this.context = context;
  }

  public onChartRender = () => {
    this.reconcile(this.context.chart());
  };

  public onChartDestroy = () => {
    this.rangeBand.destroy();
    this.rangeBorders.destroy();
  };

  // Called when the zoom settings or the controlled zoom range change.
  public onZoomPropsChange = () => {
    const chart = this.context.chartOrNull;
    if (chart) {
      this.reconcile(chart);
    }
  };

  // The chart cannot reset a controlled range on its own: it asks the consumer to show the full range.
  public resetZoom = () => {
    if (this.getExtremes()) {
      fireNonCancelableEvent(this.context.handlers.onZoomRangeChange, { zoomRange: null });
      this.set((prev) => ({ ...prev, announcement: this.context.settings.labels.zoomResetAnnouncementText ?? "" }));
    }
  };

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
      } else if (!extremes && this.get().zoomed && (userMin !== undefined || userMax !== undefined)) {
        xAxis.setExtremes(undefined, undefined, true, false);
      }
    }
    // The reset announcement is cleared once the chart is zoomed, so that LiveRegion announces the next reset again.
    if (!!extremes !== this.get().zoomed) {
      const resetText = this.context.settings.labels.zoomResetAnnouncementText ?? "";
      this.set((prev) => ({
        ...prev,
        zoomed: !!extremes,
        announcement: extremes && prev.announcement === resetText ? "" : prev.announcement,
      }));
    }
  }

  // Marks the zoomed range on the plot with a tinted band and a border at each end.
  private drawRange(chart: SafeChart) {
    const extremes = this.getExtremes();
    const xAxis = chart.xAxis?.[0];
    // Hiding first destroys the elements of a chart instance that Highcharts has replaced, like the tooltip cursor.
    this.rangeBand.hide();
    this.rangeBorders.hide();
    if (!extremes || !xAxis) {
      return;
    }
    // In an inverted chart the x-axis runs vertically, so the band and the borders span the plot horizontally.
    const horizontal = xAxis.horiz !== false;
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
    const from = xAxis.toPixels(extremes.min, false);
    const to = xAxis.toPixels(extremes.max, false);
    const start = Math.min(from, to);
    // A range of a single value still needs a visible band, hence the minimum of one pixel.
    const size = Math.max(1, Math.abs(to - from));
    const band = horizontal
      ? { x: start, y: plotTop, width: size, height: plotHeight }
      : { x: plotLeft, y: start, width: plotWidth, height: size };
    const border = (pixel: number) =>
      horizontal
        ? `M ${pixel} ${plotTop} L ${pixel} ${plotTop + plotHeight}`
        : `M ${plotLeft} ${pixel} L ${plotLeft + plotWidth} ${pixel}`;
    this.rangeBand.rect(chart.renderer, { ...Styles.zoomRangeBand, ...band, class: testClasses["zoom-range"] });
    this.rangeBorders.path(chart.renderer, {
      ...Styles.zoomRangeBorders,
      d: `${border(from)} ${border(to)}`,
      class: testClasses["zoom-range-borders"],
    });
  }
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

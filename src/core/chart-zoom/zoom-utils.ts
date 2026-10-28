// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getChartSeries, getSeriesData } from "../../internal/utils/highcharts";
import { hasColumnLikeSeries } from "../utils";

// A zoomed range always spans at least this many data points. Selecting a single point produces a range
// with no width, which Highcharts cannot display and which the user cannot zoom out of by zooming again.
export const MIN_ZOOM_POINTS = 2;

// Error bar series are excluded everywhere x values are collected. Their data items declare `low` and
// `high` but may omit `x` (see CoreChartProps range data), in which case Highcharts assigns index-based
// x values that have nothing to do with the parent series' x values, and would otherwise appear as
// cursor stops of their own.
function isZoomableSeries(series: { type?: string }) {
  return series.type !== "errorbar";
}

// Collects the x values the zoom cursor can land on, sorted ascending. Only values inside the current
// axis extremes are returned: once zoomed in, the cursor must not be able to step outside the visible
// window, and Highcharts keeps out-of-range points in the series until the series exceeds cropThreshold.
export function getVisibleXValues(chart: Highcharts.Chart): number[] {
  // The render event can fire before the axes exist, for example when the chart has no data at all.
  const xAxis = chart.xAxis?.[0];
  const { min, max } = xAxis ? xAxis.getExtremes() : { min: undefined, max: undefined };
  const xValues = new Set<number>();
  for (const series of getChartSeries(chart)) {
    if (series.visible && isZoomableSeries(series)) {
      for (const point of getSeriesData(series)) {
        if ((typeof min !== "number" || point.x >= min) && (typeof max !== "number" || point.x <= max)) {
          xValues.add(point.x);
        }
      }
    }
  }
  return Array.from(xValues).sort((a, b) => a - b);
}

// Index of the value closest to the target. Binary search, because this runs for every pointer move and
// every cursor step, on series that can hold tens of thousands of points.
export function findNearestIndex(values: readonly number[], target: number): number {
  if (values.length === 0) {
    return -1;
  }
  let lo = 0;
  let hi = values.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (values[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // The search settles on the first value >= target, so its predecessor can still be the closer one.
  if (lo > 0 && Math.abs(values[lo - 1] - target) <= Math.abs(values[lo] - target)) {
    return lo - 1;
  }
  return lo;
}

// The number of cursor stops a page step covers. Small series step by one point, so paging still moves
// the cursor when the visible window holds fewer than ten points.
export function getPageStep(valuesCount: number): number {
  return Math.max(1, Math.floor(valuesCount / 10));
}

// Resolves the Highcharts options the zoom depends on. When zoom is enabled, Highcharts' own drag-to-zoom is turned
// off, and the axis and error bars are set up to show the zoomed range exactly. Otherwise the chart's own and the
// global Highcharts.setOptions values are given back explicitly, because Highcharts merges option updates over
// the previous ones, and an explicit option would override the global one.
export function resolveZoomOptions(
  highcharts: null | typeof Highcharts,
  options: Highcharts.Options,
  zoomEnabled: boolean,
) {
  const globalOptions = highcharts?.getOptions();
  // The deprecated zoomType and pinchType are not typed in Highcharts 12, but still take precedence over zooming.
  const chart = options.chart as undefined | DeprecatedZoomOptions;
  const globalChart = globalOptions?.chart as undefined | DeprecatedZoomOptions;
  const globalXAxis = Array.isArray(globalOptions?.xAxis) ? globalOptions?.xAxis[0] : globalOptions?.xAxis;
  // The chart's own plotOptions.errorbar is applied over this. Highcharts resolves the type options before the
  // series options, each with the chart's options over the global ones.
  const errorBarPointPlacement =
    globalOptions?.plotOptions?.errorbar?.pointPlacement ??
    options.plotOptions?.series?.pointPlacement ??
    globalOptions?.plotOptions?.series?.pointPlacement;
  return {
    nativeZoom: (zoomEnabled
      ? {
          zooming: { ...options.chart?.zooming, type: undefined, pinchType: undefined },
          zoomType: undefined,
          pinchType: undefined,
        }
      : {
          zooming: {
            ...options.chart?.zooming,
            type: chart?.zooming?.type ?? globalChart?.zooming?.type,
            pinchType: chart?.zooming?.pinchType ?? globalChart?.zooming?.pinchType,
          },
          zoomType: chart?.zoomType ?? globalChart?.zoomType,
          pinchType: chart?.pinchType ?? globalChart?.pinchType,
        }) as Highcharts.ChartOptions,
    // Highcharts widens any range narrower than five times the closest point distance unless the axis declares
    // a minRange, and reads zero as not declared. The smallest positive number lets the zoom show any range.
    getXAxisMinRange: (axisIndex: number) =>
      zoomEnabled && axisIndex === 0 ? Number.MIN_VALUE : globalXAxis?.minRange,
    // Error bars pad the axis by half a point range on each side, so the zoomed plot would show more than the
    // zoomed range. Without bars in the chart nothing needs that room, so the error bars are placed on their x.
    errorBarPointPlacement:
      zoomEnabled && !hasColumnLikeSeries(options.series) ? ("on" as const) : errorBarPointPlacement,
  };
}

type ZoomingType = NonNullable<Highcharts.ChartZoomingOptions["type"]>;

interface DeprecatedZoomOptions extends Highcharts.ChartOptions {
  zoomType?: ZoomingType;
  pinchType?: ZoomingType;
}

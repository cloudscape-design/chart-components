// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getChartSeries, getSeriesData } from "../../internal/utils/highcharts";

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

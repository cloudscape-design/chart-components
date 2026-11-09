// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import type { ChartExtraContext } from "../chart-api/chart-extra-context";
import type { ZoomStopMapper } from "./zoom-state-machine";

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

// The x values the zoom cursor can land on, sorted ascending. They are the chart's own x values, which are limited to
// the current extremes and skip points without a y value, taken from the series on the zoomed first x-axis.
export function getCursorStops(
  { allX, getPointsByX }: Pick<ChartExtraContext.DerivedState, "allX" | "getPointsByX">,
  xAxis: null | Highcharts.Axis,
): number[] {
  if (!xAxis) {
    return [];
  }
  return allX.filter((x) =>
    getPointsByX(x).some((point) => point.series.xAxis === xAxis && isZoomableSeries(point.series)),
  );
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

// Finds the stops of a previous render among the current ones, by their values.
export function createStopMapper(previous: readonly number[], current: readonly number[]): ZoomStopMapper {
  const nearest = (index: number) => findNearestIndex(current, previous[index]);
  return {
    nearest,
    exact: (index) => {
      const currentIndex = nearest(index);
      return current[currentIndex] === previous[index] ? currentIndex : null;
    },
  };
}

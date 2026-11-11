// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import type { ChartExtraContext } from "../chart-api/chart-extra-context";
import { isXThreshold, isYThreshold } from "../utils";
import type { ZoomStopMapper } from "./zoom-state-machine";

export const MIN_ZOOM_POINTS = 2;

function isZoomableSeries(series: Highcharts.Series) {
  return series.type !== "errorbar" && !isXThreshold(series) && !isYThreshold(series);
}

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
  if (lo > 0 && Math.abs(values[lo - 1] - target) <= Math.abs(values[lo] - target)) {
    return lo - 1;
  }
  return lo;
}

export function getPageStep(valuesCount: number): number {
  return Math.max(1, Math.floor(valuesCount / 10));
}

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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Point, Series } from "highcharts";

// isInternal is currently not a publicly supported prop
// https://github.com/highcharts/highcharts/issues/23278
interface InternalSeries extends Series {
  options: Series["options"] & {
    isInternal?: boolean;
  };
}

export function getChartSeries(series: InternalSeries[]) {
  // Filters out internal series from chart, e.g., series from navigator, scrollbar, etc.

  // When calling chart.series, the result includes both the main chart series
  // and additional internal series (e.g., navigator series) when using Highstock navigator.

  // We are adding datapoints and doing other calculations and using Highstock version with a
  // navigator is causing duplicated unexpected datapoints and series entries in the chart.

  return series.filter((s) => !s.options.isInternal);
}

/**
 * Returns point series or series it is linked to.
 */
export function getMasterSeries(point: Point): Series {
  const masterSeries = point.series.linkedParent ?? point.series;
  return masterSeries;
}

/**
 * Returns point series and all series linked to it.
 */
export function getLinkedSeries(point: Point): Series[] {
  const masterSeries = getMasterSeries(point);
  const linkedSeries = [masterSeries, ...masterSeries.linkedSeries];
  return linkedSeries;
}

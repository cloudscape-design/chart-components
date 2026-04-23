// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Chart, Point, Series } from "highcharts";

// The chart.series array can include internal series, that are unwanted.
// Use getChartSeries to access chart series instead.
export type SafeChart = Omit<Chart, "series">;

// The series.data array can include missing or destroyed points.
// Use getSeriesData to access series data points instead.
export type SafeSeries = Omit<Series, "data">;

// isInternal is currently not a publicly supported prop
// https://github.com/highcharts/highcharts/issues/23278
interface InternalSeries extends Series {
  options: Series["options"] & {
    isInternal?: boolean;
  };
}

/**
 * Filters out internal series from chart, e.g., series from navigator, scrollbar, etc.
 * When calling chart.series, the result includes both the main chart series
 * and additional internal series (e.g., navigator series) when using Highstock navigator.
 * We are adding datapoints and doing other calculations and using Highstock version with a
 * navigator is causing duplicated unexpected datapoints and series entries in the chart.
 */
export function getChartSeries(chart: SafeChart): SafeSeries[] {
  return (chart as Chart).series?.filter((s: InternalSeries) => !s.options.isInternal) ?? [];
}

/**
 * Returns point series or series it is linked to.
 */
export function getMasterSeries(point: Point): SafeSeries {
  const masterSeries = point.series.linkedParent ?? point.series;
  return masterSeries;
}

/**
 * Returns point series and all series linked to it.
 */
export function getLinkedSeries(point: Point): SafeSeries[] {
  const masterSeries = getMasterSeries(point);
  const linkedSeries = [masterSeries, ...masterSeries.linkedSeries];
  return linkedSeries;
}

/**
 * This method checks if the point is defined and not destroyed.
 * The point can be undefined when accessing it from series.data array.
 * The point can be destroyed by Highcharts and replaced with { destroyed: true } when
 * the actual point is removed, but a reference to it is still preserved somewhere.
 * See: https://github.com/highcharts/highcharts/issues/23175.
 */
export function isPointValid(point?: Point): point is Point {
  return Boolean(point && point.series);
}

/**
 * This method checks if the point is valid and also visible in the plot.
 */
export function isPointVisible(point?: Point) {
  return isPointValid(point) && point.visible && point.series.visible;
}

/**
 * The series may include undefined points. See: https://api.highcharts.com/class-reference/Highcharts.Series.html#data,
 * and https://github.com/highcharts/highcharts/issues/11116.
 * This can create issues when iterating over the data (using Array.filter() or Array.map() methods is safe, but index access or Array.find()
 * can cause a crash if accessing point's properties without checking).
 */
export const getSeriesData = (series: SafeSeries, options: { includeHiddenPoints?: boolean } = {}): Array<Point> => {
  return (series as Series).data.filter((p) => (options.includeHiddenPoints ? isPointValid(p) : isPointVisible(p)));
};

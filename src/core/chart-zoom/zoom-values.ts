// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Error bar series are excluded everywhere x values are collected. Their data items declare `low` and
// `high` but may omit `x` (see CoreChartProps range data), in which case Highcharts assigns index-based
// x values that have nothing to do with the parent series' x values.
function isZoomableSeries(series: { type?: string }) {
  return series.type !== "errorbar";
}

// The series options accepted by the core chart form a wider union than Highcharts.SeriesOptionsType, and
// the computations here only need the type and the raw data items.
export interface SeriesOptionsLike {
  type?: string;
  // Most series declare an array of data items, but a few Highcharts series types (for instance
  // networkgraph) allow an object instead, so the shape is narrowed where it is read.
  data?: unknown;
}

// Series types Highcharts draws with a width along the x axis. The axis is padded by half a point range on
// each side for them, so the first and last bars are not cut by the plot edges.
const COLUMN_LIKE_SERIES_TYPES = new Set([
  "bar",
  "boxplot",
  "column",
  "columnpyramid",
  "columnrange",
  "histogram",
  "variwide",
  "waterfall",
  "xrange",
]);

// True when the chart draws bars, which need the axis padding to show in full. Error bars are column-like
// too, but sit on top of the series they are linked to, so they only count through that series.
export function hasColumnLikeSeries(allSeries: undefined | readonly SeriesOptionsLike[], chartType?: string): boolean {
  return (allSeries ?? []).some((series) => COLUMN_LIKE_SERIES_TYPES.has(series.type ?? chartType ?? "line"));
}

// The smallest distance between two adjacent x values across all series, used as the axis minRange.
//
// Highcharts computes a minRange of its own when the axis has no explicit bounds (five times the closest
// data range, see Axis.adjustForMinRange), and silently widens any narrower range. Zooming to a handful of
// points would then apply a range the chart never displays. Deriving minRange from the series data instead
// allows a zoom down to two adjacent points. It never affects the initial view: the full data range is at
// least as wide as the gap between two adjacent points.
export function getSeriesMinRange(allSeries: undefined | readonly SeriesOptionsLike[]): undefined | number {
  const xValues = new Set<number>();
  for (const series of allSeries ?? []) {
    if (!isZoomableSeries(series)) {
      continue;
    }
    const data = series.data;
    if (!Array.isArray(data)) {
      continue;
    }
    data.forEach((item, index) => {
      const x = getDataItemX(item, index);
      if (x !== undefined) {
        xValues.add(x);
      }
    });
  }
  const sorted = Array.from(xValues).sort((a, b) => a - b);
  let smallest: undefined | number;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 0 && (smallest === undefined || gap < smallest)) {
      smallest = gap;
    }
  }
  return smallest;
}

// Highcharts accepts three data item shapes: a tuple ([x, y]), an object (x optional), or a bare y value.
// The latter two fall back to the item's index, matching how Highcharts assigns x values itself.
function getDataItemX(item: unknown, index: number): undefined | number {
  if (Array.isArray(item)) {
    return typeof item[0] === "number" && isFinite(item[0]) ? item[0] : undefined;
  }
  if (item && typeof item === "object") {
    const x = (item as { x?: unknown }).x;
    if (x === undefined) {
      return index;
    }
    return typeof x === "number" && isFinite(x) ? x : undefined;
  }
  return index;
}

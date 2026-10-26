// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Series types Highcharts draws with a width along the x axis. The axis is padded by half a point range on
// each side for them, so the first and last bars are not cut by the plot edges.
const COLUMN_LIKE_SERIES_TYPES = new Set(["bar", "column"]);

// True when the chart draws bars, which need the axis padding to show in full. Error bars are column-like
// too, but sit on top of the series they are linked to, so they only count through that series.
// The series are typed loosely, because the core chart accepts a wider union than Highcharts.SeriesOptionsType.
export function hasColumnLikeSeries(allSeries: undefined | readonly object[], chartType?: string): boolean {
  return (allSeries ?? []).some((series) => {
    const type = (series as { type?: string }).type ?? chartType ?? "line";
    return COLUMN_LIKE_SERIES_TYPES.has(type);
  });
}

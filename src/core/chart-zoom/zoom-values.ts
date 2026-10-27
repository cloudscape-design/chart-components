// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

// Series types Highcharts draws with a width along the x axis. The axis is padded by half a point range on
// each side for them, so the first and last bars are not cut by the plot edges.
const COLUMN_LIKE_SERIES_TYPES = new Set(["bar", "column"]);

export function hasColumnLikeSeries(allSeries: Highcharts.Options["series"] = []): boolean {
  return allSeries.some((series) => "type" in series && COLUMN_LIKE_SERIES_TYPES.has(series.type));
}

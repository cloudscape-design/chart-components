// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChartProps } from "./interfaces";

export function isErrorBar(s: CartesianChartProps.SeriesOptions): s is CartesianChartProps.ErrorBarSeriesOptions {
  return s.type === "errorbar";
}

export function isThreshold(
  s: CartesianChartProps.SeriesOptions,
): s is CartesianChartProps.XThresholdSeriesOptions | CartesianChartProps.YThresholdSeriesOptions {
  return s.type === "x-threshold" || s.type === "y-threshold";
}

// Series can be linked using `linkedTo` set to another series ID or to the ":previous" pseudo-selector.
// See: https://api.highcharts.com/highcharts/series.errorbar.linkedTo.
export function getMasterSeries(
  series: readonly CartesianChartProps.SeriesOptions[],
  linked: CartesianChartProps.SeriesOptions,
): null | CartesianChartProps.SeriesOptions {
  if (isThreshold(linked) || !linked.linkedTo) {
    return null;
  }
  const linkedSeriesIndex = series.indexOf(linked);
  const prevSeries = series[linkedSeriesIndex - 1];
  return linked.linkedTo === ":previous" ? prevSeries : (series.find((m) => m.id === linked.linkedTo) ?? null);
}

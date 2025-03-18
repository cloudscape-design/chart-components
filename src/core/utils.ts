// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

export function getSeriesId(series: Highcharts.Series): string {
  return series.options.id ?? series.options.name ?? noIdPlaceholder();
}

export function getPointId(point: Highcharts.Point): string {
  return point.options.id ?? point.options.name ?? noIdPlaceholder();
}

export function getOptionsId(options: { id?: string; name?: string }): string {
  return options.id ?? options.name ?? noIdPlaceholder();
}

function noIdPlaceholder() {
  const rand = (Math.random() * 1_000_000).toFixed(0).padStart(6, "0");
  return "awsui-no-id-placeholder-" + rand;
}

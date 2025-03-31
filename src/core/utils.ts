// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";

export function getSeriesId(series: Highcharts.Series): string {
  return series.options.id ?? series.options.name ?? noIdPlaceholder();
}

export function getPointId(point: Highcharts.Point): string {
  return point.options.id ?? point.options.name ?? noIdPlaceholder();
}

export function getOptionsId(options: { id?: string; name?: string }): string {
  return options.id ?? options.name ?? noIdPlaceholder();
}

export function getSeriesMarkerType(series: Highcharts.Series): ChartSeriesMarkerType {
  const seriesSymbol = "symbol" in series && typeof series.symbol === "string" ? series.symbol : "circle";
  if ("dashStyle" in series.options && series.options.dashStyle) {
    return "dashed";
  }
  switch (series.type) {
    case "area":
    case "areaspline":
      return "hollow-square";
    case "line":
    case "spline":
      return "line";
    case "scatter":
      switch (seriesSymbol) {
        case "square":
          return "square";
        case "diamond":
          return "diamond";
        case "triangle":
          return "triangle";
        case "triangle-down":
          return "triangle-down";
        case "circle":
        default:
          return "circle";
      }
    case "column":
      return "large-square";
    case "errorbar":
    default:
      return "large-circle";
  }
}

export function isSettingEnabled<S extends { enabled?: boolean }>(setting?: S) {
  return setting === undefined || setting.enabled === undefined || setting.enabled === true;
}

// We expect that series and series items that require referencing e.g. in order to control their visibility
// have either id or name or both properties set. If none is set, we return a randomized id that is to ensure
// no accidental matches (which could happen should we default to null or an empty string).
function noIdPlaceholder(): string {
  const rand = (Math.random() * 1_000_000).toFixed(0).padStart(6, "0");
  return "awsui-no-id-placeholder-" + rand;
}

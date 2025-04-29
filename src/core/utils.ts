// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef } from "react";
import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";

// The below functions extract unique identifier from series, point, or options. The identifier can be item's ID or name.
// We expect that items requiring referencing (e.g. in order to control their visibility) have the unique identifier defined.
// Otherwise,  we return a randomized id that is to ensure no accidental matches.
export function getSeriesId(series: Highcharts.Series): string {
  return getOptionsId(series.options);
}
export function getPointId(point: Highcharts.Point): string {
  return getOptionsId(point.options);
}
export function getOptionsId(options: { id?: string; name?: string }): string {
  return options.id ?? options.name ?? noIdPlaceholder();
}
function noIdPlaceholder(): string {
  const rand = (Math.random() * 1_000_000).toFixed(0).padStart(6, "0");
  return "awsui-no-id-placeholder-" + rand;
}

export function getSeriesMarkerType(series?: Highcharts.Series): ChartSeriesMarkerType {
  if (!series) {
    return "large-square";
  }
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
    case "pie":
      return "large-square";
    case "errorbar":
    default:
      return "large-circle";
  }
}

// We reset color counter so that when a series is removed and then added back - it will
// have the same color as before, not the next one in the color sequence.
export function resetColorCounter(chart: Highcharts.Chart, seriesCount: number) {
  if ("colorCounter" in chart && typeof chart.colorCounter === "number") {
    chart.colorCounter = seriesCount;
  }
}

export function getSeriesColor(series?: Highcharts.Series): string {
  return series?.color?.toString() ?? "black";
}

export function getPointColor(point?: Highcharts.Point): string {
  return point?.color?.toString() ?? "black";
}

export function useStableCallbackNullable<Callback extends (...args: any[]) => any>(
  fn?: Callback,
): Callback | undefined {
  const ref = useRef<Callback>();

  useEffect(() => {
    ref.current = fn;
  });

  const stable = useCallback((...args: any[]) => ref.current?.apply(undefined, args), []) as Callback;

  return fn ? stable : undefined;
}

export function findAllSeriesWithData(chart: Highcharts.Chart) {
  return chart.series.filter((s) => {
    switch (s.type) {
      case "pie":
        return s.data && s.data.filter((d) => d.y !== null).length > 0;
      default:
        return s.data && s.data.length > 0;
    }
  });
}

export function findAllVisibleSeries(chart: Highcharts.Chart) {
  const allSeriesWithData = findAllSeriesWithData(chart);
  return allSeriesWithData.filter(
    (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
  );
}

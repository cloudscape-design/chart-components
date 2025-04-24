// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { CartesianChartProps, InternalSeriesOptions } from "./interfaces-cartesian";

export function getDataExtremes(axis?: Highcharts.Axis): [number, number] {
  const extremes = axis?.getExtremes();
  return [extremes?.dataMin ?? 0, extremes?.dataMax ?? 0];
}

export function getCartesianDetailsItem(
  index: number,
  series: InternalSeriesOptions,
): null | CartesianChartProps.TooltipSeriesDetailItem {
  const x = getSeriesXbyIndex(series, index);
  const y = getSeriesYbyIndex(series, index);

  if (typeof y === "number") {
    return { type: "point", x: x as number, y, series: series as CartesianChartProps.Series };
  }
  if (Array.isArray(y)) {
    return { type: "range", x: x as number, low: y[0], high: y[1], series: series as CartesianChartProps.Series };
  }
  if (series.type === "y-threshold") {
    return { type: "threshold", x: x as number, series: series as CartesianChartProps.Series };
  }
  return null;
}

function getSeriesXbyIndex(series: InternalSeriesOptions, index: number): number | string {
  if (!("data" in series) || !Array.isArray(series.data)) {
    throw new Error("Unsupported series type.");
  }

  switch (series.type) {
    case "area":
    case "arearange":
    case "areaspline":
    case "areasplinerange":
    case "column":
    case "line":
    case "scatter":
    case "spline": {
      const item = series.data[index];

      if (Array.isArray(item)) {
        return item[0];
      }
      if (item && typeof item === "object") {
        return item.x ?? index;
      }
      return index;
    }
    case "errorbar": {
      const item = series.data[index];

      if (Array.isArray(item)) {
        return item.length === 3 ? item[0] : index;
      }
      if (item && typeof item === "object") {
        return item.x ?? index;
      }
      return index;
    }
    default:
      return index;
  }
}

function getSeriesYbyIndex(series: InternalSeriesOptions, index: number): null | number | [number, number] {
  if (!("data" in series) || !Array.isArray(series.data)) {
    throw new Error("Unsupported series type.");
  }

  switch (series.type) {
    case "area":
    case "areaspline":
    case "column":
    case "line":
    case "scatter":
    case "spline": {
      const item = series.data[index];

      if (Array.isArray(item)) {
        return item[1];
      }
      if (typeof item === "number") {
        return item;
      }
      if (item && typeof item === "object") {
        return item.y ?? null;
      }
      return null;
    }
    case "arearange":
    case "areasplinerange":
    case "errorbar": {
      const item = series.data[index];

      if (Array.isArray(item)) {
        const [low, high] = item.length === 2 ? [item[0], item[1]] : [item[1], item[2]];
        return typeof low === "number" ? [low, high] : null;
      }
      if (item && typeof item === "object") {
        const [low, high] = [item.low, item.high];
        return typeof low === "number" && typeof high === "number" ? [low, high] : null;
      }
      return null;
    }
    default:
      return null;
  }
}

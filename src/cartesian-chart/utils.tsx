// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { CartesianChartProps, InternalSeriesOptions, InternalTooltipMatchedItem } from "./interfaces-cartesian";

export function getDataExtremes(axis?: Highcharts.Axis): [number, number] {
  const extremes = axis?.getExtremes();
  return [extremes?.dataMin ?? 0, extremes?.dataMax ?? 0];
}

export function findMatchedTooltipItems(point: Highcharts.Point, series: InternalSeriesOptions[]) {
  const matchedItems: InternalTooltipMatchedItem[] = [];
  function findMatchedItem(series: InternalSeriesOptions) {
    if (series.type === "x-threshold" || series.type === "y-threshold") {
      return;
    }
    if ("data" in series && series.data && Array.isArray(series.data)) {
      for (let i = 0; i < series.data.length; i++) {
        const detail = getMatchedTooltipItemForIndex(i, series);
        if (detail?.x === point.x) {
          matchedItems.push(detail);
        }
      }
    }
  }
  series.forEach((s) => findMatchedItem(s));

  function findMatchedXThreshold(series: CartesianChartProps.XThresholdSeriesOptions) {
    if (series.value <= point.x && point.x <= series.value) {
      matchedItems.push({ type: "all", x: series.value, series });
    }
  }
  series.forEach((s) => (s.type === "x-threshold" ? findMatchedXThreshold(s) : undefined));

  function findMatchedYThreshold(series: CartesianChartProps.YThresholdSeriesOptions) {
    matchedItems.push({ type: "point", x: point.x, y: series.value, series });
  }
  series.forEach((s) => (s.type === "y-threshold" ? findMatchedYThreshold(s) : undefined));

  return matchedItems;
}

function getMatchedTooltipItemForIndex(
  index: number,
  series: InternalSeriesOptions,
): null | InternalTooltipMatchedItem {
  const x = getSeriesXbyIndex(series, index);
  const y = getSeriesYbyIndex(series, index);
  if (x === null) {
    return null;
  }
  if (typeof y === "number") {
    return { type: "point", x: x, y, series };
  }
  if (Array.isArray(y)) {
    return { type: "range", x: x, low: y[0], high: y[1], series };
  }
  if (series.type === "y-threshold") {
    return { type: "all", x: x, series };
  }
  return null;
}

function getSeriesXbyIndex(series: InternalSeriesOptions, index: number): number | null {
  if (!("data" in series) || !Array.isArray(series.data)) {
    warnOnce("CartesianChart", "Series data cannot be parsed.");
    return null;
  }
  switch (series.type) {
    case "area":
    case "areaspline":
    case "column":
    case "line":
    case "scatter":
    case "spline": {
      const item = series.data[index];
      if (Array.isArray(item) && typeof item[0] === "number") {
        return item[0];
      }
      if (item && typeof item === "object" && !Array.isArray(item) && typeof item.x === "number") {
        return item.x;
      }
      return index;
    }
    case "errorbar": {
      const item = series.data[index];
      if (Array.isArray(item) && typeof item[0] === "number") {
        return item.length === 3 ? item[0] : index;
      }
      if (item && typeof item === "object" && !Array.isArray(item) && typeof item.x === "number") {
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
    warnOnce("CartesianChart", "Series data cannot be parsed.");
    return null;
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

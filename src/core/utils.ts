// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/chart-series-marker";

type IdToSeriesMapping = Map<string, { series: Highcharts.Series; data: Map<string, Highcharts.Point> }>;

export function getSeriesToIdMap(allSeries: Highcharts.Series[]): IdToSeriesMapping {
  const mapping: IdToSeriesMapping = new Map();

  for (const series of allSeries) {
    const id = series.userOptions.id ?? series.name;
    if (id) {
      const data = new Map<string, Highcharts.Point>();
      for (const point of series.data) {
        const id = point.options.id ?? point.options.name;
        if (id) {
          data.set(id, point);
        }
      }
      mapping.set(id, { series, data });
    }
  }

  return mapping;
}

export function getSimpleColor(color?: Highcharts.ColorType): string {
  if (typeof color === "string") {
    return color;
  }
  if (color && typeof color === "object" && "pattern" in color) {
    return color.pattern.color ?? color.pattern.backgroundColor ?? "black";
  }
  if (color && typeof color === "object" && ("linearGradient" in color || "radialGradient" in color)) {
    return color.stops?.[0][1] ?? "black";
  }
  return "black";
}

export function getLegendItemType(
  highcharts: null | typeof Highcharts,
  seriesOrPoint: Highcharts.Series | Highcharts.Point,
): ChartSeriesMarkerType {
  if (highcharts && seriesOrPoint instanceof highcharts.Series) {
    const type = isThresholdSeries(seriesOrPoint) ? "threshold" : seriesOrPoint.userOptions.type;
    switch (type) {
      case "area":
      case "arearange":
      case "areaspline":
      case "areasplinerange":
        return "hollow-rectangle";
      case "column":
        return "rectangle";
      case "line":
      case "spline":
        return "line";
      case "threshold":
        return "dashed";
      default:
        return "circle";
    }
  }
  if (highcharts && seriesOrPoint instanceof highcharts.Point) {
    return "circle";
  }
  return "circle";
}

function isThresholdSeries(series: Highcharts.Series) {
  return (
    series.userOptions.custom &&
    "isThreshold" in series.userOptions.custom &&
    series.userOptions.custom.isThreshold === true
  );
}

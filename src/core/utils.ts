// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { ChartLegendItem } from "./interfaces-base";
import { InternalChartLegendItemSpec, Rect } from "./interfaces-core";

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

export function isSeriesStacked(series: Highcharts.Series) {
  return (series.options as any).stacking === "normal";
}

export function getDataExtremes(axis?: Highcharts.Axis): [number, number] {
  const extremes = axis?.getExtremes();
  return [extremes?.dataMin ?? 0, extremes?.dataMax ?? 0];
}

interface ThresholdOptions<T extends "x-threshold" | "y-threshold"> {
  custom: {
    awsui: {
      type: T;
      threshold: number;
    };
  };
}
export function createThresholdMetadata<T extends "x-threshold" | "y-threshold">(
  type: T,
  value: number,
): ThresholdOptions<T> {
  return { custom: { awsui: { type, threshold: value } } };
}
export function isXThreshold(
  s: Highcharts.Series,
): s is Highcharts.Series & { options: ThresholdOptions<"x-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "x-threshold";
}
export function isYThreshold(
  s: Highcharts.Series,
): s is Highcharts.Series & { options: ThresholdOptions<"y-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "y-threshold";
}

// We check point.series explicitly because if the point was destroyed by Highcharts it is replaced by
// { destroyed: true } object, where the series array is no longer present despite the TS definition.
export function isPointVisible(point: Highcharts.Point) {
  return point.visible && point.series && point.series.visible;
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
      return "large-square";
  }
}

export function getSeriesColor(series?: Highcharts.Series): string {
  return typeof series?.color === "string" ? series.color : "black";
}

export function getPointColor(point?: Highcharts.Point): string {
  return typeof point?.color === "string" ? point.color : "black";
}

// The custom legend implementation does not rely on the Highcharts legend. When Highcharts legend is disabled,
// the chart object does not include information on legend items. Instead, we assume that all series but pie are
// shown in the legend, and all pie series points are shown in the legend. Each item be it a series or a point should
// have an ID, and all items with non-matched IDs are dimmed.
export function getChartLegendItems(chart: Highcharts.Chart): readonly InternalChartLegendItemSpec[] {
  const legendItems: InternalChartLegendItemSpec[] = [];
  const addSeriesItem = (series: Highcharts.Series) => {
    if (series.type !== "pie" && series.type !== "errorbar" && series.options.showInLegend !== false) {
      legendItems.push({
        id: getSeriesId(series),
        name: series.name,
        markerType: getSeriesMarkerType(series),
        color: getSeriesColor(series),
        visible: series.visible,
      });
    }
  };
  const addPointItem = (point: Highcharts.Point) => {
    if (point.series.type === "pie") {
      legendItems.push({
        id: getPointId(point),
        name: point.name,
        markerType: getSeriesMarkerType(point.series),
        color: getPointColor(point),
        visible: point.visible,
      });
    }
  };
  for (const s of chart.series) {
    addSeriesItem(s);
    s.data.forEach(addPointItem);
  }
  return legendItems;
}

export function matchLegendItems(legendItems: readonly ChartLegendItem[], point: Highcharts.Point): string[] {
  return legendItems
    .filter((item) => {
      if (point.series.type !== "pie") {
        return getSeriesId(point.series) === item.id;
      } else {
        return getPointId(point) === item.id;
      }
    })
    .map((item) => item.id);
}

export function updateChartItemsVisibility(
  chart: Highcharts.Chart,
  legendItems: readonly ChartLegendItem[],
  visibleItems?: readonly string[],
) {
  const availableItemsSet = new Set(legendItems.map((i) => i.id));
  const visibleItemsSet = new Set(visibleItems);

  let updatesCounter = 0;
  const getVisibleAndCount = (id: string, visible: boolean) => {
    const nextVisible = visibleItemsSet.has(id);
    updatesCounter += nextVisible !== visible ? 1 : 0;
    return nextVisible;
  };

  for (const series of chart.series) {
    if (availableItemsSet.has(getSeriesId(series))) {
      series.setVisible(getVisibleAndCount(getSeriesId(series), series.visible), false);
    }
    for (const point of series.data) {
      if (typeof point.setVisible === "function" && availableItemsSet.has(getPointId(point))) {
        point.setVisible(getVisibleAndCount(getPointId(point), point.visible), false);
      }
    }
  }

  // The call `seriesOrPoint.setVisible(visible, false)` does not trigger the chart redraw, as it would otherwise
  // impact the performance. Instead, we trigger the redraw explicitly, if any change to visibility has been made.
  if (updatesCounter > 0) {
    chart.redraw();
  }
}

export function getPointRect(point: Highcharts.Point): Rect {
  switch (point.series.type) {
    case "column":
      return getColumnPointRect(point);
    case "errorbar":
      return getErrorBarPointRect(point);
    default:
      return getDefaultPointRect(point);
  }
}

export function getDefaultPointRect(point: Highcharts.Point) {
  const chart = point.series.chart;
  if (point.graphic) {
    const box = point.graphic.getBBox();
    return {
      x: chart.plotLeft + box.x,
      y: chart.plotTop + box.y,
      width: box.width,
      height: box.height,
    };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export function getColumnPointRect(point: Highcharts.Point) {
  const chart = point.series.chart;
  if (point.graphic) {
    const box = point.graphic.getBBox();
    return chart.inverted
      ? {
          x: chart.plotWidth + chart.plotLeft - (box.y + box.height),
          y: chart.plotHeight + chart.plotTop - (box.x + box.width),
          width: box.height,
          height: box.width,
        }
      : {
          x: chart.plotLeft + box.x,
          y: chart.plotTop + box.y,
          width: box.width,
          height: box.height,
        };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export function getErrorBarPointRect(point: Highcharts.Point) {
  const chart = point.series.chart;
  if ("whiskers" in point) {
    const box = (point.whiskers as Highcharts.SVGElement).getBBox();
    return chart.inverted
      ? {
          x: chart.plotWidth + chart.plotLeft - (box.y + box.height),
          y: chart.plotHeight + chart.plotTop - (box.x + box.width),
          width: box.height,
          height: box.width,
        }
      : {
          x: chart.plotLeft + box.x,
          y: chart.plotTop + box.y,
          width: box.width,
          height: box.height,
        };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export function getGroupRect(points: Highcharts.Point[]): Rect {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const chart = points[0].series.chart;
  const rects = points.map(getPointRect);
  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].width;
  let maxY = rects[0].y + rects[0].height;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return chart.inverted
    ? { x: chart.plotLeft, y: minY, width: chart.plotWidth, height: maxY - minY }
    : { x: minX, y: chart.plotTop, width: maxX - minX, height: chart.plotHeight };
}

// TODO: i18n
export function getChartAccessibleDescription() {
  return "chart plot";
}

// TODO: i18n
export function getPointAccessibleDescription(point: Highcharts.Point) {
  return point.graphic?.element.getAttribute("aria-label") ?? "\tchart point";
}

// TODO: i18n and format x
export function getGroupAccessibleDescription(group: Highcharts.Point[]) {
  const firstPointLabel = group[0] ? getPointAccessibleDescription(group[0]) : "";
  const firstPointX = firstPointLabel.split("\t")[0];
  return `${firstPointX}, ${group.length} points`;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { getFormatter } from "./formatters";
import { ChartLabels } from "./i18n-utils";
import { CoreLegendItemSpec, Rect } from "./interfaces";

// The below functions extract unique identifier from series, point, or options. The identifier can be item's ID or name.
// We expect that items requiring referencing (e.g. in order to control their visibility) have the unique identifier defined.
// Otherwise, we return a randomized id that is to ensure no accidental matches.
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

// There are more possible values that series.stacking can take, but we only explicitly support "normal".
export function isSeriesStacked(series: Highcharts.Series) {
  return (series.options as any).stacking === "normal";
}

// The threshold series are custom series, implemented as a combination of line series, and plot lines.
// As Highcharts does not support custom series declaration, we annotate threshold series by using the
// series.custom property. This is then used in our utilities to recognize threshold series, and retrieve
// the associated threshold value.
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

// We check point.series explicitly because Highcharts can destroy point objects, replacing the
// contents with { destroyed: true }, violating the point's TS contract.
// See: https://github.com/highcharts/highcharts/issues/23175.
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

// Highcharts supports color objects to represent gradients and more, but we only support string
// colors in our markers. In case a non-string color is defined, we use black color as as fallback.
export function getSeriesColor(series?: Highcharts.Series): string {
  return typeof series?.color === "string" ? series.color : "black";
}
export function getPointColor(point?: Highcharts.Point): string {
  return typeof point?.color === "string" ? point.color : "black";
}

// The custom legend implementation does not rely on the Highcharts legend. When Highcharts legend is disabled,
// the chart object does not include information on legend items. Instead, we collect series and pie segments
// using this custom function, respecting Highcharts' showInLegend flag (defined for series only).

// There exists a Highcharts APIs to access legend items, but it is unfortunately not available, when
// Highcharts legend is disabled. Instead, we use this custom method to collect legend items from the chart.
export function getChartLegendItems(chart: Highcharts.Chart): readonly CoreLegendItemSpec[] {
  const legendItems: CoreLegendItemSpec[] = [];
  const addSeriesItem = (series: Highcharts.Series) => {
    // The pie series is not shown in the legend. Instead, we show pie segments.
    if (series.type === "pie") {
      return;
    }
    // We only support errorbar series that are linked to other series. Those are not represented separately
    // in the legend, but can be controlled from the outside, using controllable items visibility API.
    if (series.type === "errorbar") {
      return;
    }
    // We respect Highcharts showInLegend option to allow hiding certain series from the legend.
    // The same is not supported for pie chart segments.
    if (series.options.showInLegend !== false) {
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

// This function returns coordinates of a rectangle, including the target point.
// There are differences in how the rectangle is computed, but in all cases it is supposed to
// enclose the point's visual representation in the chart, with no extra offsets.
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

// The group rect is only used for cartesian charts. It returns coordinates of a rectangle,
// which includes all given points, but also stretched vertically or horizontally (in inverted charts)
// to the entire chart's height or width.
export function getGroupRect(points: readonly Highcharts.Point[]): Rect {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const chart = points[0].series.chart;
  const rects = points.map(getPointRect);
  const [first, ...rest] = rects;
  let minX = first.x,
    minY = first.y,
    maxX = first.x + first.width,
    maxY = first.y + first.height;
  for (const r of rest) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return chart.inverted
    ? { x: chart.plotLeft, y: minY, width: chart.plotWidth, height: maxY - minY }
    : { x: minX, y: chart.plotTop, width: maxX - minX, height: chart.plotHeight };
}

export function getChartAccessibleDescription(chart: Highcharts.Chart) {
  return chart.options.lang?.accessibility?.chartContainerLabel ?? "";
}

export function getPointAccessibleDescription(point: Highcharts.Point, labels: ChartLabels) {
  if (point.series.xAxis && point.series.yAxis) {
    const formattedX = getFormatter(point.series.xAxis)(point.x);
    const formattedY = getFormatter(point.series.yAxis)(point.y);
    return `${formattedX} ${formattedY}, ${point.series.name}`;
  } else if (point.series.type === "pie") {
    const segmentLabel = labels.chartSegmentLabel ? `${labels.chartSegmentLabel} ` : "";
    return `${segmentLabel}${point.name}, ${point.y}. ${point.series.name}`;
  } else {
    return "";
  }
}

export function getGroupAccessibleDescription(group: readonly Highcharts.Point[]) {
  const firstPoint = group[0];
  return getFormatter(firstPoint.series.xAxis)(firstPoint.x);
}

// The area-, line-, or scatter series markers are rendered as single graphic elements,
// and we can use their respective b-boxes to compute rects.
function getDefaultPointRect(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  if (point.graphic) {
    const box = point.graphic.getBBox();
    return getChartRect(box, chart, false);
  }
  return getPointRectFromCoordinates(point);
}

// The column series graphic elements are rectangles, and they are inverted if the chart is inverted,
// so that rect's width becomes height and vice-versa.
function getColumnPointRect(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  if (point.graphic) {
    return getChartRect(point.graphic.getBBox(), chart, true);
  }
  return getPointRectFromCoordinates(point);
}

// The errorbar series point rect cannot be computed from the respective graphic element (it gives wrong position).
// Instead, we have to rely on the internal "whiskers" element b-box, which can be inverted, too.
function getErrorBarPointRect(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  if ("whiskers" in point) {
    return getChartRect((point.whiskers as Highcharts.SVGElement).getBBox(), chart, true);
  }
  return getPointRectFromCoordinates(point);
}

// The point graphic is not present in large charts to optimize performance.
// In that case we compute point rects from their coordinates. We also assume the point
// size is small, and thereby give it 0 width and height, which is alright as there is a
// small offset that we use for focus outline anyways.
// See: https://www.highcharts.com/blog/news/175-highcharts-performance-boost/
function getPointRectFromCoordinates(point: Highcharts.Point) {
  const chart = point.series.chart;
  const plotX = point.plotX ?? 0;
  const plotY = point.plotY ?? 0;
  return getChartRect({ x: plotX, y: plotY, width: 0, height: 0 }, chart, true);
}

function getChartRect(rect: Rect, chart: Highcharts.Chart, canBeInverted: boolean): Rect {
  return canBeInverted && chart.inverted
    ? {
        x: chart.plotWidth + chart.plotLeft - (rect.y + rect.height),
        y: chart.plotHeight + chart.plotTop - (rect.x + rect.width),
        width: rect.height,
        height: rect.width,
      }
    : {
        x: chart.plotLeft + rect.x,
        y: chart.plotTop + rect.y,
        width: rect.width,
        height: rect.height,
      };
}

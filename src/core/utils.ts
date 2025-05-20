// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex } from "@cloudscape-design/component-toolkit/internal";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { castArray } from "../internal/utils/utils";
import { ChartLegendItem } from "./interfaces-base";
import { ChartLegendItemSpec, InternalChartLegendItemSpec, Rect } from "./interfaces-core";

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
      return "large-square";
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
  return typeof series?.color === "string" ? series.color : "black";
}

export function getPointColor(point?: Highcharts.Point): string {
  return typeof point?.color === "string" ? point.color : "black";
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

// The custom legend implementation does not rely on the Highcharts legend. When Highcharts legend is disabled,
// the chart object does not include information on legend items. Instead, we assume that all series but pie are
// shown in the legend, and all pie series points are shown in the legend. Each item be it a series or a point should
// have an ID, and all items with non-matched IDs are dimmed.
export function getChartLegendItems(
  chart: Highcharts.Chart,
  specs?: readonly ChartLegendItemSpec[],
): readonly InternalChartLegendItemSpec[] {
  const itemToSpec = new Map(specs?.map((spec) => [spec.id, spec]));
  const legendItems: InternalChartLegendItemSpec[] = [];
  const addSeriesItem = (series: Highcharts.Series) => {
    const spec = itemToSpec.get(getSeriesId(series));
    if (spec || (!specs && series.type !== "pie" && series.type !== "errorbar")) {
      legendItems.push({
        id: getSeriesId(series),
        name: spec?.name ?? series.name,
        markerType: getSeriesMarkerType(series),
        color: getSeriesColor(series),
        visible: series.visible,
      });
    }
  };
  const addPointItem = (point: Highcharts.Point) => {
    const spec = itemToSpec.get(getPointId(point));
    if (spec || (!specs && point.series.type === "pie")) {
      legendItems.push({
        id: getPointId(point),
        name: spec?.name ?? point.name,
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

export function highlightChartItems(chart: Highcharts.Chart, itemIds: readonly string[]) {
  for (const s of chart.series) {
    if (s.type !== "pie") {
      s.setState(itemIds.includes(getSeriesId(s)) ? "normal" : "inactive");
    }
    if (s.type === "pie") {
      for (const p of s.data) {
        p.setState(itemIds.includes(getPointId(p)) ? "normal" : "inactive");
      }
    }
  }
  // All plot lines that define ID, and this ID does not match the highlighted item are dimmed.
  iteratePlotLines(chart, (line) => {
    if (line.options.id && !itemIds.includes(line.options.id)) {
      line.svgElem?.attr({ opacity: 0.4 });
    } else if (line.options.id) {
      line.svgElem?.attr({ opacity: 1 });
    }
  });
}

export function clearChartItemsHighlight(chart: Highcharts.Chart) {
  // When a legend item loses highlight we assume no series should be highlighted at that point,
  // so removing inactive state from all series, points, and plot lines.
  for (const s of chart.series) {
    s.setState("normal");
    for (const p of s.data) {
      p.setState("normal");
    }
  }
  iteratePlotLines(chart, (line) => {
    if (line.options.id) {
      line.svgElem?.attr({ opacity: 1 });
    }
  });
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

export function getVerticalAxesTitles(chart: Highcharts.Chart) {
  const isInverted = !!chart.options.chart?.inverted;
  const hasSeries = chart.series.filter((s) => s.type !== "pie").length > 0;

  // We extract multiple titles as there can be multiple axes. This supports up to 2 axes by
  // using space-between placement of the labels in the corresponding component.
  let titles: string[] = [];
  if (hasSeries && isInverted) {
    titles = (castArray(chart.options.xAxis) ?? [])
      .filter((axis) => axis.visible)
      .map((axis) => axis.title?.text ?? "")
      .filter(Boolean);
  }
  if (hasSeries && !isInverted) {
    titles = (castArray(chart.options.yAxis) ?? [])
      .filter((axis) => axis.visible)
      .map((axis) => axis.title?.text ?? "")
      .filter(Boolean);
  }
  return titles;
}

export function getPointRect(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  if (point.graphic) {
    const box = point.series.type === "errorbar" ? getErrorBarPointBox(point) : point.graphic.getBBox();
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

export function getErrorBarPointBox(point: Highcharts.Point) {
  if ("whiskers" in point) {
    return (point.whiskers as Highcharts.SVGElement).getBBox();
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

export function findMatchedPointsByX(series: Highcharts.Series[], x: number) {
  const matchedPoints: Highcharts.Point[] = [];
  for (const s of series) {
    if (!s.visible) {
      continue;
    }
    for (const p of s.data) {
      if (!p.visible) {
        continue;
      }
      if (p.x === x && p.y !== null) {
        matchedPoints.push(p);
      }
    }
  }
  return matchedPoints;
}

export function findFirstPoint(chart: Highcharts.Chart, direction: -1 | 1): Highcharts.Point {
  const allX = findAllX(chart);
  const nextIndex = direction === 1 ? 0 : allX.length - 1;
  const nextX = allX[nextIndex];
  const nextPoint = findMatchedPointsByX(chart.series, nextX)[0];
  return nextPoint;
}

export function findNextPointByX(point: Highcharts.Point, direction: -1 | 1): Highcharts.Point {
  const allX = findAllX(point.series.chart);
  const pointIndex = allX.indexOf(point.x);
  const nextIndex = circleIndex(pointIndex + direction, [0, allX.length - 1]);
  const nextX = allX[nextIndex];
  const nextPoint = findMatchedPointsByX(point.series.chart.series, nextX)[0];
  return nextPoint;
}

export function findNextPointInSeriesByX(point: Highcharts.Point, direction: -1 | 1): Highcharts.Point {
  const seriesX = findAllXInSeries(point.series);
  const pointIndex = seriesX.indexOf(point.x);
  const nextIndex = circleIndex(pointIndex + direction, [0, seriesX.length - 1]);
  const nextX = seriesX[nextIndex];
  return point.series.data.find((d) => d.x === nextX)!;
}

function findAllX(chart: Highcharts.Chart) {
  const allX = new Set<number>();
  for (const s of chart.series) {
    if (s.visible) {
      for (const d of s.data) {
        if (d.visible && d.y !== null) {
          allX.add(d.x);
        }
      }
    }
  }
  return [...allX].sort();
}

function findAllXInSeries(series: Highcharts.Series) {
  const allX = new Set<number>();
  if (series.visible) {
    for (const d of series.data) {
      if (d.visible && d.y !== null) {
        allX.add(d.x);
      }
    }
  }
  return [...allX].sort();
}

// The `axis.plotLinesAndBands` API is not covered with TS.
function iteratePlotLines(chart: Highcharts.Chart, cb: (line: Highcharts.PlotLineOrBand) => void) {
  chart.axes.forEach((axis) => {
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => cb(line));
    }
  });
}

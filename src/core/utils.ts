// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { castArray } from "../internal/utils/utils";
import { ChartLegendItem } from "./interfaces-base";
import { ChartLegendItemSpec, InternalChartLegendItemSpec, Rect } from "./interfaces-core";

const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

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
      setSeriesState(s, itemIds.includes(getSeriesId(s)) ? "normal" : "inactive", true);
    }
    if (s.type === "pie") {
      for (const p of s.data) {
        setPointState(p, itemIds.includes(getPointId(p)) ? "normal" : "inactive", false);
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
    setSeriesState(s, "normal", false);
    for (const p of s.data) {
      setPointState(p, "normal", false);
    }
  }
  iteratePlotLines(chart, (line) => {
    if (line.options.id) {
      line.svgElem?.attr({ opacity: 1 });
    }
  });
}

export function setSeriesState(series: Highcharts.Series, state: Highcharts.SeriesStateValue, inherit?: boolean) {
  const chart = series.chart;
  (chart as any)[SET_STATE_OVERRIDE_MARKER] = true;
  series.setState(state, inherit);
  (chart as any)[SET_STATE_OVERRIDE_MARKER] = false;
}

export function setPointState(point: Highcharts.Point, state: Highcharts.PointStateValue, move?: boolean) {
  const chart = point.series.chart;
  (chart as any)[SET_STATE_OVERRIDE_MARKER] = true;
  point.setState(state, move);
  (chart as any)[SET_STATE_OVERRIDE_MARKER] = false;
}

// We replace `setState` method on Highcharts series and points with a custom implementation,
// to prevent Highcharts from altering series or point states. Instead, we take ownership of that.
export function overrideStateSetters(chart: Highcharts.Chart) {
  for (const s of chart.series) {
    // We ensure the replacement is done only once by assigning a custom property to the function.
    // If the property is present - it means the method was already replaced.
    if (!(s.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
      const original = s.setState;
      s.setState = (...args) => {
        if ((chart as any)[SET_STATE_OVERRIDE_MARKER]) {
          original.call(s, ...args);
        }
      };
      (s.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
    }
    for (const d of s.data) {
      if (!(d.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
        const original = d.setState;
        d.setState = (...args) => {
          if ((chart as any)[SET_STATE_OVERRIDE_MARKER]) {
            original.call(d, ...args);
          }
        };
        (d.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
      }
    }
  }
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
  return chart.inverted
    ? {
        x: chart.plotWidth + chart.plotLeft - ((point.plotY ?? 0) + 1),
        y: chart.plotHeight + chart.plotTop - ((point.plotX ?? 0) + 1),
        width: 2,
        height: 2,
      }
    : { x: chart.plotLeft + (point.plotX ?? 0) - 1, y: chart.plotTop + (point.plotY ?? 0) - 1, width: 2, height: 2 };
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

export function isSeriesStacked(series: Highcharts.Series) {
  return (series.options as any).stacking === "normal";
}

// TODO: i18n
export function getPointAccessibleDescription(point: Highcharts.Point) {
  if (
    "accessibility" in point &&
    typeof point.accessibility === "object" &&
    point.accessibility &&
    "valueDescription" in point.accessibility &&
    typeof point.accessibility.valueDescription === "string"
  ) {
    return point.accessibility.valueDescription;
  } else {
    return "chart point";
  }
}

// TODO: i18n and format x
export function getGroupAccessibleDescription(group: Highcharts.Point[]) {
  return `Group of ${group.length} points for x=${group[0]?.x}`;
}

// The `axis.plotLinesAndBands` API is not covered with TS.
function iteratePlotLines(chart: Highcharts.Chart, cb: (line: Highcharts.PlotLineOrBand) => void) {
  chart.axes.forEach((axis) => {
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => cb(line));
    }
  });
}

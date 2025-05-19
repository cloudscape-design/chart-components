// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { castArray } from "../internal/utils/utils";
import { ChartLegendItem } from "./interfaces-base";
import { ChartLegendItemSpec, InternalChartLegendItemSpec } from "./interfaces-core";

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
    if (spec || (!specs && series.type !== "pie")) {
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

export function getDefaultTooltipTarget(point: Highcharts.Point, placement: "target" | "middle" | "outside") {
  const [trackStart, trackSize] = getTrackProps(point);
  const { plotTop, plotLeft, plotWidth, plotHeight, inverted } = point.series.chart;
  if (placement === "target" && !inverted) {
    const x = (point.plotX ?? 0) + plotLeft;
    const y = (point.plotY ?? 0) + plotTop;
    return { x, y, width: 4, height: 1 };
  }
  if (placement === "target" && inverted) {
    const x = plotWidth - (point.plotY ?? 0) + plotLeft;
    const y = plotHeight - (point.plotX ?? 0) + plotTop;
    return { x, y, width: 1, height: 4 };
  }
  if ((placement === "middle" || placement === "outside") && !inverted) {
    const x = trackStart + plotLeft;
    return { x, y: plotTop, width: trackSize, height: plotHeight };
  }
  if ((placement === "middle" || placement === "outside") && inverted) {
    const y = plotHeight + plotTop - trackStart;
    return { x: plotLeft, y, width: plotWidth, height: trackSize };
  }
  throw new Error("Invariant violation: unsupported tooltip placement option.");
}

export function findMatchedPoints(point: Highcharts.Point) {
  const matchedPoints: Highcharts.Point[] = [];
  for (const s of point.series.chart.series) {
    if (!s.visible) {
      continue;
    }
    for (const p of s.data) {
      if (!p.visible) {
        continue;
      }
      if (p.x === point.x) {
        matchedPoints.push(p);
      }
    }
  }
  return matchedPoints;
}

function getTrackProps(point: Highcharts.Point) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const p of findMatchedPoints(point)) {
    if (p.shapeArgs) {
      min = Math.min(min, p.shapeArgs.x);
      max = Math.max(max, p.shapeArgs.x + p.shapeArgs.width);
    }
  }
  if (!isFinite(max - min)) {
    return [(point.plotX ?? 0) - 3, 6];
  }
  return point.series.chart.inverted ? [max, max - min] : [min, max - min];
}

// The `axis.plotLinesAndBands` API is not covered with TS.
function iteratePlotLines(chart: Highcharts.Chart, cb: (line: Highcharts.PlotLineOrBand) => void) {
  chart.axes.forEach((axis) => {
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => cb(line));
    }
  });
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartLabels } from "../i18n-utils";
import { ChartHighlightProps, CoreLegendItem, Rect } from "../interfaces";
import { getGroupRect, isSeriesStacked } from "../utils";

// Chart API context is used for dependency injection for chart utilities.
// It is initialized on chart render, and includes the chart instance, consumer
// settings and state, and derived state, which is computed from the chart instance
// on each render, and reused across utilities to avoid duplicate work.

export interface ChartExtraContext {
  settings: ChartExtraContext.Settings;
  handlers: ChartExtraContext.Handlers;
  state: ChartExtraContext.State;
  derived: ChartExtraContext.DerivedState;
  chartOrNull: null | Highcharts.Chart;
  chart: () => Highcharts.Chart;
}

export namespace ChartExtraContext {
  export interface Settings {
    chartId: string;
    noDataEnabled: boolean;
    legendEnabled: boolean;
    tooltipEnabled: boolean;
    keyboardNavigationEnabled: boolean;
    labels: ChartLabels;
  }

  export interface Handlers {
    onHighlight?(props: ChartHighlightProps): void;
    onClearHighlight?(): void;
    onVisibleItemsChange?: (legendItems: readonly CoreLegendItem[]) => void;
  }

  export interface State {
    visibleItems?: readonly string[];
  }

  export interface DerivedState {
    allX: number[];
    getAllXInSeries: (series: Highcharts.Series) => number[];
    getPointsByX: (x: number) => Highcharts.Point[];
    groupRects: { group: Highcharts.Point[]; rect: Rect }[];
  }
}

// The context is created when the chart component is rendered for the first time.
// On every subsequent render the settings and state are updated directly in the context object.
export function createChartContext(): ChartExtraContext {
  return {
    settings: {
      chartId: "",
      noDataEnabled: false,
      legendEnabled: false,
      tooltipEnabled: false,
      keyboardNavigationEnabled: false,
      labels: {},
    },
    handlers: {},
    state: {},
    chart: () => {
      // Before the first chart render there is no chart instance, which is required for most of the utilities.
      // Instead of doing null checks in each utility, an attempt to access the chart instance before it is ready
      // will cause an exception, indicating an logical error in the code.
      throw new Error("Invariant violation: using chart API before initialization.");
    },
    chartOrNull: null,
    derived: { allX: [], getAllXInSeries: () => [], getPointsByX: () => [], groupRects: [] },
  };
}

// The update method is called on every chart render, before any other initialization code.
// This ensures the context state is up to date and can be used for subsequent computations.
export function updateChartContext(context: ChartExtraContext, chart: Highcharts.Chart) {
  context.chart = () => chart;
  context.chartOrNull = chart;
  context.derived = computeDerivedState(chart);
}

function computeDerivedState(chart: Highcharts.Chart): ChartExtraContext.DerivedState {
  const allXSet = new Set<number>();
  const allXInSeries = new WeakMap<Highcharts.Series, number[]>();
  const pointsByX = new Map<number, Highcharts.Point[]>();
  const getXPoints = (x: number) => pointsByX.get(x) ?? [];
  const addPoint = (point: Highcharts.Point) => {
    const xPoints = getXPoints(point.x);
    xPoints.push(point);
    pointsByX.set(point.x, xPoints);
  };
  const compareX = (a: number, b: number) => a - b;
  for (const s of chart.series) {
    const seriesX = new Set<number>();
    if (s.visible) {
      for (const d of s.data) {
        // Points with y=null represent the absence of value, there is no need to include them and those
        // should have no impact on computed rects or navigation.
        if (d.visible && d.y !== null) {
          seriesX.add(d.x);
          allXSet.add(d.x);
          addPoint(d);
        }
      }
    }
    allXInSeries.set(s, Array.from(seriesX).sort(compareX));
  }
  for (const [, points] of pointsByX) {
    sortPoints(points);
  }
  const allX = Array.from(allXSet).sort(compareX);
  return {
    allX,
    getAllXInSeries: (s) => allXInSeries.get(s) ?? [],
    getPointsByX: (x) => pointsByX.get(x) ?? [],
    // Group rects are computed for every available x coordinate, each including at least one point with matching x value.
    // They enclose all matching points of the group and are used to match hover position and place the tooltip or focus outline.
    groupRects: allX.map((x) => ({
      group: getXPoints(x),
      rect: getGroupRect(getXPoints(x)),
    })),
  };
}

// The points are sorted to ensure consistent navigation, including inverted chart orientation.
// The order of series in grouped column charts is kept, while stacked series are sorted by their
// respective positions in the plot.
function sortPoints(group: Highcharts.Point[]) {
  const reversed = !!group[0]?.series.yAxis?.reversed;
  group.sort((a, b) => {
    const ay = a.plotY === undefined || (a.series.type === "column" && !isSeriesStacked(a.series)) ? 0 : a.plotY;
    const by = b.plotY === undefined || (b.series.type === "column" && !isSeriesStacked(b.series)) ? 0 : b.plotY;
    return !reversed ? ay - by : by - ay;
  });
}

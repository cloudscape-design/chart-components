// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex, getIsRtl } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import { getGroupRect, isSeriesStacked } from "../utils";
import { ChartExtraHighlight } from "./chart-extra-highlight";

// Chart helper that extends Highcharts.Chart with additional methods, used internally to find matched points, and more.
export class ChartExtra {
  // The chart is only initialized in the render event. Using any methods before that is not expected.
  private _chart: null | Highcharts.Chart = null;
  public get chart(): Highcharts.Chart {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }
  public get chartOrNull(): null | Highcharts.Chart {
    return this._chart;
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    this._chart = chart;
    this.computeCache();
    this.highlightState.onChartRender(chart);
  };

  // Custom points/series highlighting.
  private highlightState = new ChartExtraHighlight();
  public highlightChartItems = this.highlightState.highlightChartItems.bind(this.highlightState);
  public clearChartItemsHighlight = this.highlightState.clearChartItemsHighlight.bind(this.highlightState);
  public setSeriesState = this.highlightState.setSeriesState.bind(this.highlightState);
  public setPointState = this.highlightState.setPointState.bind(this.highlightState);

  // The group rects are computed for every available x coordinate, each including at least one point with matching x value.
  // The reacts enclose all matching points of the group and are used to match hover position and place the tooltip or focus outline.
  public get groupRects(): { group: Highcharts.Point[]; rect: Rect }[] {
    return this.cache.groupRects;
  }

  public findMatchingGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    return this.getPointsByX(point.x);
  };

  public findFirstGroup = (): Highcharts.Point[] => {
    return this.getPointsByX(this.allX[0]);
  };

  public findLastGroup = (): Highcharts.Point[] => {
    return this.getPointsByX(this.allX[this.allX.length - 1]);
  };

  public findNextGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextIndex(this.allX, this.allX.indexOf(point.x), 1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  public findPrevGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextIndex(this.allX, this.allX.indexOf(point.x), -1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  public findNextPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextPageIndex(this.allX, this.allX.indexOf(point.x), 1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  public findPrevPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextPageIndex(this.allX, this.allX.indexOf(point.x), -1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  public findFirstPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    return point.series.data.find((d) => d.x === seriesX[0]) ?? null;
  };

  public findLastPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    return point.series.data.find((d) => d.x === seriesX[seriesX.length - 1]) ?? null;
  };

  public findNextPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !this.shouldInvertPointsDirection(point) ? 1 : -1;
    const nextIndex = getNextIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  public findPrevPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !this.shouldInvertPointsDirection(point) ? -1 : 1;
    const nextIndex = getNextIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  public findNextPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !this.shouldInvertPointsDirection(point) ? 1 : -1;
    const nextIndex = getNextPageIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  public findPrevPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !this.shouldInvertPointsDirection(point) ? -1 : 1;
    const nextIndex = getNextPageIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  // We do not invert the direction of pie segments when RTL, but swap the left/right keys.
  // To offset for that, the prev/next points direction is swapped, too.
  private shouldInvertPointsDirection = (point: Highcharts.Point) => {
    const isRTL = getIsRtl(point.series.chart.container.parentElement);
    return point.series.type === "pie" && isRTL;
  };

  // On each render we compute navigation details that are expected to stay the same until the next render.
  private cache = {
    allX: new Array<number>(),
    allXInSeries: new WeakMap<Highcharts.Series, number[]>(),
    pointsByX: new Map<number, Highcharts.Point[]>(),
    groupRects: new Array<{ group: Highcharts.Point[]; rect: Rect }>(),
  };

  private computeCache() {
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
    for (const s of this.chart.series) {
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
    this.cache.allX = Array.from(allXSet).sort(compareX);
    this.cache.allXInSeries = allXInSeries;
    this.cache.pointsByX = pointsByX;
    this.cache.groupRects = this.cache.allX.map((x) => ({ group: getXPoints(x), rect: getGroupRect(getXPoints(x)) }));
  }

  private get allX(): number[] {
    return this.cache.allX;
  }

  private getAllXInSeries = (series: Highcharts.Series): number[] => {
    return this.cache.allXInSeries.get(series) ?? [];
  };

  private getPointsByX = (x: number): Highcharts.Point[] => {
    return this.cache.pointsByX.get(x) ?? [];
  };
}

// In charts with many data points one can navigate faster by using Page Down/Up keys that
// navigate PAGE_SIZE_PERCENTAGE of the points forwards or backwards.
const PAGE_SIZE_PERCENTAGE = 0.05;

function getNextIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return circleIndex(pointIndex + delta, [0, array.length - 1]);
}

function getNextPageIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return delta > 0
    ? Math.min(array.length - 1, pointIndex + delta * Math.floor(array.length * PAGE_SIZE_PERCENTAGE))
    : Math.max(0, pointIndex - delta * Math.floor(array.length * PAGE_SIZE_PERCENTAGE));
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

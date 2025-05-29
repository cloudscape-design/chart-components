// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { Rect } from "../interfaces-core";
import { getGroupRect, isSeriesStacked } from "../utils";

// Chart helper that extends Highcharts.Chart with additional computations done on each render.
export class ChartExtraBase {
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
  };

  // The group rects are computed for every available x coordinate, each including at least one point with matching x value.
  // The reacts enclose all matching points of the group and are used to match hover position and place the tooltip or focus outline.
  public get groupRects(): { group: Highcharts.Point[]; rect: Rect }[] {
    return this.cache.groupRects;
  }

  public get allX(): number[] {
    return this.cache.allX;
  }

  public getAllXInSeries = (series: Highcharts.Series): number[] => {
    return this.cache.allXInSeries.get(series) ?? [];
  };

  public getPointsByX = (x: number): Highcharts.Point[] => {
    return this.cache.pointsByX.get(x) ?? [];
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

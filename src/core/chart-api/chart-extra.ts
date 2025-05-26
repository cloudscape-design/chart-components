// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import { getGroupRect } from "../utils";

// In charts with many data points one can navigate faster by using Page Down/Up keys that
// navigate PAGE_SIZE_PERCENTAGE of the points forwards or backwards.
const PAGE_SIZE_PERCENTAGE = 0.05;

// Chart helper that extends Highcharts.Chart with additional methods, used internally to find matched points, and more.
export class ChartExtra {
  // The chart is only initialized after the Highcharts render event. Using any methods before that will cause an exception.
  private _chart: null | Highcharts.Chart = null;
  // On each render we compute navigation detail that are expected to stay the same until the next render.
  private cache = {
    allX: new Array<number>(),
    allXInSeries: new WeakMap<Highcharts.Series, number[]>(),
    groupRects: new Array<{ group: Highcharts.Point[]; rect: Rect }>(),
  };

  public onRender = (chart: Highcharts.Chart) => {
    this._chart = chart;
    this.cache = this.computeCache();
  };

  private computeCache() {
    const allXSet = new Set<number>();
    const allXInSeries = new WeakMap<Highcharts.Series, number[]>();
    for (const s of this.chart.series) {
      const xSeriesSet = new Set<number>();
      if (s.visible) {
        for (const d of s.data) {
          if (d.visible && d.y !== null) {
            xSeriesSet.add(d.x);
            allXSet.add(d.x);
          }
        }
      }
      allXInSeries.set(
        s,
        [...xSeriesSet].sort((a, b) => a - b),
      );
    }
    const allX = [...allXSet].sort((a, b) => a - b);
    const groups = allX.map((x) => this.findPointsByX(x));
    const groupRects = groups.map((group) => ({ rect: getGroupRect(group), group }));
    return { allX, allXInSeries, groupRects };
  }

  public get chart(): Highcharts.Chart {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }

  public get chartOrNull(): null | Highcharts.Chart {
    return this._chart;
  }

  // The points are grouped by their X coordinate. The group rects return the point groups and their respective rects
  // that include all points of the group. That is used to render focus outline and tooltip target.
  public get groupRects() {
    return this.cache.groupRects;
  }

  public findMatchingGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const points = point ? this.findPointsByX(point.x) : [];
    return sortGroup(points);
  };

  public findFirstGroup = (): Highcharts.Point[] => {
    const firstX = this.allX[0];
    return sortGroup(this.findPointsByX(firstX));
  };

  public findLastGroup = (): Highcharts.Point[] => {
    const lastX = this.allX[this.allX.length - 1];
    return sortGroup(this.findPointsByX(lastX));
  };

  public findNextGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const pointIndex = point ? this.allX.indexOf(point.x) : -1;
    const nextIndex = circleIndex(pointIndex + 1, [0, this.allX.length - 1]);
    return sortGroup(this.findPointsByX(this.allX[nextIndex]));
  };

  public findPrevGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const pointIndex = point ? this.allX.indexOf(point.x) : this.allX.length;
    const nextIndex = circleIndex(pointIndex - 1, [0, this.allX.length - 1]);
    return sortGroup(this.findPointsByX(this.allX[nextIndex]));
  };

  public findNextPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const pointIndex = point ? this.allX.indexOf(point.x) : 0;
    const nextIndex = Math.min(this.allX.length - 1, pointIndex + Math.floor(this.allX.length * PAGE_SIZE_PERCENTAGE));
    return sortGroup(this.findPointsByX(this.allX[nextIndex]));
  };

  public findPrevPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const pointIndex = point ? this.allX.indexOf(point.x) : this.allX.length - 1;
    const nextIndex = Math.max(0, pointIndex - Math.floor(this.allX.length * PAGE_SIZE_PERCENTAGE));
    return sortGroup(this.findPointsByX(this.allX[nextIndex]));
  };

  public findFirstPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const nextX = seriesX[0];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  public findLastPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const nextX = seriesX[seriesX.length - 1];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  public findNextPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const pointIndex = seriesX.indexOf(point.x);
    const nextIndex = circleIndex(pointIndex + 1, [0, seriesX.length - 1]);
    const nextX = seriesX[nextIndex];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  public findPrevPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const pointIndex = seriesX.indexOf(point.x);
    const nextIndex = circleIndex(pointIndex - 1, [0, seriesX.length - 1]);
    const nextX = seriesX[nextIndex];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  public findNextPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const pointIndex = seriesX.indexOf(point.x);
    const nextIndex = Math.min(seriesX.length - 1, pointIndex + Math.floor(seriesX.length * PAGE_SIZE_PERCENTAGE));
    const nextX = seriesX[nextIndex];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  public findPrevPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const pointIndex = seriesX.indexOf(point.x);
    const nextIndex = Math.max(0, pointIndex - Math.floor(seriesX.length * PAGE_SIZE_PERCENTAGE));
    const nextX = seriesX[nextIndex];
    return point.series.data.find((d) => d.x === nextX) ?? null;
  };

  private findPointsByX = (x: number): Highcharts.Point[] => {
    const points: Highcharts.Point[] = [];
    for (const s of this.chart.series) {
      if (!s.visible) {
        continue;
      }
      for (const p of s.data) {
        if (!p.visible) {
          continue;
        }
        if (p.x === x && p.y !== null) {
          points.push(p);
        }
      }
    }
    return points;
  };

  private get allX() {
    return this.cache.allX;
  }

  private getAllXInSeries = (series: Highcharts.Series): number[] => {
    return this.cache.allXInSeries.get(series) ?? [];
  };
}

function sortGroup(group: Highcharts.Point[]): Highcharts.Point[] {
  return group.sort((a, b) => {
    const ay = a.plotY === undefined || (a.series.type === "column" && !isSeriesStacked(a.series)) ? 0 : a.plotY;
    const by = b.plotY === undefined || (b.series.type === "column" && !isSeriesStacked(b.series)) ? 0 : b.plotY;
    return ay - by;
  });
}

function isSeriesStacked(series: Highcharts.Series) {
  return (series.options as any).stacking === "normal";
}

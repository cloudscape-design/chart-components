// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex, getIsRtl } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import { ChartExtraBase } from "./chart-extra-base";
import { ChartExtraHighlight } from "./chart-extra-highlight";
import { ChartExtraTooltip } from "./chart-extra-tooltip";

// Chart helper that extends Highcharts.Chart with additional methods, used internally to find matched points, and more.
export class ChartExtra {
  private chartExtra = new ChartExtraBase();

  public get chart() {
    return this.chartExtra.chart;
  }

  public get chartOrNull() {
    return this.chartExtra.chartOrNull;
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    this.chartExtra.onChartRender(chart);
    this.highlightExtra.onChartRender();
  };

  // Custom points/series highlighting.
  private highlightExtra = new ChartExtraHighlight(this.chartExtra);
  public highlightChartItems = this.highlightExtra.highlightChartItems.bind(this.highlightExtra);
  public clearChartItemsHighlight = this.highlightExtra.clearChartItemsHighlight.bind(this.highlightExtra);
  public setSeriesState = this.highlightExtra.setSeriesState.bind(this.highlightExtra);
  public setPointState = this.highlightExtra.setPointState.bind(this.highlightExtra);

  // Custom tooltip placement and cursor.
  private tooltipExtra = new ChartExtraTooltip(this.chartExtra);
  public onRenderTooltip = this.tooltipExtra.onRenderTooltip.bind(this.tooltipExtra);
  public onClearHighlight = this.tooltipExtra.onClearHighlight.bind(this.tooltipExtra);
  public getTargetTrack = this.tooltipExtra.getTargetTrack.bind(this.tooltipExtra);
  public getGroupTrack = this.tooltipExtra.getGroupTrack.bind(this.tooltipExtra);

  // The group rects are computed for every available x coordinate, each including at least one point with matching x value.
  // The reacts enclose all matching points of the group and are used to match hover position and place the tooltip or focus outline.
  public get groupRects(): { group: Highcharts.Point[]; rect: Rect }[] {
    return this.chartExtra.groupRects;
  }
  public get allX(): number[] {
    return this.chartExtra.allX;
  }
  public getPointsByX = this.chartExtra.getPointsByX.bind(this.chartExtra);
  public getAllXInSeries = this.chartExtra.getAllXInSeries.bind(this.chartExtra);

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
}

// In charts with many data points one can navigate faster by using Page Down/Up keys that
// navigate PAGE_SIZE_PERCENTAGE of the points forwards or backwards.
const PAGE_SIZE_PERCENTAGE = 0.05;

function getNextIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return circleIndex(pointIndex + delta, [0, array.length - 1]);
}

function getNextPageIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return Math.min(array.length - 1, Math.max(0, pointIndex + delta * Math.floor(array.length * PAGE_SIZE_PERCENTAGE)));
}

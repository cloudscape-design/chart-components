// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getPointId, getSeriesId } from "../utils";

const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

export class ChartHighlightState {
  private _chart: null | Highcharts.Chart = null;
  private seriesState = new Map<string, Highcharts.SeriesStateValue>();
  private pointState = new Map<string, Map<string, Highcharts.SeriesStateValue>>();

  public init(chart: Highcharts.Chart) {
    this._chart = chart;
    this.overrideStateSetters();
    this.restoreHighlightState();
  }

  private get chart(): Highcharts.Chart {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }

  public highlightChartItems = (itemIds: readonly string[]) => {
    for (const s of this.chart.series) {
      if (s.type !== "pie") {
        this.setSeriesState(s, itemIds.includes(getSeriesId(s)) ? "normal" : "inactive");
      }
      if (s.type === "pie") {
        for (const p of s.data) {
          this.setPointState(p, itemIds.includes(getPointId(p)) ? "normal" : "inactive");
        }
      }
    }
    // All plot lines that define ID, and this ID does not match the highlighted item are dimmed.
    iteratePlotLines(this.chart, (line) => {
      if (line.options.id && !itemIds.includes(line.options.id)) {
        line.svgElem?.attr({ opacity: 0.4 });
      } else if (line.options.id) {
        line.svgElem?.attr({ opacity: 1 });
      }
    });
  };

  public clearChartItemsHighlight = () => {
    // When a legend item loses highlight we assume no series should be highlighted at that point,
    // so removing inactive state from all series, points, and plot lines.
    for (const s of this.chart.series) {
      this.setSeriesState(s, "normal");
      for (const p of s.data) {
        this.setPointState(p, "normal");
      }
    }
    iteratePlotLines(this.chart, (line) => {
      if (line.options.id) {
        line.svgElem?.attr({ opacity: 1 });
      }
    });
  };

  public setSeriesState(series: Highcharts.Series, state: Highcharts.SeriesStateValue) {
    (this.chart as any)[SET_STATE_OVERRIDE_MARKER] = true;
    series.setState(state, false);
    this.updateSeriesState(series, state);
    (this.chart as any)[SET_STATE_OVERRIDE_MARKER] = false;
  }

  public setPointState(point: Highcharts.Point, state: Highcharts.PointStateValue) {
    (this.chart as any)[SET_STATE_OVERRIDE_MARKER] = true;
    point.setState(state, true);
    this.updatePointState(point, state);
    (this.chart as any)[SET_STATE_OVERRIDE_MARKER] = false;
  }

  private restoreHighlightState() {
    const inactiveSeriesIds: string[] = [];
    for (const s of this.chart.series) {
      const seriesState = this.seriesState.get(getSeriesId(s));
      if (seriesState) {
        this.setSeriesState(s, seriesState);
      }
      if (seriesState === "inactive") {
        inactiveSeriesIds.push(getSeriesId(s));
      }
      for (const p of s.data) {
        const pointState = this.pointState.get(getSeriesId(s))?.get(this.getPointKey(p));
        if (pointState) {
          this.setPointState(p, pointState);
        }
      }
    }
    // All plot lines that define ID, and this ID does not match the highlighted item are dimmed.
    iteratePlotLines(this.chart, (line) => {
      if (line.options.id && inactiveSeriesIds.includes(line.options.id)) {
        line.svgElem?.attr({ opacity: 0.4 });
      }
    });
  }

  private updateSeriesState(series: Highcharts.Series, state: Highcharts.SeriesStateValue) {
    this.seriesState.set(getSeriesId(series), state);
  }

  private updatePointState(point: Highcharts.Point, state: Highcharts.PointStateValue) {
    const pointStateInSeries = this.pointState.get(getSeriesId(point.series)) ?? new Map();
    pointStateInSeries.set(this.getPointKey(point), state);
    this.pointState.set(getSeriesId(point.series), pointStateInSeries);
  }

  private getPointKey = (point: Highcharts.Point) => {
    return point.options.id ?? `${point.x}:${point.y ?? "null"}`;
  };

  // We replace `setState` method on Highcharts series and points with a custom implementation,
  // to prevent Highcharts from altering series or point states. Instead, we take ownership of that.
  private overrideStateSetters = () => {
    for (const s of this.chart.series) {
      // We ensure the replacement is done only once by assigning a custom property to the function.
      // If the property is present - it means the method was already replaced.
      if (!(s.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
        const original = s.setState;
        s.setState = (...args) => {
          if ((this.chart as any)[SET_STATE_OVERRIDE_MARKER]) {
            original.call(s, ...args);
          }
        };
        (s.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
      }
      for (const d of s.data) {
        if (!(d.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
          const original = d.setState;
          d.setState = (...args) => {
            if ((this.chart as any)[SET_STATE_OVERRIDE_MARKER]) {
              original.call(d, ...args);
            }
          };
          (d.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
        }
      }
    }
  };
}

// The `axis.plotLinesAndBands` API is not covered with TS.
function iteratePlotLines(chart: Highcharts.Chart, cb: (line: Highcharts.PlotLineOrBand) => void) {
  chart.axes?.forEach((axis) => {
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => cb(line));
    }
  });
}

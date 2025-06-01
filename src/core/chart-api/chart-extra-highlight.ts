// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import * as Styles from "../styles";
import { getPointId, getSeriesId } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

const SET_STATE_LOCK = Symbol("awsui-set-state-lock");

type SeriesSetStateWithLock = Highcharts.Series["setState"] & { [SET_STATE_LOCK]: boolean };
type PointSetStateWithLock = Highcharts.Point["setState"] & { [SET_STATE_LOCK]: boolean };

// Chart helper that mutes Highcharts default highlighting behavior and offers custom methods
// for customized control over series and points highlighting.
export class ChartExtraHighlight {
  private context: ChartExtraContext;
  constructor(context: ChartExtraContext) {
    this.context = context;
  }

  // We keep track of the previously highlighted series and points to recover highlight state if needed.
  // The recover is necessary if the chart was re-rendered while the highlighting is set. For example,
  // when triggered a state update from the consumer-provided tooltip footer action.
  private seriesState = new Map<string, Highcharts.SeriesStateValue>();
  private pointState = new Map<string, Map<string, Highcharts.SeriesStateValue>>();

  public onChartRender() {
    this.overrideStateSetters();
    this.restoreHighlightState();
  }

  // The method highlights specified series or points (by id). It is used when hovering over the legend items.
  public highlightChartItems = (itemIds: readonly string[]) => {
    for (const s of this.context.chart().series) {
      // In pie charts it is the points, not series, that are shown in the legend, and can be highlighted.
      if (s.type === "pie") {
        for (const p of s.data) {
          this.setPointState(p, itemIds.includes(getPointId(p)) ? "normal" : "inactive");
        }
      } else {
        this.setSeriesState(s, itemIds.includes(getSeriesId(s)) ? "normal" : "inactive");
      }
    }
    setPlotLinesState(this.context.chart(), (lineId) => itemIds.includes(lineId));
  };

  // Removes dimmed state from all series and points.
  public clearChartItemsHighlight = () => {
    for (const s of this.context.chart().series) {
      this.setSeriesState(s, "normal");
      for (const p of s.data) {
        this.setPointState(p, "normal");
      }
    }
    setPlotLinesState(this.context.chart(), () => true);
  };

  // Used to make the specified series active or dimmed.
  public setSeriesState(series: Highcharts.Series, state: Highcharts.SeriesStateValue) {
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = false;
    series.setState(state, false);
    this.updateStoredSeriesState(series, state);
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  // Used to make the specified point active or dimmed.
  public setPointState(point: Highcharts.Point, state: Highcharts.PointStateValue) {
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = false;
    point.setState(state, true);
    this.updateStoredPointState(point, state);
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  // Restores series and points highlight state after chart's re-render.
  private restoreHighlightState() {
    const inactiveSeriesIds = new Set<string>();
    for (const s of this.context.chart().series) {
      const prevState = this.seriesState.get(getSeriesId(s));
      if (prevState) {
        this.setSeriesState(s, prevState);
      }
      if (prevState === "inactive") {
        inactiveSeriesIds.add(getSeriesId(s));
      }
      for (const p of s.data) {
        const prevState = this.pointState.get(getSeriesId(s))?.get(this.getPointKey(p));
        if (prevState) {
          this.setPointState(p, prevState);
        }
      }
    }
    setPlotLinesState(this.context.chart(), (lineId) => !inactiveSeriesIds.has(lineId));
  }

  private updateStoredSeriesState(series: Highcharts.Series, state: Highcharts.SeriesStateValue) {
    this.seriesState.set(getSeriesId(series), state);
  }

  private updateStoredPointState(point: Highcharts.Point, state: Highcharts.PointStateValue) {
    const pointStateInSeries = this.pointState.get(getSeriesId(point.series)) ?? new Map();
    pointStateInSeries.set(this.getPointKey(point), state);
    this.pointState.set(getSeriesId(point.series), pointStateInSeries);
  }

  // The points normally don't have ID's or names. In that case, the points are identified by
  // the combination of x and y values. This is only used to restore the highlight state after re-render.
  private getPointKey = (point: Highcharts.Point) => {
    return point.options.id ?? `${point.x}:${point.y ?? "null"}`;
  };

  // We replace `setState` method on Highcharts series and points with a custom implementation, that
  // prevents Highcharts from altering it. Instead, every state change is explicitly done by the helper.
  private overrideStateSetters = () => {
    for (const s of this.context.chart().series) {
      // We ensure the replacement is done only once by assigning a custom property to the function.
      // If the property is present - it means the method was already replaced.
      if ((s.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] === undefined) {
        const original = s.setState;
        // The overridden setState method does nothing unless setState[SET_STATE_LOCK] === false.
        const overridden: Highcharts.Series["setState"] = (...args) => {
          if ((overridden as SeriesSetStateWithLock)[SET_STATE_LOCK] === false) {
            original.call(s, ...args);
          }
        };
        (overridden as SeriesSetStateWithLock)[SET_STATE_LOCK] = true;
        s.setState = overridden;
      }
      for (const d of s.data) {
        if ((d.setState as PointSetStateWithLock)[SET_STATE_LOCK] === undefined) {
          const original = d.setState;
          // The overridden setState method does nothing unless setState[SET_STATE_LOCK] === false.
          const overridden: Highcharts.Point["setState"] = (...args) => {
            if ((overridden as PointSetStateWithLock)[SET_STATE_LOCK] === false) {
              original.call(d, ...args);
            }
          };
          (overridden as PointSetStateWithLock)[SET_STATE_LOCK] = true;
          d.setState = overridden;
        }
      }
    }
  };
}

// The cartesian chart thresholds are represented with invisible series and visible plot lines.
// When the corresponding series are highlighted, we need to make the not matching plot lines dimmed.
function setPlotLinesState(chart: Highcharts.Chart, isActive: (lineId: string) => boolean) {
  iteratePlotLines(chart, (lineId, line) =>
    line.svgElem?.attr({ opacity: !isActive(lineId) ? Styles.dimmedPlotLineOpacity : 1 }),
  );
}

function iteratePlotLines(chart: Highcharts.Chart, cb: (lineId: string, line: Highcharts.PlotLineOrBand) => void) {
  chart.axes?.forEach((axis) => {
    // The Highcharts `Axis.plotLinesAndBands` API is not covered with TS.
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => {
        // We explicitly do not touch plot lines that have no ID, assuming those are decorative.
        // Only plot lines that define ID can be dimmed when certain series get highlighted.
        if (line.options.id) {
          cb(line.options.id, line);
        }
      });
    }
  });
}

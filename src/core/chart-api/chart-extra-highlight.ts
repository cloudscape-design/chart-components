// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import * as Styles from "../../internal/chart-styles";
import {
  getChartSeries,
  getLinkedSeries,
  getMasterSeries,
  getMasterSeriesOf,
  getSeriesData,
  SafeChart,
  SafeSeries,
} from "../../internal/utils/highcharts";
import { getPointId, getSeriesId } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

const SET_STATE_LOCK = Symbol("awsui-set-state-lock");

type SeriesSetStateWithLock = SafeSeries["setState"] & { [SET_STATE_LOCK]: boolean };
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
  private seriesState = new Map<string, "" | Highcharts.SeriesStateValue>();
  private previewState = new Map<string, "" | Highcharts.SeriesStateValue>();
  private pointPreviewState = new Map<string, Map<string, "" | Highcharts.PointStateValue>>();
  private pointState = new Map<string, Map<string, "" | Highcharts.PointStateValue>>();
  private columnStatesSynced = false;

  public onChartRender() {
    this.columnStatesSynced = false;
    this.overrideStateSetters();
    this.restoreHighlightState();
  }

  // The method highlights specified series or points (by id). It is used when hovering over the legend items.
  public highlightChartItems = (itemIds: readonly string[]) => {
    this.discardPreview();
    const itemIdsSet = new Set(itemIds);
    for (const s of getChartSeries(this.context.chart())) {
      // In pie charts it is the points, not series, that are shown in the legend, and can be highlighted.
      if (s.type === "pie") {
        for (const p of getSeriesData(s)) {
          if (itemIdsSet.has(getPointId(p))) {
            this.setPointState(p, "hover");
          }
        }
      } else {
        const seriesActive = itemIdsSet.has(getSeriesId(s));
        const masterSeriesActive = s.linkedParent ? itemIdsSet.has(getSeriesId(s.linkedParent)) : false;
        const activeState = this.context.settings.hoverDebounceEnabled ? "hover" : "";
        this.setSeriesState(s, seriesActive || masterSeriesActive ? activeState : "inactive");
      }
    }
    setPlotLinesState(this.context.chart(), (lineId) => itemIdsSet.has(lineId));
  };

  // This method is similar to the above, but it takes a group of points. The cartesian chart points
  // do not have IDs, so we match points and series by their references instead. This is used to control
  // highlight state when chart elements are hovered or focused.
  public highlightChartGroup = (points: readonly Highcharts.Point[]) => {
    this.discardPreview();
    const includedPoints = new Set<Highcharts.Point>();
    const includedSeries = new Set<SafeSeries>();
    const includedSeriesIds = new Set<string>();
    points.forEach((point) => {
      includedPoints.add(point);
      getLinkedSeries(point).forEach((s) => {
        includedSeries.add(s);
        includedSeriesIds.add(getSeriesId(s));
      });
    });
    for (const s of getChartSeries(this.context.chart())) {
      this.setSeriesState(s, includedSeries.has(s) ? "" : "inactive");
      // For column series we ensure only one group/stack that matches selected X is highlighted.
      // See: https://github.com/highcharts/highcharts/issues/23076.
      if (s.type === "column") {
        for (const d of getSeriesData(s)) {
          this.setPointState(d, includedPoints.has(d) ? "" : "inactive", !this.columnStatesSynced);
        }
      }
    }
    this.columnStatesSynced = true;
    setPlotLinesState(this.context.chart(), (lineId) => includedSeriesIds.has(lineId));
  };

  // This method is similar to the above, but it takes a single point. This is used for point highlighting
  // in cartesian charts, and for pie chart segments.
  public highlightChartPoint = (point: Highcharts.Point) => {
    this.discardPreview();
    const masterSeries = getMasterSeries(point);
    const linkedSeries = new Set(getLinkedSeries(point));
    for (const s of getChartSeries(this.context.chart())) {
      // For pie charts it is important that the hover actions comes last, as otherwise the segment's highlight "halo"
      // is removed whenever any segment is made inactive.
      this.setSeriesState(s, linkedSeries.has(s) ? "hover" : "inactive");
      if (s.type === "pie") {
        for (const d of getSeriesData(s)) {
          this.setPointState(d, "inactive");
        }
        this.setPointState(point, "hover");
      }
      // For column series we ensure only one group/stack that matches selected X is highlighted.
      else if (s.type === "column") {
        for (const d of getSeriesData(s)) {
          this.setPointState(d, d === point ? "hover" : "inactive", !this.columnStatesSynced);
        }
      }
    }
    this.columnStatesSynced = true;
    // Highlight threshold series plot lines.
    setPlotLinesState(this.context.chart(), (lineId) => lineId === getSeriesId(masterSeries));
  };

  public previewChartPoint = (point: Highcharts.Point) => {
    const linkedSeries = new Set(getLinkedSeries(point));
    return this.previewStates(
      (s) => (linkedSeries.has(s) ? "hover" : null),
      (p) => (p === point ? "hover" : null),
      ["pie", "column"],
      point.series.type === "column",
    );
  };

  public previewChartGroup = (group: readonly Highcharts.Point[]) => {
    const groupPoints = new Set(group);
    const groupSeriesIds = new Set(group.map((p) => getSeriesId(getMasterSeries(p))));
    return this.previewStates(
      (s) => (groupSeriesIds.has(getSeriesId(getMasterSeriesOf(s))) ? "" : null),
      (p) => (groupPoints.has(p) ? "" : null),
      ["column"],
      group.some((p) => p.series.type === "column"),
    );
  };

  public previewChartItems = (itemIds: readonly string[]) => {
    return this.previewStates(
      (s) => (itemIds.includes(getSeriesId(getMasterSeriesOf(s))) ? "hover" : null),
      (p) => (itemIds.includes(getPointId(p)) ? "hover" : null),
      ["pie"],
      getChartSeries(this.context.chart()).some(
        (s) => s.type === "column" && itemIds.includes(getSeriesId(getMasterSeriesOf(s))),
      ),
    );
  };

  private previewStates(
    getSeriesTargetState: (series: SafeSeries) => null | "" | "hover",
    getPointTargetState: (point: Highcharts.Point) => null | "" | "hover",
    pointSeriesTypes: readonly string[],
    dimAtOnce: boolean,
  ) {
    const dimmed = dimAtOnce || this.isDimmed();
    const getNonTargetState = <State extends string>(appliedState: "" | State) =>
      dimmed ? "inactive" : appliedState === "hover" ? "" : appliedState;
    const hoveredPoints: Highcharts.Point[] = [];
    for (const s of getChartSeries(this.context.chart())) {
      if (s.type !== "pie") {
        this.setSeriesPreviewState(s, getSeriesTargetState(s) ?? getNonTargetState(this.getSeriesState(s)));
      }
      if (pointSeriesTypes.includes(s.type)) {
        for (const p of getSeriesData(s)) {
          const state = getPointTargetState(p) ?? getNonTargetState(this.getPointState(p));
          if (state === "hover") {
            hoveredPoints.push(p);
          } else {
            this.setPointPreviewState(p, state);
          }
        }
      }
    }
    hoveredPoints.forEach((p) => this.setPointPreviewState(p, "hover"));
    return dimmed;
  }

  public cancelPreview = () => {
    if (this.previewState.size === 0 && this.pointPreviewState.size === 0) {
      return;
    }
    const previewedSeries = this.previewState;
    const previewedPoints = this.pointPreviewState;
    this.discardPreview();
    const hoveredPoints: Highcharts.Point[] = [];
    for (const s of getChartSeries(this.context.chart())) {
      if (previewedSeries.has(getSeriesId(s))) {
        this.applySeriesState(s, this.getSeriesState(s));
      }
      const previewedSeriesPoints = previewedPoints.get(getSeriesId(s));
      for (const p of previewedSeriesPoints ? getSeriesData(s) : []) {
        if (previewedSeriesPoints?.has(this.getPointKey(p))) {
          const state = this.getPointState(p);
          if (state === "hover") {
            hoveredPoints.push(p);
          } else {
            this.applyPointState(p, state);
          }
        }
      }
    }
    hoveredPoints.forEach((p) => this.applyPointState(p, "hover"));
  };

  private discardPreview() {
    this.previewState = new Map();
    this.pointPreviewState = new Map();
  }

  private isDimmed() {
    return (
      [...this.seriesState.values()].includes("inactive") ||
      [...this.pointState.values()].some((states) => [...states.values()].includes("inactive"))
    );
  }

  private getSeriesState(series: SafeSeries) {
    return this.seriesState.get(getSeriesId(series)) ?? "";
  }

  private getPointState(point: Highcharts.Point) {
    return this.pointState.get(getSeriesId(point.series))?.get(this.getPointKey(point)) ?? "";
  }

  private withInstantUndim(series: { options: object }, state: string, setState: () => void) {
    if (this.context.settings.hoverDebounceEnabled) {
      applyWithInstantUndim(series, state, setState);
    } else {
      setState();
    }
  }

  private setSeriesPreviewState(series: SafeSeries, state: "" | Highcharts.SeriesStateValue) {
    this.previewState.set(getSeriesId(series), state);
    this.applySeriesState(series, state);
  }

  private setPointPreviewState(point: Highcharts.Point, state: "" | Highcharts.PointStateValue) {
    const seriesPoints = this.pointPreviewState.get(getSeriesId(point.series)) ?? new Map();
    seriesPoints.set(this.getPointKey(point), state);
    this.pointPreviewState.set(getSeriesId(point.series), seriesPoints);
    this.applyPointState(point, state, point.series.type !== "column" || !this.columnStatesSynced);
  }

  private applySeriesState(series: SafeSeries, state: "" | Highcharts.SeriesStateValue) {
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = false;
    this.withInstantUndim(series, state, () => series.setState(state, false));
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  private applyPointState(point: Highcharts.Point, state: "" | Highcharts.PointStateValue, move = true) {
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = false;
    this.withInstantUndim(point.series, state, () => point.setState(state, move));
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  // Removes dimmed state from all series and points.
  public clearChartItemsHighlight = () => {
    this.discardPreview();
    for (const s of getChartSeries(this.context.chart())) {
      this.setSeriesState(s, "");
      for (const p of getSeriesData(s)) {
        this.setPointState(p, "");
      }
    }
    setPlotLinesState(this.context.chart(), () => true);
  };

  // Makes the specified series active or dimmed.
  private setSeriesState(series: SafeSeries, state: "" | Highcharts.SeriesStateValue) {
    this.applySeriesState(series, state);
    this.updateStoredSeriesState(series, state);
  }

  // Makes the specified point active or dimmed.
  private setPointState(point: Highcharts.Point, state: "" | Highcharts.PointStateValue, move = true) {
    this.applyPointState(point, state, move);
    this.updateStoredPointState(point, state);
  }

  // Restores series and points highlight state after chart's re-render.
  private restoreHighlightState() {
    const inactiveSeriesIds = new Set<string>();
    for (const s of getChartSeries(this.context.chart())) {
      const prevState = this.seriesState.get(getSeriesId(s));
      if (prevState) {
        this.setSeriesState(s, prevState);
      }
      if (prevState === "inactive") {
        inactiveSeriesIds.add(getSeriesId(s));
      }
      for (const p of getSeriesData(s)) {
        const prevState = this.pointState.get(getSeriesId(s))?.get(this.getPointKey(p));
        if (prevState) {
          this.setPointState(p, prevState);
        }
      }
    }
    setPlotLinesState(this.context.chart(), (lineId) => !inactiveSeriesIds.has(lineId));
    for (const s of getChartSeries(this.context.chart())) {
      const previewState = this.previewState.get(getSeriesId(s));
      if (previewState !== undefined) {
        this.applySeriesState(s, previewState);
      }
      const pointPreviewStates = this.pointPreviewState.get(getSeriesId(s));
      for (const p of pointPreviewStates ? getSeriesData(s) : []) {
        const pointPreviewState = pointPreviewStates?.get(this.getPointKey(p));
        if (pointPreviewState !== undefined) {
          this.applyPointState(p, pointPreviewState);
        }
      }
    }
  }

  private updateStoredSeriesState(series: SafeSeries, state: "" | Highcharts.SeriesStateValue) {
    this.seriesState.set(getSeriesId(series), state);
  }

  private updateStoredPointState(point: Highcharts.Point, state: "" | Highcharts.PointStateValue) {
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
    for (const s of getChartSeries(this.context.chart())) {
      // We ensure the replacement is done only once by assigning a custom property to the function.
      // If the property is present - it means the method was already replaced.
      if ((s.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] === undefined) {
        const original = s.setState;
        // The overridden setState method does nothing unless setState[SET_STATE_LOCK] === false.
        const overridden: SafeSeries["setState"] = (...args) => {
          if ((overridden as SeriesSetStateWithLock)[SET_STATE_LOCK] === false) {
            original.call(s, ...args);
          }
        };
        (overridden as SeriesSetStateWithLock)[SET_STATE_LOCK] = true;
        s.setState = overridden;
      }
      for (const d of getSeriesData(s)) {
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
function setPlotLinesState(chart: SafeChart, isActive: (lineId: string) => boolean) {
  iteratePlotLines(chart, (lineId, line) =>
    line.svgElem?.attr({ opacity: !isActive(lineId) ? Styles.dimmedPlotLineOpacity : 1 }),
  );
}

function iteratePlotLines(chart: SafeChart, cb: (lineId: string, line: Highcharts.PlotLineOrBand) => void) {
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

function applyWithInstantUndim(series: { options: object }, state: string, setState: () => void) {
  const states = (series.options as { states?: Record<string, undefined | { animation?: unknown }> }).states;
  if (state === "inactive" || !states) {
    setState();
    return;
  }
  const key = state || "normal";
  const stateOptions = states[key] ?? (states[key] = {});
  const animation = stateOptions.animation;
  stateOptions.animation = { duration: 1 };
  setState();
  stateOptions.animation = animation;
}

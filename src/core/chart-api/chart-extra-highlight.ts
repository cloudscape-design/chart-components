// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import * as Styles from "../../internal/chart-styles";
import {
  getChartSeries,
  getLinkedSeries,
  getMasterSeries,
  getSeriesData,
  SafeChart,
  SafeSeries,
} from "../../internal/utils/highcharts";
import { getPointId, getSeriesId } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

const SET_STATE_LOCK = Symbol("awsui-set-state-lock");

type SeriesSetStateWithLock = SafeSeries["setState"] & { [SET_STATE_LOCK]: boolean };

type HighlightState = "" | Highcharts.SeriesStateValue;

interface HighlightStore {
  series: Map<string, HighlightState>;
  points: Map<string, Map<string, HighlightState>>;
}

function createHighlightStore(): HighlightStore {
  return { series: new Map(), points: new Map() };
}

interface HighlightTargetStates {
  getSeriesState: (series: SafeSeries) => null | HighlightState;
  getPointState: (point: Highcharts.Point) => null | HighlightState;
  pointSeriesTypes: readonly string[];
  isPlotLineActive: (lineId: string) => boolean;
  dimsAtOnce: boolean;
}
type PointSetStateWithLock = Highcharts.Point["setState"] & { [SET_STATE_LOCK]: boolean };

// Chart helper that mutes Highcharts default highlighting behavior and offers custom methods
// for customized control over series and points highlighting.
export class ChartExtraHighlight {
  private context: ChartExtraContext;
  constructor(context: ChartExtraContext) {
    this.context = context;
    context.scheduler.onCancel(() => {
      const previewed = this.preview;
      this.preview = createHighlightStore();
      this.applyStates(previewed, this.applied);
    });
  }

  // We keep track of the previously highlighted series and points to recover highlight state if needed.
  // The recover is necessary if the chart was re-rendered while the highlighting is set. For example,
  // when triggered a state update from the consumer-provided tooltip footer action.
  private applied = createHighlightStore();
  private preview = createHighlightStore();
  private columnStatesSynced = false;

  public onChartRender() {
    this.columnStatesSynced = false;
    this.overrideStateSetters();
    this.restoreHighlightState();
  }

  // The method highlights specified series or points (by id). It is used when hovering over the legend items.
  public highlightChartItems = (itemIds: readonly string[], { preview = false } = {}) => {
    const itemIdsSet = new Set(itemIds);
    const isItemActive = (s: SafeSeries) =>
      itemIdsSet.has(getSeriesId(s)) || (!!s.linkedParent && itemIdsSet.has(getSeriesId(s.linkedParent)));
    const activeState = this.context.settings.hoverDelay !== null ? "hover" : "";
    return this.setHighlight(
      {
        // In pie charts it is the points, not series, that are shown in the legend, and can be highlighted.
        getSeriesState: (s) => (s.type === "pie" ? null : isItemActive(s) ? activeState : "inactive"),
        getPointState: (p) => (itemIdsSet.has(getPointId(p)) ? "hover" : null),
        pointSeriesTypes: ["pie"],
        isPlotLineActive: (lineId) => itemIdsSet.has(lineId),
        dimsAtOnce: getChartSeries(this.context.chart()).some((s) => s.type === "column" && isItemActive(s)),
      },
      preview,
    );
  };

  // This method is similar to the above, but it takes a group of points. The cartesian chart points
  // do not have IDs, so we match points and series by their references instead. This is used to control
  // highlight state when chart elements are hovered or focused.
  public highlightChartGroup = (points: readonly Highcharts.Point[], { preview = false } = {}) => {
    const includedPoints = new Set<Highcharts.Point>(points);
    const includedSeries = new Set<SafeSeries>();
    const includedSeriesIds = new Set<string>();
    points.forEach((point) => {
      getLinkedSeries(point).forEach((s) => {
        includedSeries.add(s);
        includedSeriesIds.add(getSeriesId(s));
      });
    });
    return this.setHighlight(
      {
        getSeriesState: (s) => (includedSeries.has(s) ? "" : "inactive"),
        // For column series we ensure only one group/stack that matches selected X is highlighted.
        // See: https://github.com/highcharts/highcharts/issues/23076.
        getPointState: (p) => (includedPoints.has(p) ? "" : "inactive"),
        pointSeriesTypes: ["column"],
        isPlotLineActive: (lineId) => includedSeriesIds.has(lineId),
        dimsAtOnce: points.some((p) => p.series.type === "column"),
      },
      preview,
    );
  };

  // This method is similar to the above, but it takes a single point. This is used for point highlighting
  // in cartesian charts, and for pie chart segments.
  public highlightChartPoint = (point: Highcharts.Point, { preview = false } = {}) => {
    const masterSeries = getMasterSeries(point);
    const linkedSeries = new Set(getLinkedSeries(point));
    return this.setHighlight(
      {
        getSeriesState: (s) => (linkedSeries.has(s) ? "hover" : "inactive"),
        // For column series we ensure only one group/stack that matches selected X is highlighted.
        getPointState: (p) => (p === point ? "hover" : "inactive"),
        pointSeriesTypes: ["pie", "column"],
        // Highlight threshold series plot lines.
        isPlotLineActive: (lineId) => lineId === getSeriesId(masterSeries),
        dimsAtOnce: point.series.type === "column",
      },
      preview,
    );
  };

  // Removes dimmed state from all series and points.
  public clearChartItemsHighlight = ({ keepPreview = false } = {}) => {
    if (!keepPreview) {
      this.preview = createHighlightStore();
    }
    for (const s of getChartSeries(this.context.chart())) {
      this.setSeriesState(s, "");
      for (const p of getSeriesData(s)) {
        this.setPointState(p, "");
      }
    }
    setPlotLinesState(this.context.chart(), () => true);
    this.applyStates(this.preview);
  };

  private setHighlight(
    { getSeriesState, getPointState, pointSeriesTypes, isPlotLineActive, dimsAtOnce }: HighlightTargetStates,
    preview: boolean,
  ) {
    if (!preview) {
      this.preview = createHighlightStore();
    }
    const store = preview ? this.preview : this.applied;
    const dimmed = preview && (dimsAtOnce || this.isDimmed());
    const resolve = (target: null | HighlightState, applied: HighlightState): null | HighlightState => {
      if (!preview || (target !== null && target !== "inactive")) {
        return target;
      }
      return dimmed ? "inactive" : applied === "hover" ? "" : applied;
    };
    // For pie charts it is important that the hover actions comes last, as otherwise the segment's highlight "halo"
    // is removed whenever any segment is made inactive.
    const hoveredPoints: Highcharts.Point[] = [];
    let columnsUpdated = false;
    for (const s of getChartSeries(this.context.chart())) {
      const seriesState =
        preview && s.type === "pie" ? null : resolve(getSeriesState(s), this.applied.series.get(getSeriesId(s)) ?? "");
      if (seriesState !== null) {
        this.setSeriesState(s, seriesState, store);
      }
      if (pointSeriesTypes.includes(s.type)) {
        for (const p of getSeriesData(s)) {
          const pointState = resolve(getPointState(p), this.getStoredPointState(this.applied, p) ?? "");
          if (pointState === "hover") {
            hoveredPoints.push(p);
          } else if (pointState !== null) {
            this.setPointState(p, pointState, store);
          }
        }
        columnsUpdated = columnsUpdated || s.type === "column";
      }
    }
    hoveredPoints.forEach((p) => this.setPointState(p, "hover", store));
    if (!preview) {
      this.columnStatesSynced = this.columnStatesSynced || columnsUpdated;
      setPlotLinesState(this.context.chart(), isPlotLineActive);
    }
    return dimmed;
  }

  private isDimmed() {
    return (
      [...this.applied.series.values()].includes("inactive") ||
      [...this.applied.points.values()].some((states) => [...states.values()].includes("inactive"))
    );
  }

  // Makes the specified series active or dimmed.
  private setSeriesState(series: SafeSeries, state: HighlightState, store = this.applied) {
    this.applySeriesState(series, state);
    store.series.set(getSeriesId(series), state);
  }

  // Makes the specified point active or dimmed.
  private setPointState(point: Highcharts.Point, state: HighlightState, store = this.applied) {
    this.applyPointState(point, state);
    const pointStateInSeries = store.points.get(getSeriesId(point.series)) ?? new Map();
    pointStateInSeries.set(this.getPointKey(point), state);
    store.points.set(getSeriesId(point.series), pointStateInSeries);
  }

  private applyStates(store: HighlightStore, fallback?: HighlightStore) {
    const hoveredPoints: Highcharts.Point[] = [];
    for (const s of getChartSeries(this.context.chart())) {
      const seriesState = store.series.get(getSeriesId(s));
      if (seriesState !== undefined) {
        this.applySeriesState(s, fallback ? (fallback.series.get(getSeriesId(s)) ?? "") : seriesState);
      }
      for (const p of store.points.has(getSeriesId(s)) ? getSeriesData(s) : []) {
        const pointState = this.getStoredPointState(store, p);
        if (pointState !== undefined) {
          const state = fallback ? (this.getStoredPointState(fallback, p) ?? "") : pointState;
          if (state === "hover") {
            hoveredPoints.push(p);
          } else {
            this.applyPointState(p, state);
          }
        }
      }
    }
    hoveredPoints.forEach((p) => this.applyPointState(p, "hover"));
  }

  private applySeriesState(series: SafeSeries, state: HighlightState) {
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = false;
    this.withInstantUndim(series, state, () => series.setState(state, false));
    (series.setState as SeriesSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  private applyPointState(point: Highcharts.Point, state: HighlightState) {
    const move = point.series.type !== "column" || !this.columnStatesSynced;
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = false;
    this.withInstantUndim(point.series, state, () => point.setState(state, move));
    (point.setState as PointSetStateWithLock)[SET_STATE_LOCK] = true;
  }

  private withInstantUndim(series: { options: object }, state: string, setState: () => void) {
    if (this.context.settings.hoverDelay !== null) {
      applyWithInstantUndim(series, state, setState);
    } else {
      setState();
    }
  }

  // Restores series and points highlight state after chart's re-render.
  private restoreHighlightState() {
    const inactiveSeriesIds = new Set<string>();
    for (const [seriesId, state] of this.applied.series) {
      if (state === "inactive") {
        inactiveSeriesIds.add(seriesId);
      }
    }
    this.applyStates(this.applied);
    setPlotLinesState(this.context.chart(), (lineId) => !inactiveSeriesIds.has(lineId));
    this.applyStates(this.preview);
  }

  private getStoredPointState(store: HighlightStore, point: Highcharts.Point) {
    return store.points.get(getSeriesId(point.series))?.get(this.getPointKey(point));
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

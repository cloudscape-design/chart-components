// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import type Highcharts from "highcharts";

import { ReadonlyAsyncStore } from "../../internal/utils/async-store";
import { getChartAccessibleDescription, getGroupAccessibleDescription, getPointAccessibleDescription } from "../utils";
import { ChartExtraAxisTitles, ReactiveAxisTitlesState } from "./chart-extra-axis-titles";
import { ChartExtraContext, createChartContext, updateChartContext } from "./chart-extra-context";
import { ChartExtraHighlight } from "./chart-extra-highlight";
import { ChartExtraLegend, ReactiveLegendState } from "./chart-extra-legend";
import { ChartExtraNavigation, ChartExtraNavigationHandlers } from "./chart-extra-navigation";
import { ChartExtraNodata, ReactiveNodataState } from "./chart-extra-nodata";
import { ChartExtraPointer, ChartExtraPointerHandlers } from "./chart-extra-pointer";
import { ChartExtraTooltip, ReactiveTooltipState } from "./chart-extra-tooltip";

const LAST_DISMISS_DELAY = 250;

export function useChartAPI(
  settings: ChartExtraContext.Settings,
  handlers: ChartExtraContext.Handlers,
  state: ChartExtraContext.State,
) {
  const api = useRef(new ChartAPI(settings, handlers, state)).current;
  useEffect(() => {
    api.context.settings = settings;
    api.context.handlers = handlers;
    api.context.state = state;
  });

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const visibleItemsIndex = state.visibleItems ? state.visibleItems.join("::") : null;
  useEffect(() => {
    if (api.ready && visibleItemsIndex !== null) {
      api.updateChartItemsVisibility(visibleItemsIndex.split("::").filter(Boolean));
    }
  }, [api, visibleItemsIndex]);

  // Run cleanup code when the component unmounts.
  useEffect(() => () => api.onChartDestroy(), [api]);

  return api;
}

export class ChartAPI {
  public context = createChartContext();
  private chartExtraHighlight = new ChartExtraHighlight(this.context);
  private chartExtraTooltip = new ChartExtraTooltip(this.context);
  private chartExtraNavigation = new ChartExtraNavigation(this.context, this.navigationHandlers);
  private chartExtraPointer = new ChartExtraPointer(this.context, this.pointerHandlers);
  private chartExtraLegend = new ChartExtraLegend(this.context);
  private chartExtraNodata = new ChartExtraNodata(this.context);
  private chartExtraAxisTitles = new ChartExtraAxisTitles(this.context);
  private lastDismissTime = 0;

  constructor(
    settings: ChartExtraContext.Settings,
    handlers: ChartExtraContext.Handlers,
    state: ChartExtraContext.State,
  ) {
    this.context.settings = settings;
    this.context.handlers = handlers;
    this.context.state = state;
  }

  private get chart() {
    return this.context.chart();
  }

  public get ready() {
    return !!this.context.chartOrNull;
  }

  public get tooltipStore() {
    return this.chartExtraTooltip as ReadonlyAsyncStore<ReactiveTooltipState>;
  }

  public get legendStore() {
    return this.chartExtraLegend as ReadonlyAsyncStore<ReactiveLegendState>;
  }

  public get nodataStore() {
    return this.chartExtraNodata as ReadonlyAsyncStore<ReactiveNodataState>;
  }

  public get axisTitlesStore() {
    return this.chartExtraAxisTitles as ReadonlyAsyncStore<ReactiveAxisTitlesState>;
  }

  public getTargetTrack = this.chartExtraTooltip.getTargetTrack.bind(this.chartExtraTooltip);
  public getGroupTrack = this.chartExtraTooltip.getGroupTrack.bind(this.chartExtraTooltip);

  public setApplication = (element: null | HTMLElement) => {
    this.chartExtraNavigation.setApplication(element);
  };

  public get options() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const chartAPI = this;
    const onChartLoad: Highcharts.ChartLoadCallbackFunction = function (this) {
      chartAPI.chartExtraPointer.onChartLoad(this);
    };
    const onChartRender: Highcharts.ChartRenderCallbackFunction = function (this) {
      updateChartContext(chartAPI.context, this);
      chartAPI.chartExtraHighlight.onChartRender();
      chartAPI.chartExtraLegend.onChartRender();
      chartAPI.chartExtraNodata.onChartRender();
      chartAPI.chartExtraAxisTitles.onChartRender();
      chartAPI.handleDestroyedPoints();
      chartAPI.resetColorCounter();
      chartAPI.showMarkersForIsolatedPoints();
    };
    const onChartClick: Highcharts.ChartClickCallbackFunction = function () {
      chartAPI.chartExtraPointer.onChartClick(this.hoverPoint);
    };
    const onSeriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function () {
      chartAPI.chartExtraPointer.onSeriesPointMouseOver(this);
    };
    const onSeriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
      chartAPI.chartExtraPointer.onSeriesPointMouseOut();
    };
    const onSeriesPointClick: Highcharts.PointClickCallbackFunction = function () {
      chartAPI.chartExtraPointer.onSeriesPointClick(this);
    };
    return {
      ...this.chartExtraNodata.options,
      onChartLoad,
      onChartRender,
      onChartClick,
      onSeriesPointMouseOver,
      onSeriesPointMouseOut,
      onSeriesPointClick,
    };
  }

  public onMouseEnterTooltip = this.chartExtraPointer.onMouseEnterTooltip.bind(this.chartExtraPointer);
  public onMouseLeaveTooltip = this.chartExtraPointer.onMouseLeaveTooltip.bind(this.chartExtraPointer);

  public onChartDestroy = () => {
    this.chartExtraPointer.onChartDestroy();
    this.chartExtraTooltip.onChartDestroy();
  };

  private get navigationHandlers(): ChartExtraNavigationHandlers {
    return {
      onFocusChart: () => {
        this.clearChartHighlight();
        this.announceApplicationChart();
      },
      onFocusGroup: (group: Highcharts.Point[]) => {
        this.highlightChartGroup(group);
        this.announceApplicationGroup(group, false);
      },
      onFocusPoint: (point: Highcharts.Point) => {
        this.highlightChartPoint(point);
        this.announceApplicationPoint(point, false);
      },
      onBlur: () => this.clearChartHighlight(),
      onActivateGroup: () => {
        const current = this.chartExtraTooltip.get();
        if (current.group.length > 0) {
          this.chartExtraTooltip.pinTooltip();
          this.announceApplicationGroup(current.group, true);
        }
      },
      onActivatePoint: () => {
        const current = this.chartExtraTooltip.get();
        if (current.point) {
          this.chartExtraTooltip.pinTooltip();
          this.announceApplicationPoint(current.point, true);
        }
      },
    };
  }

  private get pointerHandlers(): ChartExtraPointerHandlers {
    return {
      onPointHover: (point) => {
        this.highlightChartPoint(point);
      },
      onGroupHover: (group) => {
        this.highlightChartGroup(group);
      },
      onHoverLost: () => {
        this.clearChartHighlight();
      },
      onPointClick: (point) => {
        this.pinTooltipPoint(point);
      },
      onGroupClick: (group) => {
        this.pinTooltipGroup(group);
      },
    };
  }

  private announceApplicationChart() {
    this.chartExtraNavigation.announceChart(getChartAccessibleDescription());
  }

  private announceApplicationGroup(group: Highcharts.Point[], pinned: boolean) {
    this.chartExtraNavigation.announceElement(getGroupAccessibleDescription(group), pinned);
  }

  private announceApplicationPoint(point: Highcharts.Point, pinned: boolean) {
    this.chartExtraNavigation.announceElement(getPointAccessibleDescription(point), pinned);
  }

  public registerLegend = this.chartExtraLegend.registerLegend.bind(this.chartExtraLegend);
  public unregisterLegend = this.chartExtraLegend.unregisterLegend.bind(this.chartExtraLegend);
  public onItemVisibilityChange = this.chartExtraLegend.onItemVisibilityChange.bind(this.chartExtraLegend);
  public updateChartItemsVisibility = this.chartExtraLegend.updateChartItemsVisibility.bind(this.chartExtraLegend);

  public highlightChartItems = (itemIds: readonly string[]) => {
    this.chartExtraHighlight.highlightChartItems(itemIds);
  };

  public clearChartItemsHighlight = () => {
    this.chartExtraHighlight.clearChartItemsHighlight();
  };

  public onDismissTooltip = (outsideClick?: boolean) => {
    const { pinned, point, group } = this.chartExtraTooltip.get();
    if (pinned) {
      this.lastDismissTime = new Date().getTime();
      this.chartExtraTooltip.hideTooltip();
      this.clearChartHighlight();
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        if (!this.context.settings.keyboardNavigationEnabled) {
          // This brings the focus back to the chart.
          // If the last focused target is no longer around - the focus goes back to the first data point.
          this.chart.series?.[0]?.data?.[0].graphic?.element.focus();
        } else {
          this.chartExtraNavigation.focusApplication(point, group);
        }
      }
    }
  };

  public highlightChartGroup = (group: Highcharts.Point[]) => {
    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.chartExtraTooltip.get().pinned) {
      return false;
    }
    this.highlightActionsGroup(group);
    this.chartExtraTooltip.setTooltipGroup(group);
  };

  // When hovering (or focusing) over the target (point, bar, segment, etc.) we show the tooltip in the target coordinate.
  public highlightChartPoint = (point: Highcharts.Point) => {
    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.chartExtraTooltip.get().pinned) {
      return false;
    }
    this.highlightActionsPoint(point);
    this.chartExtraTooltip.setTooltipPoint(point, this.context.derived.getPointsByX(point.x));
  };

  public clearChartHighlight = () => {
    if (!this.chartExtraTooltip.get().pinned) {
      this.clearHighlightActions();
      this.chartExtraTooltip.hideTooltip();
    }
  };

  private showMarkersForIsolatedPoints() {
    let shouldRedraw = false;
    for (const s of this.chart.series) {
      for (let i = 0; i < s.data.length; i++) {
        if (
          (s.data[i - 1]?.y === undefined || s.data[i - 1]?.y === null) &&
          (s.data[i + 1]?.y === undefined || s.data[i + 1]?.y === null) &&
          !s.data[i].options.marker?.enabled
        ) {
          s.data[i].update({ marker: { enabled: true } }, false);
          shouldRedraw = true;
        }
      }
    }
    if (shouldRedraw) {
      this.chart.redraw();
    }
  }

  // Highcharts sometimes destroys points upon re-rendering. As result, the already stored points can get
  // replaced by `{ destroyed: true }`. As we only store points (outside the render loop) for the tooltip,
  // we clear its state if detecting destroyed points to prevent crashing.
  // The behavior is only observed during the initial chart loading and is not expected to cause UX issues with the
  // tooltip being closed unexpectedly.
  private handleDestroyedPoints() {
    const tooltipState = this.chartExtraTooltip.get();
    if (tooltipState.group.some((p) => !p.series)) {
      this.chartExtraTooltip.hideTooltip();
    }
  }

  // We reset color counter so that when a series is removed and then added back - it will
  // have the same color as before, not the next one in the color sequence.
  // See: https://github.com/highcharts/highcharts/issues/23077.
  private resetColorCounter() {
    if ("colorCounter" in this.chart && typeof this.chart.colorCounter === "number") {
      this.chart.colorCounter = this.chart.series.length;
    }
  }

  private pinTooltipPoint = (point: Highcharts.Point) => {
    const current = this.chartExtraTooltip.get();

    // The behavior is ignored if the popover is already pinned.
    if (current.pinned) {
      return;
    }

    const currentPosX = current.point?.x ?? current.group[0]?.x;
    const currentPosY = current.point?.y ?? current.group[0]?.y;

    // If the click point is different from the current position - the tooltip is moved to the new position.
    if ((point.x !== undefined && point.x !== currentPosX) || (point.y !== undefined && point.y !== currentPosY)) {
      this.highlightActionsPoint(point);
      this.chartExtraTooltip.setTooltipPoint(point, this.context.derived.getPointsByX(point.x));
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      this.chartExtraTooltip.setTooltipPoint(point, this.context.derived.getPointsByX(point.x));
      if (current.group.length > 0) {
        this.chartExtraTooltip.pinTooltip();
      }
    }
  };

  private pinTooltipGroup = (group: Highcharts.Point[]) => {
    const current = this.chartExtraTooltip.get();

    // The behavior is ignored if the popover is already pinned.
    if (current.pinned) {
      return;
    }

    const currentPosX = current.point?.x ?? current.group[0]?.x;
    const currentPosY = current.point?.y ?? current.group[0]?.y;
    const nextPosX = group[0]?.x;
    const nextPosY = group[0]?.y;

    // If the click point is different from the current position - the tooltip is moved to the new position.
    if ((nextPosX !== undefined && nextPosX !== currentPosX) || (nextPosY !== undefined && nextPosY !== currentPosY)) {
      this.highlightActionsGroup(group);
      this.chartExtraTooltip.setTooltipGroup(group);
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      this.chartExtraTooltip.setTooltipGroup(current.group);
      if (current.group.length > 0) {
        this.chartExtraTooltip.pinTooltip();
      }
    }
  };

  private highlightActionsPoint = (point: Highcharts.Point) => {
    const group = this.context.derived.getPointsByX(point.x);
    this.setHighlightState(group);
    this.chartExtraTooltip.onRenderTooltip({ point, group });
    this.context.handlers.onHighlight?.({ point, group });
    this.chartExtraLegend.highlightMatchedItems([point]);
  };

  private highlightActionsGroup = (group: Highcharts.Point[]) => {
    if (group.length === 0) {
      return;
    }
    this.setHighlightState(group);
    this.chartExtraTooltip.onRenderTooltip({ point: null, group });
    this.context.handlers.onHighlight?.({ point: null, group });
    this.chartExtraLegend.highlightMatchedItems(group);
  };

  private setHighlightState(points: Highcharts.Point[]) {
    const includedPoints = new Set<Highcharts.Point>();
    const includedSeries = new Set<Highcharts.Series>();
    points.forEach((point) => {
      includedPoints.add(point);
      includedSeries.add(point.series);
    });
    if (!this.chartExtraTooltip.get().pinned) {
      for (const s of this.chart.series) {
        this.chartExtraHighlight.setSeriesState(s, includedSeries.has(s) ? "normal" : "inactive");
        if (s.type === "column" || s.type === "pie") {
          for (const d of s.data) {
            this.chartExtraHighlight.setPointState(d, includedPoints.has(d) ? "normal" : "inactive");
          }
        }
      }
    }
  }

  private clearHighlightActions = () => {
    this.chartExtraTooltip.onClearHighlight();
    this.context.handlers.onClearHighlight?.();
    this.chartExtraLegend.clearHighlightedItems();

    if (!this.chartExtraTooltip.get().pinned) {
      for (const s of this.chart.series ?? []) {
        this.chartExtraHighlight.setSeriesState(s, "normal");
        for (const d of s.data) {
          this.chartExtraHighlight.setPointState(d, "normal");
        }
      }
    }
  };
}

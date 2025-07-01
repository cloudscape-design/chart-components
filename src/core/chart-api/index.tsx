// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import type Highcharts from "highcharts";

import { ReadonlyAsyncStore } from "../../internal/utils/async-store";
import { getChartSeries } from "../../internal/utils/chart-series";
import { Writeable } from "../../internal/utils/utils";
import {
  getChartAccessibleDescription,
  getGroupAccessibleDescription,
  getPointAccessibleDescription,
  isXThreshold,
} from "../utils";
import { ChartExtraAxisTitles, ReactiveAxisTitlesState } from "./chart-extra-axis-titles";
import { ChartExtraContext, createChartContext, updateChartContext } from "./chart-extra-context";
import { ChartExtraHighlight } from "./chart-extra-highlight";
import { ChartExtraLegend, ReactiveLegendState } from "./chart-extra-legend";
import { ChartExtraNavigation, ChartExtraNavigationHandlers } from "./chart-extra-navigation";
import { ChartExtraNodata, ReactiveNodataState } from "./chart-extra-nodata";
import { ChartExtraPointer, ChartExtraPointerHandlers } from "./chart-extra-pointer";
import { ChartExtraTooltip, ReactiveTooltipState } from "./chart-extra-tooltip";

// The API helper injects Cloudscape custom behaviors, and returns the API instance that comes with
// reactive state and handlers to be assigned as Highcharts options, used by Cloudscape components
// (tooltip, legend, and other), or exposed as public core chart API.
export function useChartAPI(
  settings: ChartExtraContext.Settings,
  handlers: ChartExtraContext.Handlers,
  state: ChartExtraContext.State,
) {
  // The API helper instance defines many pieces of internal state with different lifecycles, most
  // of which are not be invalidated when the hook re-renders, or properties change. That is why we
  // create the instance once, when the component is mounted.
  const api = useRef(new ChartAPI(settings, handlers, state)).current;
  // The consumer-defined properties can still change during the component lifecycle. We propagate the
  // changes by updating the helper's context directly. That is fine for most of the properties, as those
  // are only used in event-based callbacks, and require nothing to recompute when there is a change.
  useEffect(() => {
    api.context.settings = settings;
    api.context.handlers = handlers;
    api.context.state = state;
  });

  // The only property that does require notifying the helper when it changes, is the visible items state.
  // We stringify the visible items array so that it is compared by value, and the effect is only fired when
  // there is an actual change to the visible items, including items order.
  const visibleItemsIndex = state.visibleItems ? state.visibleItems.join("::") : null;
  useEffect(() => {
    // When visibleItemsIndex === null, it means the visible items state is managed internally inside the helper,
    // so no need to call the API method.
    // The api.updateItemsVisibility() can only be used once the chart is initialized, so we check for api.ready.
    // The initialization happens after the first React render, so the chart is expected to not be ready when the
    // effect is called for the first time. This is fine, as the initial visibility state is handled by the helper.
    // The code below is needed to notify the helper any time the visible items state changes.
    if (api.ready && visibleItemsIndex !== null) {
      api.updateItemsVisibility();
    }
  }, [api, visibleItemsIndex]);

  // Run cleanup code when the component unmounts.
  useEffect(() => () => api.onChartDestroy(), [api]);

  return api;
}

// The main chart helper that provides customizations to Highcharts, including tooltip, legend, keyboard navigation, and more.
// It is split into multiple dedicated (chart-extra) helpers (highlight, tooltip, navigation, and other), most of which define
// internal state, and have a lifecycle based on Highcharts render event.
// The helper code has a shared context, which includes the consumer settings, visible items state, and derived state, computed
// from Highcharts.Chart on each render, and reused for downstream computations for better efficiency.
export class ChartAPI {
  public context = createChartContext();
  private chartExtraHighlight = new ChartExtraHighlight(this.context);
  private chartExtraTooltip = new ChartExtraTooltip(this.context);
  private chartExtraNavigation = new ChartExtraNavigation(this.context, this.navigationHandlers);
  private chartExtraPointer = new ChartExtraPointer(this.context, this.pointerHandlers);
  private chartExtraLegend = new ChartExtraLegend(this.context);
  private chartExtraNodata = new ChartExtraNodata(this.context);
  private chartExtraAxisTitles = new ChartExtraAxisTitles(this.context);

  constructor(
    settings: ChartExtraContext.Settings,
    handlers: ChartExtraContext.Handlers,
    state: ChartExtraContext.State,
  ) {
    this.context.settings = settings;
    this.context.handlers = handlers;
    this.context.state = state;
  }

  // The ready() returns true if the chart is initialized and helper methods are safe to use (after Highcharts triggers onChartRender).
  // Using any of the helper methods before the chart is initialized will result in an exception.
  public get ready() {
    return !!this.context.chartOrNull;
  }

  // The Highcharts options to be merged with the rest of the configuration defined in the chart-core.
  public getOptions() {
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
      onChartLoad,
      onChartRender,
      onChartClick,
      onSeriesPointMouseOver,
      onSeriesPointMouseOut,
      onSeriesPointClick,
    };
  }

  // There is no cleanup or destroy event in Highcharts options, so we define a custom one
  // to be used when the React component unmounts.
  public onChartDestroy = () => {
    this.chartExtraNavigation.onChartDestroy();
    this.chartExtraPointer.onChartDestroy();
    this.chartExtraTooltip.onChartDestroy();
  };

  // Reactive state stores.
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

  // References to SVG elements used for tooltip placement.
  public getTargetTrack = this.chartExtraTooltip.getTargetTrack.bind(this.chartExtraTooltip);
  public getGroupTrack = this.chartExtraTooltip.getGroupTrack.bind(this.chartExtraTooltip);

  // Legend marker renderer.
  public renderMarker = this.chartExtraLegend.renderMarker.bind(this.chartExtraLegend);

  // Callbacks assigned to the tooltip.
  public onMouseEnterTooltip = this.chartExtraPointer.onMouseEnterTooltip.bind(this.chartExtraPointer);
  public onMouseLeaveTooltip = this.chartExtraPointer.onMouseLeaveTooltip.bind(this.chartExtraPointer);
  public onDismissTooltip = (outsideClick?: boolean) => {
    const { pinned, point, group } = this.chartExtraTooltip.get();
    if (pinned) {
      this.chartExtraTooltip.hideTooltip();
      // The chart highlight is preserved while the tooltip is pinned. We need to clear it manually here, for the case
      // when the pointer lands outside the chart after the tooltip is dismissed, so that the mouse-out event won't fire.
      this.clearChartHighlight();
      // If the tooltip was not dismissed by clicking outside, we bring focus to the point or group, that was
      // associated with the tooltip, so that we user can continue keyboard navigation from that spot.
      if (!outsideClick) {
        this.chartExtraNavigation.focusApplication(point, group);
      }
    }
  };

  // Reference to the role="application" element used for navigation.
  public setApplication = this.chartExtraNavigation.setApplication.bind(this.chartExtraNavigation);

  // A callback to notify the helper when items visibility state changes.
  public updateItemsVisibility = this.chartExtraLegend.updateItemsVisibility.bind(this.chartExtraLegend);

  // A callback used by the legend and filter components when series/segments visibility changes.
  public onItemVisibilityChange = this.chartExtraLegend.onItemVisibilityChange.bind(this.chartExtraLegend);

  // Callbacks used by the legend component when items highlight state changes.
  public onHighlightChartItems = (itemIds: readonly string[]) => {
    if (!this.isTooltipPinned) {
      this.chartExtraHighlight.highlightChartItems(itemIds);
      this.chartExtraLegend.onHighlightItems(itemIds);
    }
  };
  public onClearChartItemsHighlight = () => {
    if (!this.isTooltipPinned) {
      this.chartExtraHighlight.clearChartItemsHighlight();
      this.chartExtraLegend.onClearHighlight();
    }
  };

  // Callbacks used for hover and keyboard navigation, and also exposed to the public API to give the ability
  // to highlight and show tooltip for the given point or group manually.
  public setItemsVisible = (visibleItemsIds: readonly string[]) => {
    this.chartExtraLegend.onItemVisibilityChange(visibleItemsIds);
  };
  public highlightChartPoint = (point: Highcharts.Point) => {
    if (!this.isTooltipPinned) {
      this.highlightActions(point);
    }
  };
  public highlightChartGroup = (group: readonly Highcharts.Point[]) => {
    if (!this.isTooltipPinned) {
      this.highlightActions(group as Writeable<Highcharts.Point[]>);
    }
  };
  public clearChartHighlight = () => {
    if (!this.isTooltipPinned) {
      this.clearHighlightActions();
    }
  };

  // A set of callbacks required for keyboard navigation.
  private get navigationHandlers(): ChartExtraNavigationHandlers {
    return {
      onFocusChart: () => {
        this.clearChartHighlight();
        this.chartExtraNavigation.announceChart(getChartAccessibleDescription(this.context.chart()));
      },
      onFocusGroup: (group: Highcharts.Point[]) => {
        this.highlightActions(group, true);
        this.chartExtraNavigation.announceElement(getGroupAccessibleDescription(group), false);
      },
      onFocusPoint: (point: Highcharts.Point) => {
        const labels = this.context.settings.labels;
        this.highlightActions(point, true);
        this.chartExtraNavigation.announceElement(getPointAccessibleDescription(point, labels), false);
      },
      onBlur: () => this.clearChartHighlight(),
      onActivateGroup: () => {
        const current = this.chartExtraTooltip.get();
        if (current.group.length > 0) {
          this.chartExtraTooltip.pinTooltip();
          this.chartExtraNavigation.announceElement(getGroupAccessibleDescription(current.group), true);
        }
      },
      onActivatePoint: () => {
        const current = this.chartExtraTooltip.get();
        if (current.point) {
          const labels = this.context.settings.labels;
          this.chartExtraTooltip.pinTooltip();
          this.chartExtraNavigation.announceElement(getPointAccessibleDescription(current.point, labels), true);
        }
      },
    };
  }

  // A set of callbacks required for pointer navigation.
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
        this.pinTooltipOnPoint(point);
      },
      onGroupClick: (group) => {
        this.pinTooltipOnGroup(group);
      },
    };
  }

  // Area- or line series can be defined with just a single point, or include missing data (y=null) in such
  // a way, that certain points become isolated. As we prefer the markers to not be shown for area- and line
  // series by default, those points become invisible, unless hovered. To fix this, we use the function below,
  // that finds isolates points and overrides the marker.enabled configuration for those.
  // See: https://github.com/highcharts/highcharts/issues/1210.
  private showMarkersForIsolatedPoints() {
    let shouldRedraw = false;
    for (const s of this.context.chart().series) {
      for (let i = 0; i < s.data.length; i++) {
        const isEligibleSeries = !isXThreshold(s) && s.type !== "scatter" && !s.data[i].options.marker?.enabled;
        if (
          isEligibleSeries &&
          (s.data[i - 1]?.y === undefined || s.data[i - 1]?.y === null) &&
          (s.data[i + 1]?.y === undefined || s.data[i + 1]?.y === null)
        ) {
          s.data[i].update({ marker: { enabled: true } }, false);
          shouldRedraw = true;
        }
      }
    }
    if (shouldRedraw) {
      this.context.chart().redraw();
    }
  }

  // Highcharts sometimes destroys points upon re-rendering. As result, the already stored points can get
  // replaced by `{ destroyed: true }`. This can affect the tooltip state, making the component crash when
  // obtaining data from points, or making it hidden yet pinned, so not visible on hover until a click is made.
  // To prevent these issues, on each render we check for destroyed points in the tooltip state, and proactively
  // hide the tooltip if found. The behavior is only observed during the initial chart loading, and is not expected
  // to cause UX issues with the tooltip being closed unexpectedly.
  // See: https://github.com/highcharts/highcharts/issues/23175.
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
    const chart = this.context.chart();
    if ("colorCounter" in chart && typeof chart.colorCounter === "number") {
      chart.colorCounter = getChartSeries(chart.series).length;
    }
  }

  private pinTooltipOnPoint = (point: Highcharts.Point) => {
    const currentPoint = this.chartExtraTooltip.get().point;
    const currentGroup = this.chartExtraTooltip.get().group;
    const positionsMatch = isPointsPositionsEqual(currentPoint ?? currentGroup[0], point);

    // If the previously hovered and now clicked positions match, and the the tooltip wasn't
    // dismissed just a moment ago, we make the tooltip pinned in this position.
    if (positionsMatch && !this.chartExtraTooltip.tooltipLock) {
      this.highlightActions(point);
      this.chartExtraTooltip.pinTooltip();
    }
    // If the tooltip was just dismissed, it means this happened by clicking somewhere in the plot area.
    // If the clicked position differs from the one that was pinned - we show tooltip in the new position.
    else if (!positionsMatch && this.chartExtraTooltip.tooltipLock) {
      this.highlightActions(point, true);
    }
  };

  private pinTooltipOnGroup = (group: Highcharts.Point[]) => {
    const currentPoint = this.chartExtraTooltip.get().point;
    const currentGroup = this.chartExtraTooltip.get().group;
    const positionsMatch = isPointsPositionsEqual(currentPoint ?? currentGroup[0], group[0]);

    // If the previously hovered and now clicked positions match, and the the tooltip wasn't
    // dismissed just a moment ago, we make the tooltip pinned in this position.
    if (positionsMatch && !this.chartExtraTooltip.tooltipLock) {
      this.highlightActions(group);
      this.chartExtraTooltip.pinTooltip();
    }
    // If the tooltip was just dismissed, it means this happened by clicking somewhere in the plot area.
    // If the clicked position differs from the one that was pinned - we show tooltip in the new position.
    else if (!positionsMatch && this.chartExtraTooltip.tooltipLock) {
      this.highlightActions(group, true);
    }
  };

  private highlightActions(target: Highcharts.Point | Highcharts.Point[], overrideTooltipLock = false) {
    const point = Array.isArray(target) ? null : target;
    const group = Array.isArray(target) ? target : this.context.derived.getPointsByX(target.x);

    if (!this.isTooltipPinned) {
      // Update Highcharts elements state.
      if (point) {
        this.chartExtraHighlight.highlightChartPoint(point);
      } else {
        this.chartExtraHighlight.highlightChartGroup(group);
      }

      // Update tooltip and legend state.
      if (point) {
        this.chartExtraLegend.onHighlightPoint(point);
        this.chartExtraTooltip.showTooltipOnPoint(point, group, overrideTooltipLock);
      } else {
        this.chartExtraLegend.onHighlightGroup(group);
        this.chartExtraTooltip.showTooltipOnGroup(group, overrideTooltipLock);
      }

      // Notify the consumer that a highlight action was made.
      this.context.handlers.onHighlight?.({ point, group });
    }
  }

  private clearHighlightActions = () => {
    if (!this.isTooltipPinned) {
      // Update Highcharts elements state.
      this.chartExtraHighlight.clearChartItemsHighlight();

      // Update tooltip and legend state.
      this.chartExtraTooltip.hideTooltip();
      this.chartExtraLegend.onClearHighlight();

      // Notify the consumer that a clear-highlight action was made.
      this.context.handlers.onClearHighlight?.();
    }
  };

  private get isTooltipPinned() {
    return this.chartExtraTooltip.get().pinned;
  }
}

function isPointsPositionsEqual(current?: Highcharts.Point, next?: Highcharts.Point) {
  return current?.x === next?.x && current?.y === next?.y;
}

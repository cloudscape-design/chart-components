// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useId, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";

import { ReadonlyAsyncStore } from "../internal/utils/async-store";
import { DebouncedCall } from "../internal/utils/utils";
import { ChartStore } from "./chart-store";
import {
  CoreTooltipOptions,
  PointHighlightDetail,
  ReactiveChartState,
  Rect,
  RegisteredLegendAPI,
  TooltipContent,
} from "./interfaces-core";
import * as Styles from "./styles";
import {
  clearChartItemsHighlight,
  findAllSeriesWithData,
  findAllVisibleSeries,
  getChartLegendItems,
  getDefaultTooltipTarget,
  getVerticalAxesTitles,
  highlightChartItems,
  matchLegendItems,
  updateChartItemsVisibility,
} from "./utils";

const MOUSE_LEAVE_DELAY = 300;
const LAST_DISMISS_DELAY = 250;
const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

interface ChartAPIContext {
  tooltip: {
    enabled: boolean;
    placement: "target" | "bottom" | "middle";
    getTargetFromPoint?(point: Highcharts.Point): Rect;
    getTooltipContent?(props: { point: Highcharts.Point }): null | TooltipContent;
    onPointHighlight?(props: { point: Highcharts.Point; target: Rect }): null | PointHighlightDetail;
    onClearHighlight?(): void;
  };
}

export function useChartAPI({
  hiddenItems,
  tooltipOptions,
}: {
  hiddenItems?: readonly string[];
  tooltipOptions?: CoreTooltipOptions;
}) {
  const chartId = useId();
  const getContext = useStableCallback(
    (): ChartAPIContext => ({
      tooltip: {
        enabled: tooltipOptions?.enabled ?? true,
        placement: tooltipOptions?.placement ?? "target",
        getTargetFromPoint: tooltipOptions?.getTargetFromPoint,
        getTooltipContent: tooltipOptions?.getTooltipContent,
        onPointHighlight: tooltipOptions?.onPointHighlight,
        onClearHighlight: tooltipOptions?.onClearHighlight,
      },
    }),
  );
  const api = useRef(new ChartAPI(chartId, getContext)).current;

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const hiddenItemsIndex = hiddenItems ? hiddenItems.join("::") : null;
  useEffect(() => {
    if (api.ready && hiddenItemsIndex !== null) {
      api.updateChartItemsVisibility(hiddenItemsIndex.split("::").filter(Boolean));
    }
  }, [api, hiddenItemsIndex]);

  return api;
}

export class ChartAPI {
  private chartId: string;
  private getContext: () => ChartAPIContext;
  private _store = new ChartStore();
  private _chart: null | Highcharts.Chart = null;
  private lastDismissTime = 0;
  private mouseLeaveCall = new DebouncedCall();
  private tooltipHovered = false;
  private targetElement: null | Highcharts.SVGElement = null;
  private registeredLegend: null | RegisteredLegendAPI = null;

  constructor(chartId: string, getContext: () => ChartAPIContext) {
    this.chartId = chartId;
    this.getContext = getContext;
  }

  private get context() {
    return this.getContext();
  }

  private get chart() {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }

  private get noDataId() {
    return `${this.chartId}-nodata`;
  }

  public get ready() {
    return !!this._chart;
  }

  public get store() {
    return this._store as ReadonlyAsyncStore<ReactiveChartState>;
  }

  public getTooltipTrack: () => null | SVGElement = () => null;

  public get options() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const chartAPI = this;
    const onChartRender: Highcharts.ChartRenderCallbackFunction = function (this) {
      chartAPI._chart = this;
      chartAPI.onChartRender();
    };
    const onChartClick: Highcharts.ChartClickCallbackFunction = function () {
      if (chartAPI.context.tooltip.enabled) {
        const { hoverPoint } = this;
        if (hoverPoint) {
          chartAPI.onChartClick(hoverPoint);
        } else {
          chartAPI.onChartClick(null);
        }
      }
    };
    const onSeriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function () {
      if (chartAPI.context.tooltip.enabled) {
        chartAPI.showTooltipOnPoint(this);
      }
    };
    const onSeriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
      if (chartAPI.context.tooltip.enabled) {
        chartAPI.hideTooltip();
      }
    };
    const onSeriesPointClick: Highcharts.PointClickCallbackFunction = function () {
      if (chartAPI.context.tooltip.enabled) {
        chartAPI.onChartClick(this);
      }
    };
    const noData: Highcharts.NoDataOptions = { position: Styles.noDataPosition, useHTML: true };
    const langNoData = renderToStaticMarkup(<div style={Styles.noDataCss} id={this.noDataId}></div>);
    return {
      onChartRender,
      onChartClick,
      onSeriesPointMouseOver,
      onSeriesPointMouseOut,
      onSeriesPointClick,
      noData,
      langNoData,
    };
  }

  public registerLegend(legend: RegisteredLegendAPI) {
    this.registeredLegend = legend;
  }

  public unregisterLegend() {
    this.registeredLegend = null;
  }

  public highlightChartItems(itemIds: readonly string[]) {
    highlightChartItems(this.chart, itemIds);
  }

  public clearChartItemsHighlight() {
    clearChartItemsHighlight(this.chart);
  }

  public updateChartItemsVisibility(hiddenItems?: readonly string[]) {
    updateChartItemsVisibility(this.chart, hiddenItems);
  }

  public onMouseEnterTooltip = () => {
    this.tooltipHovered = true;
  };

  public onMouseLeaveTooltip = () => {
    if (!this.store.get().tooltip.pinned) {
      this.mouseLeaveCall.cancelPrevious();
      this.mouseLeaveCall.call(() => {
        this.clearHighlightActions();
        this._store.setTooltip({ visible: false, pinned: false });
      }, MOUSE_LEAVE_DELAY);
    }
    this.tooltipHovered = false;
  };

  public onDismissTooltip = (outsideClick?: boolean) => {
    if (this.store.get().tooltip.pinned) {
      this.lastDismissTime = new Date().getTime();
      this._store.setTooltip({ visible: false, pinned: false });
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        // This brings the focus back to the chart.
        // If the last focused target is no longer around - the focus goes back to the first data point.
        this.chart.series?.[0]?.data?.[0].graphic?.element.focus();
      }
    }
  };

  // When hovering (or focusing) over the target (point, bar, segment, etc.) we show the tooltip in the target coordinate.
  public showTooltipOnPoint = (point: Highcharts.Point) => {
    this.updateSetters();

    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.store.get().tooltip.pinned) {
      return false;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.highlightActions(point);
    this._store.setTooltip({ visible: true, pinned: false, point });
  };

  public hideTooltip = () => {
    // The behavior is ignored if user hovers over the tooltip.
    if (this.tooltipHovered) {
      return;
    }
    if (!this.store.get().tooltip.pinned) {
      this.mouseLeaveCall.cancelPrevious();
      this.mouseLeaveCall.call(() => {
        if (this.tooltipHovered) {
          return;
        }
        this.clearHighlightActions();
        this._store.setTooltip({ visible: false, pinned: false });
      }, MOUSE_LEAVE_DELAY);
    }
  };

  private onChartRender() {
    this.initLegend();
    this.initVerticalAxisTitles();
    this.initNoData();
  }

  private initLegend() {
    this._store.setLegendItems(getChartLegendItems(this.chart));
  }

  private initVerticalAxisTitles() {
    this._store.setVerticalAxesTitles(getVerticalAxesTitles(this.chart));
  }

  private initNoData() {
    const allSeriesWithData = findAllSeriesWithData(this.chart);
    const visibleSeries = findAllVisibleSeries(this.chart);
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this._store.setNoData({ container: null, noMatch: false });
    }
    // Otherwise, we rely on the Highcharts to render the no-data node, for which the no-data module must be available.
    // We use timeout to make sure the no-data container is rendered.
    else {
      setTimeout(() => {
        const noDataContainer = this.chart.container?.querySelector(`[id="${this.noDataId}"]`) as null | HTMLElement;
        if (noDataContainer) {
          noDataContainer.style.width = `${this.chart.plotWidth}px`;
          noDataContainer.style.height = `${this.chart.plotHeight}px`;
        }
        this._store.setNoData({ container: noDataContainer, noMatch: allSeriesWithData.length > 0 });
      }, 0);
    }
  }

  // When the plot is clicked we pin the popover in its current position.
  private onChartClick = (point: null | Highcharts.Point) => {
    // The behavior is ignored if the popover is already pinned.
    if (this.store.get().tooltip.pinned) {
      return;
    }
    // If the click point is different from the current position - the tooltip is moved to the new position.
    const prevPoint = this.store.get().tooltip.point;
    if (point && point.x !== prevPoint?.x && point.y !== prevPoint?.y) {
      this.highlightActions(point);
      this._store.setTooltip({ visible: true, pinned: false, point: point ?? prevPoint });
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      this._store.setTooltip({ visible: true, pinned: true, point: point ?? prevPoint });
    }
  };

  // We replace `setState` method on Highcharts series and points with a custom implementation,
  // that does not cause the state to update when the tooltip is pinned. That is to avoid hover effect:
  // only the matched series/points of the pinned tooltip must be in active state.ƒ
  private updateSetters() {
    for (const s of this.chart.series) {
      // We ensure the replacement is done only once by assigning a custom property to the function.
      // If the property is present - it means the method was already replaced.
      if (!(s.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
        const original = s.setState;
        s.setState = (...args) => {
          if (this.store.get().tooltip.pinned) {
            return;
          }
          return original.call(s, ...args);
        };
        (s.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
      }
      for (const d of s.data) {
        if (!(d.setState as any)[SET_STATE_OVERRIDE_MARKER]) {
          const original = d.setState;
          d.setState = (...args) => {
            if (this.store.get().tooltip.pinned) {
              return;
            }
            return original.call(d, ...args);
          };
          (d.setState as any)[SET_STATE_OVERRIDE_MARKER] = true;
        }
      }
    }
  }

  private highlightActions = (point: Highcharts.Point) => {
    const target = this.getTarget(point);
    const detail = this.context.tooltip.onPointHighlight?.({ point, target });
    this.destroyMarkers();
    this.createMarkers(target);

    const matchedLegendItems = detail?.matchedLegendItems ?? matchLegendItems(this.store.get().legend.items, point);
    this.registeredLegend?.highlightItems(matchedLegendItems);
  };

  private getTarget = (point: Highcharts.Point) => {
    const { getTargetFromPoint, placement } = this.context.tooltip;
    return getTargetFromPoint?.(point) ?? getDefaultTooltipTarget(point, placement);
  };

  private createMarkers = (target: Rect) => {
    this.targetElement = this.chart.renderer
      .rect(target.x, target.y, target.width, target.height)
      .attr({ fill: "transparent" })
      .add();

    // The targetElement.element can get invalidated by Highcharts, so we cannot use
    // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
    // The getTrack function ensures the latest element reference is given on each request.
    this.getTooltipTrack = () => (this.targetElement?.element ?? null) as null | SVGElement;
  };

  private clearHighlightActions = () => {
    this.context.tooltip.onClearHighlight?.();
    this.destroyMarkers();
    this.registeredLegend?.clearHighlight();
  };

  private destroyMarkers = () => {
    this.targetElement?.destroy();
  };
}

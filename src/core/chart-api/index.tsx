// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useId, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { getIsRtl } from "@cloudscape-design/component-toolkit/internal";

import { ReadonlyAsyncStore } from "../../internal/utils/async-store";
import { DebouncedCall } from "../../internal/utils/utils";
import { ChartLegendItem } from "../interfaces-base";
import {
  ChartLegendItemSpec,
  ReactiveChartState,
  Rect,
  RegisteredLegendAPI,
  TooltipVisibleProps,
  TooltipVisibleResult,
} from "../interfaces-core";
import * as Styles from "../styles";
import {
  clearChartItemsHighlight,
  findAllSeriesWithData,
  findAllVisibleSeries,
  findMatchingNavigationGroup,
  getChartGroupRects,
  getChartLegendItems,
  getGroupAccessibleDescription,
  getGroupRect,
  getPointAccessibleDescription,
  getPointRect,
  getVerticalAxesTitles,
  highlightChartItems,
  matchLegendItems,
  updateChartItemsVisibility,
} from "../utils";
import { ChartStore } from "./chart-store";
import { NavigationController, NavigationControllerHandlers } from "./navigation-controller";

const MOUSE_LEAVE_DELAY = 300;
const LAST_DISMISS_DELAY = 250;
const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

interface ChartAPIContext {
  visibleItems?: readonly string[];
  getChartLegendItems?(props: { chart: Highcharts.Chart }): readonly ChartLegendItemSpec[];
  getMatchedLegendItems?(props: { point: Highcharts.Point }): readonly string[];
  onLegendItemsChange?: (legendItems: readonly ChartLegendItem[]) => void;
  isTooltipEnabled: boolean;
  onTooltipVisible?(props: TooltipVisibleProps): void | TooltipVisibleResult;
  onClearHighlight?(): void;
  keyboardNavigation: boolean;
}

export function useChartAPI(context: ChartAPIContext) {
  const chartId = useId();
  const contextRef = useRef<ChartAPIContext>();
  contextRef.current = context;
  const api = useRef(new ChartAPI(chartId, () => contextRef.current!)).current;

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const visibleItemsIndex = context?.visibleItems ? context.visibleItems.join("::") : null;
  useEffect(() => {
    if (api.ready && visibleItemsIndex !== null) {
      api.updateChartItemsVisibility(visibleItemsIndex.split("::").filter(Boolean));
    }
  }, [api, visibleItemsIndex]);

  // Run cleanup code when the component unmounts.
  useEffect(() => () => api.cleanup(), [api]);

  return api;
}

export class ChartAPI {
  private readonly chartId: string;
  private getContext: () => ChartAPIContext;
  private _store = new ChartStore();
  private chart: null | Highcharts.Chart = null;
  private navigation = new NavigationController(this.navigationHandlers);
  private lastDismissTime = 0;
  private mouseLeaveCall = new DebouncedCall();
  private tooltipHovered = false;
  private targetTrack: null | Highcharts.SVGElement = null;
  private groupTrack: null | Highcharts.SVGElement = null;
  private registeredLegend: null | RegisteredLegendAPI = null;
  private groupRects: { group: Highcharts.Point[]; rect: Rect }[] = [];
  private matchedGroup: Highcharts.Point[] = [];

  constructor(chartId: string, getContext: () => ChartAPIContext) {
    this.chartId = chartId;
    this.getContext = getContext;
  }

  private get safe() {
    if (!this.chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return { chart: this.chart };
  }

  private get context() {
    return this.getContext();
  }

  private get noDataId() {
    return `${this.chartId}-nodata`;
  }

  public get ready() {
    return !!this.chart;
  }

  public get store() {
    return this._store as ReadonlyAsyncStore<ReactiveChartState>;
  }

  // The targetElement.element can get invalidated by Highcharts, so we cannot use
  // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
  // The getTrack function ensures the latest element reference is given on each request.
  public getTargetTrack = () => (this.targetTrack?.element ?? null) as null | SVGElement;
  public getGroupTrack = () => (this.groupTrack?.element ?? null) as null | SVGElement;

  public setApplication = (element: null | HTMLElement) => {
    this.navigation?.setApplication(element);
  };

  public get options() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const chartAPI = this;
    const onChartLoad: Highcharts.ChartLoadCallbackFunction = function (this) {
      this.container.addEventListener("mousemove", chartAPI.onChartMousemove);
      this.container.addEventListener("mouseout", chartAPI.onChartMouseout);
    };
    const onChartRender: Highcharts.ChartRenderCallbackFunction = function (this) {
      chartAPI.chart = this;
      chartAPI.navigation.init(this);
      chartAPI.onChartRender();
    };
    const onChartClick: Highcharts.ChartClickCallbackFunction = function () {
      if (chartAPI.context.isTooltipEnabled) {
        const { hoverPoint } = this;
        if (hoverPoint) {
          chartAPI.onChartClick(hoverPoint);
        } else {
          chartAPI.onChartClick(null);
        }
      }
    };
    const onSeriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function () {
      if (chartAPI.context.isTooltipEnabled) {
        chartAPI.highlightChartPoint(this);
      }
    };
    const onSeriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
      if (chartAPI.context.isTooltipEnabled) {
        chartAPI.clearChartHighlight();
      }
    };
    const onSeriesPointClick: Highcharts.PointClickCallbackFunction = function () {
      if (chartAPI.context.isTooltipEnabled) {
        chartAPI.onChartClick(this);
      }
    };
    const noData: Highcharts.NoDataOptions = { position: Styles.noDataPosition, useHTML: true };
    const langNoData = renderToStaticMarkup(<div style={Styles.noDataCss} id={this.noDataId}></div>);
    return {
      onChartLoad,
      onChartRender,
      onChartClick,
      onSeriesPointMouseOver,
      onSeriesPointMouseOut,
      onSeriesPointClick,
      noData,
      langNoData,
    };
  }

  public cleanup = () => {
    this.chart?.container?.removeEventListener("mousemove", this.onChartMousemove);
    this.chart?.container?.removeEventListener("mouseout", this.onChartMouseout);
  };

  private get navigationHandlers(): NavigationControllerHandlers {
    const clearHighlightState = () => {
      for (const s of this.safe.chart.series) {
        s.setState("normal");
        for (const d of s.data) {
          d.setState("normal");
        }
      }
    };
    const setHighlightState = (group: Highcharts.Point[]) => {
      for (const s of this.safe.chart.series) {
        s.setState("normal");
        for (const d of s.data) {
          d.setState(group.includes(d) ? "normal" : "inactive");
        }
      }
    };
    const clearHighlight = () => {
      this.clearChartHighlight();
      clearHighlightState();
    };
    return {
      onFocusChart: () => {
        clearHighlight();
        // TODO: i18n
        this._store.setLiveAnnouncement("chart plot");
      },
      onFocusPoint: (point: Highcharts.Point, group: Highcharts.Point[]) => {
        setHighlightState(group);
        this.highlightChartPoint(point);
        this._store.setLiveAnnouncement(getPointAccessibleDescription(point));
      },
      onFocusGroup: (group: Highcharts.Point[]) => {
        setHighlightState(group);
        this.highlightChartGroup(group);
        this._store.setLiveAnnouncement(getGroupAccessibleDescription(group));
      },
      onBlur: () => clearHighlight(),
      onActivatePoint: () => this._store.pinTooltip(),
      onActivateGroup: () => this._store.pinTooltip(),
    };
  }

  public registerLegend = (legend: RegisteredLegendAPI) => {
    this.registeredLegend = legend;
  };

  public unregisterLegend = () => {
    this.registeredLegend = null;
  };

  public highlightChartItems = (itemIds: readonly string[]) => {
    highlightChartItems(this.safe.chart, itemIds);
  };

  public clearChartItemsHighlight = () => {
    clearChartItemsHighlight(this.safe.chart);
  };

  public updateChartItemsVisibility = (visibleItems?: readonly string[]) => {
    if (visibleItems) {
      const legendItems = this.store.get().legend.items;
      updateChartItemsVisibility(this.safe.chart, legendItems, visibleItems);
    }
  };

  public onMouseEnterTooltip = () => {
    this.tooltipHovered = true;
  };

  public onMouseLeaveTooltip = () => {
    if (!this.store.get().tooltip.pinned) {
      this.mouseLeaveCall.call(() => {
        this.clearHighlightActions();
        this._store.hideTooltip();
      }, MOUSE_LEAVE_DELAY);
    }
    this.tooltipHovered = false;
  };

  public onDismissTooltip = (outsideClick?: boolean) => {
    if (this.store.get().tooltip.pinned) {
      this.lastDismissTime = new Date().getTime();
      this._store.hideTooltip();
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        if (!this.context.keyboardNavigation) {
          // This brings the focus back to the chart.
          // If the last focused target is no longer around - the focus goes back to the first data point.
          this.safe.chart.series?.[0]?.data?.[0].graphic?.element.focus();
        } else {
          this.navigation.focusApplication();
        }
      }
    }
  };

  private onChartMousemove = (event: MouseEvent) => {
    if (!this.ready) {
      return;
    }

    const normalized = this.safe.chart.pointer.normalize(event);
    const plotX = normalized.chartX;
    const plotY = normalized.chartY;
    const { plotLeft, plotTop, plotWidth, plotHeight } = this.safe.chart;

    if (plotX >= plotLeft && plotX <= plotLeft + plotWidth && plotY >= plotTop && plotY <= plotTop + plotHeight) {
      const tooltip = this.store.get().tooltip;
      if (tooltip.point && tooltip.visible) {
        return;
      }

      this.matchedGroup = [];
      for (const { group, rect } of this.groupRects) {
        if (rect.x <= plotX && plotX < rect.x + rect.width) {
          this.matchedGroup = group;
          break;
        }
      }

      const current = this.store.get().tooltip;
      if (this.matchedGroup.length > 0 && (!current.visible || current.point === null)) {
        this.highlightChartGroup(this.matchedGroup);
      }
    }
  };

  private onChartMouseout = (event: MouseEvent) => {
    if (this.context.isTooltipEnabled) {
      const normalized = this.safe.chart.pointer.normalize(event);
      const plotX = normalized.chartX;
      const plotY = normalized.chartY;
      const { plotLeft, plotTop, plotWidth, plotHeight } = this.safe.chart;

      if (
        plotX < plotLeft + 5 ||
        plotX > plotLeft + plotWidth - 5 ||
        plotY < plotTop + 5 ||
        plotY > plotTop + plotHeight - 5
      ) {
        this.clearChartHighlight();
      }
    }
  };

  public highlightChartGroup = (group: Highcharts.Point[]) => {
    this.updateSetters();

    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.store.get().tooltip.pinned) {
      return false;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.highlightActionsGroup(group);
    this._store.setTooltipGroup(group);
  };

  // When hovering (or focusing) over the target (point, bar, segment, etc.) we show the tooltip in the target coordinate.
  public highlightChartPoint = (point: Highcharts.Point) => {
    this.updateSetters();

    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.store.get().tooltip.pinned) {
      return false;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.highlightActionsPoint(point);
    this._store.setTooltipPoint(point, findMatchingNavigationGroup(point));
  };

  public clearChartHighlight = () => {
    // The behavior is ignored if user hovers over the tooltip.
    if (this.tooltipHovered) {
      return;
    }
    if (!this.store.get().tooltip.pinned) {
      this.mouseLeaveCall.call(() => {
        if (this.tooltipHovered) {
          return;
        }
        this.clearHighlightActions();
        this._store.hideTooltip();
      }, MOUSE_LEAVE_DELAY);
    }
  };

  public onItemVisibilityChange = (visibleItems: readonly string[]) => {
    const legendItems = this.store.get().legend.items;
    const updatedLegendItems = legendItems.map((item) => ({ ...item, visible: visibleItems.includes(item.id) }));
    this.context.onLegendItemsChange?.(updatedLegendItems);
  };

  private onChartRender = () => {
    this.initLegend();
    this.initVerticalAxisTitles();
    this.initNoData();
    this.updateChartItemsVisibility(this.context.visibleItems);
    this.initChartLabel();
    this.initGroupRects();
  };

  private initChartLabel = () => {
    const defaultLabel = this.chart?.container.querySelector("svg")?.getAttribute("aria-label");
    const explicitLabel = this.chart?.options.lang?.accessibility?.chartContainerLabel;
    this._store.setChartLabel(explicitLabel ?? defaultLabel ?? "");
  };

  private initGroupRects() {
    this.groupRects = getChartGroupRects(this.safe.chart);
  }

  private initLegend = () => {
    const customLegendItems = this.context.getChartLegendItems?.({ chart: this.safe.chart });
    const legendItems = getChartLegendItems(this.safe.chart, customLegendItems);
    this._store.setLegendItems(legendItems);
  };

  private initVerticalAxisTitles = () => {
    this._store.setVerticalAxesTitles(getVerticalAxesTitles(this.safe.chart));
  };

  private initNoData = () => {
    const allSeriesWithData = findAllSeriesWithData(this.safe.chart);
    const visibleSeries = findAllVisibleSeries(this.safe.chart);
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this._store.setNoData({ container: null, noMatch: false });
    }
    // Otherwise, we rely on the Highcharts to render the no-data node, for which the no-data module must be available.
    // We use timeout to make sure the no-data container is rendered.
    else {
      setTimeout(() => {
        const noDataContainer = this.safe.chart.container?.querySelector(
          `[id="${this.noDataId}"]`,
        ) as null | HTMLElement;
        if (noDataContainer) {
          noDataContainer.style.width = `${this.safe.chart.plotWidth}px`;
          noDataContainer.style.height = `${this.safe.chart.plotHeight}px`;
        }
        this._store.setNoData({ container: noDataContainer, noMatch: allSeriesWithData.length > 0 });
      }, 0);
    }
  };

  // When the plot is clicked we pin the popover in its current position.
  private onChartClick = (point: null | Highcharts.Point) => {
    const current = this.store.get().tooltip;

    // The behavior is ignored if the popover is already pinned.
    if (current.pinned) {
      return;
    }

    const currentPosX = current.point?.x ?? current.group[0]?.x;
    const currentPosY = current.point?.y ?? current.group[0]?.y;
    const nextPosX = point ? point.x : this.matchedGroup[0]?.x;
    const nextPosY = point ? point.y : this.matchedGroup[0]?.y;

    // If the click point is different from the current position - the tooltip is moved to the new position.
    if (nextPosX !== currentPosX || nextPosY !== currentPosY) {
      if (point) {
        this.highlightActionsPoint(point);
        this._store.setTooltipPoint(point, findMatchingNavigationGroup(point));
      } else {
        this.highlightActionsGroup(this.matchedGroup);
        this._store.setTooltipGroup(this.matchedGroup);
      }
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      if (point) {
        this._store.setTooltipPoint(point, findMatchingNavigationGroup(point));
      } else {
        this._store.setTooltipGroup(this.matchedGroup);
      }
      this._store.pinTooltip();
    }
  };

  // We replace `setState` method on Highcharts series and points with a custom implementation,
  // that does not cause the state to update when the tooltip is pinned. That is to avoid hover effect:
  // only the matched series/points of the pinned tooltip must be in active state.ƒ
  private updateSetters = () => {
    for (const s of this.safe.chart.series) {
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
  };

  private highlightActionsPoint = (point: Highcharts.Point) => {
    const group = findMatchingNavigationGroup(point);
    const pointRect = getPointRect(point);
    const groupRect = getGroupRect(group);
    const override = this.context.onTooltipVisible?.({ point, group, pointRect, groupRect });
    const customMatchedLegendItems = this.context.getMatchedLegendItems?.({ point });
    const matchedLegendItems = customMatchedLegendItems ?? matchLegendItems(this.store.get().legend.items, point);
    this.registeredLegend?.highlightItems(matchedLegendItems);
    this.destroyTracks();
    this.createTracks({
      pointRect: override?.pointRect ?? pointRect,
      groupRect: override?.groupRect ?? groupRect,
    });
  };

  private highlightActionsGroup = (group: Highcharts.Point[]) => {
    if (group.length === 0) {
      return;
    }
    const pointRect = getPointRect(group[0]);
    const groupRect = getGroupRect(group);
    const override = this.context.onTooltipVisible?.({ point: null, group, pointRect, groupRect });
    const matchedLegendItems = new Set<string>();
    for (const point of group) {
      const matched = matchLegendItems(this.store.get().legend.items, point);
      matched.forEach((m) => matchedLegendItems.add(m));
    }
    this.registeredLegend?.highlightItems([...matchedLegendItems]);
    this.destroyTracks();
    this.createTracks({
      pointRect: override?.pointRect ?? pointRect,
      groupRect: override?.groupRect ?? groupRect,
    });
  };

  private createTracks = ({ pointRect, groupRect }: { pointRect: Rect; groupRect: Rect }) => {
    // We set the direction to target element so that the direction check done by the tooltip
    // is done correctly. Without that, the asserted target direction always results to "ltr".
    const isRtl = getIsRtl(this.safe.chart.container.parentElement);
    this.targetTrack = this.safe.chart.renderer
      .rect(pointRect.x, pointRect.y, pointRect.width, pointRect.height)
      .attr({ fill: "transparent", zIndex: -1, direction: isRtl ? "rtl" : "ltr" })
      .add();
    this.groupTrack = this.safe.chart.renderer
      .rect(groupRect.x, groupRect.y, groupRect.width, groupRect.height)
      .attr({ fill: "transparent", zIndex: -1, direction: isRtl ? "rtl" : "ltr" })
      .add();
  };

  private clearHighlightActions = () => {
    this.context.onClearHighlight?.();
    this.destroyTracks();
    this.registeredLegend?.clearHighlight();
  };

  private destroyTracks = () => {
    this.targetTrack?.destroy();
    this.groupTrack?.destroy();
  };
}

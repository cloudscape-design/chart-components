// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useId, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { ReadonlyAsyncStore } from "../../internal/utils/async-store";
import { DebouncedCall } from "../../internal/utils/utils";
import { ChartLegendItem } from "../interfaces-base";
import { ChartLegendItemSpec, ReactiveChartState, RegisteredLegendAPI, RenderTooltipProps } from "../interfaces-core";
import * as Styles from "../styles";
import {
  findAllSeriesWithData,
  findAllVisibleSeries,
  getChartAccessibleDescription,
  getChartLegendItems,
  getGroupAccessibleDescription,
  getPointAccessibleDescription,
  getVerticalAxesTitles,
  matchLegendItems,
  updateChartItemsVisibility,
} from "../utils";
import { ChartExtra } from "./chart-extra";
import { ChartStore } from "./chart-store";
import { NavigationController, NavigationControllerHandlers } from "./navigation-controller";
import { throttle } from "./throttle";

const MOUSE_LEAVE_DELAY = 200;
const LAST_DISMISS_DELAY = 250;

interface ChartAPIContext {
  visibleItems?: readonly string[];
  getChartLegendItems?(props: { chart: Highcharts.Chart }): readonly ChartLegendItemSpec[];
  getMatchedLegendItems?(props: { point: Highcharts.Point }): readonly string[];
  onLegendItemsChange?: (legendItems: readonly ChartLegendItem[]) => void;
  isTooltipEnabled: boolean;
  onRenderTooltip?(props: RenderTooltipProps): void;
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
  private chartExtra = new ChartExtra();
  private navigation = new NavigationController(this.chartExtra, this.navigationHandlers);
  private lastDismissTime = 0;
  private mouseLeaveCall = new DebouncedCall();
  private tooltipHovered = false;
  private registeredLegend: null | RegisteredLegendAPI = null;
  private matchedGroup: Highcharts.Point[] = [];
  private mouseOverPoint = false;

  constructor(chartId: string, getContext: () => ChartAPIContext) {
    this.chartId = chartId;
    this.getContext = getContext;
  }

  private get chart() {
    return this.chartExtra.chart;
  }

  private get context() {
    return this.getContext();
  }

  private get noDataId() {
    return `${this.chartId}-nodata`;
  }

  public get ready() {
    return !!this.chartExtra.chartOrNull;
  }

  public get store() {
    return this._store as ReadonlyAsyncStore<ReactiveChartState>;
  }

  public getTargetTrack = this.chartExtra.getTargetTrack.bind(this.chartExtra);
  public getGroupTrack = this.chartExtra.getGroupTrack.bind(this.chartExtra);

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
      chartAPI.chartExtra.onChartRender(this);
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
      chartAPI.mouseOverPoint = true;
      if (chartAPI.context.isTooltipEnabled) {
        chartAPI.highlightChartPoint(this);
      }
    };
    const onSeriesPointMouseOverThrottled = throttle(onSeriesPointMouseOver, 25);
    const onSeriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
      chartAPI.mouseOverPoint = false;
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
      onSeriesPointMouseOver: onSeriesPointMouseOverThrottled,
      onSeriesPointMouseOut,
      onSeriesPointClick,
      noData,
      langNoData,
    };
  }

  public cleanup = () => {
    this.chartExtra.chartOrNull?.container?.removeEventListener("mousemove", this.onChartMousemove);
    this.chartExtra.chartOrNull?.container?.removeEventListener("mouseout", this.onChartMouseout);
  };

  private get navigationHandlers(): NavigationControllerHandlers {
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
        const current = this.store.get().tooltip;
        if (current.group.length > 0) {
          this._store.pinTooltip();
          this.announceApplicationGroup(current.group, true);
        }
      },
      onActivatePoint: () => {
        const current = this.store.get().tooltip;
        if (current.point) {
          this._store.pinTooltip();
          this.announceApplicationPoint(current.point, true);
        }
      },
    };
  }

  private announceApplicationChart() {
    this.navigation.announceChart(getChartAccessibleDescription());
  }

  private announceApplicationGroup(group: Highcharts.Point[], pinned: boolean) {
    this.navigation.announceElement(getGroupAccessibleDescription(group), pinned);
  }

  private announceApplicationPoint(point: Highcharts.Point, pinned: boolean) {
    this.navigation.announceElement(getPointAccessibleDescription(point), pinned);
  }

  public registerLegend = (legend: RegisteredLegendAPI) => {
    this.registeredLegend = legend;
  };

  public unregisterLegend = () => {
    this.registeredLegend = null;
  };

  public highlightChartItems = (itemIds: readonly string[]) => {
    this.chartExtra.highlightChartItems(itemIds);
  };

  public clearChartItemsHighlight = () => {
    this.chartExtra.clearChartItemsHighlight();
  };

  public updateChartItemsVisibility = (visibleItems?: readonly string[]) => {
    if (visibleItems) {
      const legendItems = this.store.get().legend.items;
      updateChartItemsVisibility(this.chart, legendItems, visibleItems);
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
    const { pinned, point, group } = this.store.get().tooltip;
    if (pinned) {
      this.lastDismissTime = new Date().getTime();
      this._store.hideTooltip();
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        if (!this.context.keyboardNavigation) {
          // This brings the focus back to the chart.
          // If the last focused target is no longer around - the focus goes back to the first data point.
          this.chart.series?.[0]?.data?.[0].graphic?.element.focus();
        } else {
          this.navigation.focusApplication(point, group);
        }
      }
    }
  };

  private onChartMousemove = throttle((event: MouseEvent) => {
    if (!this.ready || this.mouseOverPoint) {
      return;
    }

    const normalized = this.chart.pointer.normalize(event);
    const plotX = normalized.chartX;
    const plotY = normalized.chartY;
    const { plotLeft, plotTop, plotWidth, plotHeight } = this.chart;

    if (plotX >= plotLeft && plotX <= plotLeft + plotWidth && plotY >= plotTop && plotY <= plotTop + plotHeight) {
      this.matchedGroup = [];
      let minDistance = Number.POSITIVE_INFINITY;
      for (const { group, rect } of this.chartExtra.groupRects) {
        const [target, start, end] = this.chart.inverted
          ? [plotY, rect.y, rect.y + rect.height]
          : [plotX, rect.x, rect.x + rect.width];
        const minTargetDistance = Math.min(Math.abs(start - target), Math.abs(end - target));

        if (start <= target && target < end) {
          this.matchedGroup = group;
          break;
        } else if (minTargetDistance < minDistance) {
          minDistance = minTargetDistance;
          this.matchedGroup = group;
        }
      }

      if (this.matchedGroup.length > 0) {
        this.highlightChartGroup(this.matchedGroup);
      }
    }
  }, 25);

  private onChartMouseout = (event: MouseEvent) => {
    if (this.context.isTooltipEnabled) {
      const normalized = this.chart.pointer.normalize(event);
      const plotX = normalized.chartX;
      const plotY = normalized.chartY;
      const { plotLeft, plotTop, plotWidth, plotHeight } = this.chart;

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
    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.store.get().tooltip.pinned) {
      return false;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.highlightActionsPoint(point);
    this._store.setTooltipPoint(point, this.chartExtra.findMatchingGroup(point));
  };

  public clearChartHighlight = () => {
    if (!this.tooltipHovered && !this.store.get().tooltip.pinned) {
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
    this.handleDestroyedPoints();
    this.resetColorCounter();
    this.showMarkersForIsolatedPoints();
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
    const tooltipState = this.store.get().tooltip;
    if (tooltipState.group.some((p) => !p.series)) {
      this._store.hideTooltip();
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

  private initChartLabel = () => {
    const defaultLabel = this.chart?.container.querySelector("svg")?.getAttribute("aria-label");
    const explicitLabel = this.chart?.options.lang?.accessibility?.chartContainerLabel;
    this._store.setChartLabel(explicitLabel ?? defaultLabel ?? "");
  };

  private initLegend = () => {
    const customLegendItems = this.context.getChartLegendItems?.({ chart: this.chart });
    const legendItems = getChartLegendItems(this.chart, customLegendItems);
    this._store.setLegendItems(legendItems);
  };

  private initVerticalAxisTitles = () => {
    this._store.setVerticalAxesTitles(getVerticalAxesTitles(this.chart));
  };

  private initNoData = () => {
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
    if ((nextPosX !== undefined && nextPosX !== currentPosX) || (nextPosY !== undefined && nextPosY !== currentPosY)) {
      if (point) {
        this.highlightActionsPoint(point);
        this._store.setTooltipPoint(point, this.chartExtra.findMatchingGroup(point));
      } else {
        this.highlightActionsGroup(this.matchedGroup);
        this._store.setTooltipGroup(this.matchedGroup);
      }
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      if (point) {
        this._store.setTooltipPoint(point, this.chartExtra.findMatchingGroup(point));
      } else {
        this._store.setTooltipGroup(current.group);
      }
      if (current.group.length > 0) {
        this._store.pinTooltip();
      }
    }
  };

  private highlightActionsPoint = (point: Highcharts.Point) => {
    const group = this.chartExtra.findMatchingGroup(point);
    this.setHighlightState(group);
    this.chartExtra.onRenderTooltip({ point, group });
    this.context.onRenderTooltip?.({ point, group });
    const customMatchedLegendItems = this.context.getMatchedLegendItems?.({ point });
    const matchedLegendItems = customMatchedLegendItems ?? matchLegendItems(this.store.get().legend.items, point);
    this.registeredLegend?.highlightItems(matchedLegendItems);
  };

  private highlightActionsGroup = (group: Highcharts.Point[]) => {
    if (group.length === 0) {
      return;
    }
    this.setHighlightState(group);
    this.chartExtra.onRenderTooltip({ point: null, group });
    this.context.onRenderTooltip?.({ point: null, group });
    const matchedLegendItems = new Set<string>();
    for (const point of group) {
      const matched = matchLegendItems(this.store.get().legend.items, point);
      matched.forEach((m) => matchedLegendItems.add(m));
    }
    this.registeredLegend?.highlightItems([...matchedLegendItems]);
  };

  private setHighlightState(points: Highcharts.Point[]) {
    const includedPoints = new Set<Highcharts.Point>();
    const includedSeries = new Set<Highcharts.Series>();
    points.forEach((point) => {
      includedPoints.add(point);
      includedSeries.add(point.series);
    });
    if (!this.store.get().tooltip.pinned) {
      for (const s of this.chart.series) {
        this.chartExtra.setSeriesState(s, includedSeries.has(s) ? "normal" : "inactive");
        if (s.type === "column" || s.type === "pie") {
          for (const d of s.data) {
            this.chartExtra.setPointState(d, includedPoints.has(d) ? "normal" : "inactive");
          }
        }
      }
    }
  }

  private clearHighlightActions = () => {
    this.chartExtra.onClearHighlight();
    this.context.onClearHighlight?.();
    this.registeredLegend?.clearHighlight();

    if (!this.store.get().tooltip.pinned) {
      for (const s of this.chart.series ?? []) {
        this.chartExtra.setSeriesState(s, "normal");
        for (const d of s.data) {
          this.chartExtra.setPointState(d, "normal");
        }
      }
    }
  };
}

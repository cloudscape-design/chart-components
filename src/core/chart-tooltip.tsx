// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import type Highcharts from "highcharts";

import AsyncStore from "../internal/utils/async-store";
import { DebouncedCall } from "../internal/utils/utils";
import { CoreTooltipOptions, InternalCoreChartLegendAPI, InternalCoreChartTooltipAPI, Rect } from "./interfaces-core";
import { useStableCallbackNullable } from "./utils";

const MOUSE_LEAVE_DELAY = 300;
const LAST_DISMISS_DELAY = 250;
const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

// The custom tooltip does not rely on the Highcharts tooltip. Instead, we listen to the mouse-over event on series points,
// and then render a fake invisible target element to compute the custom tooltip position against.
// The tooltip can be hidden when we receive mouse-leave. It can also be pinned/unpinned on mouse click.
// Despite event names, they events also fire on keyboard interactions.

export function useChartTooltip({
  placement,
  legendAPI,
  ...options
}: CoreTooltipOptions & { legendAPI: InternalCoreChartLegendAPI }) {
  const getTargetFromPoint = useStableCallbackNullable(options.getTargetFromPoint);
  const getTooltipContent = useStableCallbackNullable(options.getTooltipContent);
  const onPointHighlight = useStableCallbackNullable(options.onPointHighlight);
  const onClearHighlight = useStableCallbackNullable(options.onClearHighlight);
  const tooltipStore = useMemo(
    () =>
      new TooltipStore(
        { placement, getTargetFromPoint, getTooltipContent, onPointHighlight, onClearHighlight },
        legendAPI,
      ),
    [placement, getTargetFromPoint, getTooltipContent, onPointHighlight, onClearHighlight, legendAPI],
  );

  const onRenderChart: Highcharts.ChartRenderCallbackFunction = function () {
    tooltipStore.onRenderChart(this);
  };
  const onChartClick: Highcharts.ChartClickCallbackFunction = function () {
    const { hoverPoint } = this;
    if (hoverPoint) {
      tooltipStore.onMouseClickPlot(hoverPoint);
    } else {
      tooltipStore.onMouseClickPlot(null);
    }
  };
  const onSeriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function () {
    tooltipStore.onMouseOverTarget(this);
  };
  const onSeriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
    tooltipStore.onMouseLeaveTarget();
  };
  const onSeriesPointClick: Highcharts.PointClickCallbackFunction = function () {
    tooltipStore.onMouseClickPlot(this);
  };

  const tooltipAPI: InternalCoreChartTooltipAPI = useMemo(
    () => ({
      store: tooltipStore,
      showTooltipOnPoint: (point) => tooltipStore.onMouseOverTarget(point),
      hideTooltip: () => tooltipStore.onMouseLeaveTarget(),
      onMouseEnterTooltip: () => tooltipStore.onMouseEnterTooltip(),
      onMouseLeaveTooltip: () => tooltipStore.onMouseLeaveTooltip(),
      onDismissTooltip: () => tooltipStore.onDismissTooltip(),
      getTrack: () => tooltipStore.getTrack(),
    }),
    [tooltipStore],
  );

  return {
    options: { onRenderChart, onChartClick, onSeriesPointMouseOver, onSeriesPointMouseOut, onSeriesPointClick },
    api: tooltipAPI,
  };
}

interface AsyncTooltipState {
  visible: boolean;
  pinned: boolean;
  point: null | Highcharts.Point;
}

class TooltipStore extends AsyncStore<AsyncTooltipState> {
  public getTrack: () => null | SVGElement = () => null;

  private _chart: null | Highcharts.Chart = null;
  private legendAPI: InternalCoreChartLegendAPI;
  private tooltipOptions: CoreTooltipOptions = {};
  private targetElement: null | Highcharts.SVGElement = null;
  private mouseLeaveCall = new DebouncedCall();
  private lastDismissTime = 0;
  private tooltipHovered = false;

  constructor(tooltipOptions: CoreTooltipOptions, legendAPI: InternalCoreChartLegendAPI) {
    super({ visible: false, pinned: false, point: null });
    this.tooltipOptions = tooltipOptions;
    this.legendAPI = legendAPI;
  }

  private get chart() {
    if (!this._chart) {
      throw new Error("Invariant violation: using tooltip API before initializing chart.");
    }
    return this._chart;
  }

  public onRenderChart = (chart: Highcharts.Chart) => {
    this._chart = chart;
  };

  // When hovering (or focusing) over the target (point, bar, segment, etc.) we show the tooltip in the target coordinate.
  public onMouseOverTarget = (point: Highcharts.Point) => {
    this.updateSetters();

    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.get().pinned) {
      return false;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.highlightActions(point);
    this.set(() => ({ visible: true, pinned: false, point }));
  };

  // When the plot is clicked we pin the popover in its current position.
  public onMouseClickPlot = (point: null | Highcharts.Point) => {
    // The behavior is ignored if the popover is already pinned.
    if (this.get().pinned) {
      return;
    }
    // If the click point is different from the current position - the tooltip is moved to the new position.
    const prevPoint = this.get().point;
    if (point && point.x !== prevPoint?.x && point.y !== prevPoint?.y) {
      this.highlightActions(point);
      this.set(() => ({ visible: true, pinned: false, point: point ?? prevPoint }));
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      this.set(() => ({ visible: true, pinned: true, point: point ?? prevPoint }));
    }
  };

  public onMouseLeaveTarget = () => {
    // The behavior is ignored if user hovers over the tooltip.
    if (this.tooltipHovered) {
      return;
    }
    if (!this.get().pinned) {
      this.mouseLeaveCall.cancelPrevious();
      this.mouseLeaveCall.call(() => {
        if (this.tooltipHovered) {
          return;
        }
        this.clearHighlightActions();
        this.set((prev) => ({ ...prev, visible: false, pinned: false, content: null }));
      }, MOUSE_LEAVE_DELAY);
    }
  };

  public onMouseEnterTooltip = () => {
    this.tooltipHovered = true;
  };

  public onMouseLeaveTooltip = () => {
    if (!this.get().pinned) {
      this.mouseLeaveCall.cancelPrevious();
      this.mouseLeaveCall.call(() => {
        this.clearHighlightActions();
        this.set((prev) => ({ ...prev, visible: false, pinned: false, content: null }));
      }, MOUSE_LEAVE_DELAY);
    }
    this.tooltipHovered = false;
  };

  public onDismissTooltip = (outsideClick?: boolean) => {
    if (this.get().pinned) {
      this.lastDismissTime = new Date().getTime();
      this.set((prev) => ({ ...prev, visible: false, pinned: false, content: null }));
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        // This brings the focus back to the chart.
        // If the last focused target is no longer around - the focus goes back to the first data point.
        this.chart.series?.[0]?.data?.[0].graphic?.element.focus();
      }
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
          if (this.get().pinned) {
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
            if (this.get().pinned) {
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
    const detail = this.tooltipOptions.onPointHighlight?.({ point, target });
    this.destroyMarkers();
    this.createMarkers(target);

    if (detail?.matchedLegendItems) {
      this.legendAPI.legend.highlightItems(detail?.matchedLegendItems);
    }
  };

  private getTarget = (point: Highcharts.Point) => {
    return this.tooltipOptions.getTargetFromPoint?.(point) ?? this.getDefaultTarget(point);
  };

  private getDefaultTarget = (point: Highcharts.Point) => {
    const placement = this.tooltipOptions.placement ?? "target";
    const { plotTop, plotLeft, plotWidth, plotHeight, inverted } = this.chart;
    if (placement === "target" && !inverted) {
      const x = (point.plotX ?? 0) + plotLeft;
      const y = (point.plotY ?? 0) + plotTop;
      return { x, y, width: 4, height: 1 };
    }
    if (placement === "target" && inverted) {
      const x = plotWidth - (point.plotY ?? 0) + plotLeft;
      const y = plotHeight - (point.plotX ?? 0) + plotTop;
      return { x, y, width: 1, height: 4 };
    }
    if (placement === "middle" && !inverted) {
      const x = (point.plotX ?? 0) + plotLeft;
      return { x, y: plotTop + plotHeight / 2, width: 4, height: 1 };
    }
    if (placement === "middle" && inverted) {
      const y = plotHeight - (point.plotX ?? 0) + plotTop;
      return { x: plotLeft + plotWidth / 2, y, width: 1, height: 4 };
    }
    if (placement === "bottom") {
      const x = (point.plotX ?? 0) + plotLeft;
      return { x, y: plotTop, width: 1, height: plotHeight };
    }
    throw new Error("Invariant violation: unsupported tooltip placement option.");
  };

  private createMarkers = (target: Rect) => {
    this.targetElement = this.chart.renderer
      .rect(target.x, target.y, target.width, target.height)
      .attr({ fill: "transparent" })
      .add();

    // The targetElement.element can get invalidated by Highcharts, so we cannot use
    // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
    // The getTrack function ensures the latest element reference is given on each request.
    this.getTrack = () => (this.targetElement?.element ?? null) as null | SVGElement;
  };

  private clearHighlightActions = () => {
    this.tooltipOptions.onClearHighlight?.(this.chart);
    this.destroyMarkers();
    this.legendAPI.legend.clearHighlight();
  };

  private destroyMarkers = () => {
    this.targetElement?.destroy();
  };
}

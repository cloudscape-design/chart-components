// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { DebouncedCall } from "../internal/utils/utils";
import { BaseTooltipProps } from "./interfaces-base";
import { CloudscapeChartAPI, CoreTooltipProps, Target } from "./interfaces-core";

const MOUSE_LEAVE_DELAY = 300;
const LAST_DISMISS_DELAY = 250;
const SET_STATE_OVERRIDE_MARKER = Symbol("awsui-set-state");

// The custom tooltip does not rely on the Highcharts tooltip. Instead, we listen to the mouse-over event on series points,
// and then render a fake invisible target element to compute the Cloudscape chart popover position against.
// The tooltip can be hidden when we receive mouse-leave. It can also be pinned/unpinned on mouse click.
// Despite event names, they events also fire on keyboard interactions.

export function useChartTooltip(getAPI: () => CloudscapeChartAPI, tooltipProps?: CoreTooltipProps) {
  const tooltipStore = useRef(new TooltipStore(getAPI)).current;
  tooltipStore.tooltipProps = tooltipProps ?? {};

  const chartClick: Highcharts.ChartClickCallbackFunction = function () {
    const { hoverPoint } = this;
    if (hoverPoint) {
      tooltipStore.onMouseClickPlot(hoverPoint);
    } else {
      tooltipStore.onMouseClickPlot(null);
    }
  };
  const seriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function (event) {
    if (event.target instanceof getAPI().highcharts.Point) {
      tooltipStore.onMouseOverTarget(event.target);
    }
  };
  const seriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
    tooltipStore.onMouseLeaveTarget();
  };
  const seriesPointClick: Highcharts.PointClickCallbackFunction = function () {
    tooltipStore.onMouseClickPlot(this);
  };

  return {
    options: { chartClick, seriesPointMouseOver, seriesPointMouseOut, seriesPointClick },
    props: {
      tooltipStore,
      getContent: tooltipProps?.getTooltipContent ?? (() => null),
      placement: tooltipProps?.placement,
      size: tooltipProps?.size,
    },
    api: {
      showTooltipOnPoint: (point: Highcharts.Point) => tooltipStore.onMouseOverTarget(point),
      hideTooltip: () => tooltipStore.onMouseLeaveTarget(),
    },
  };
}

export function ChartTooltip({
  tooltipStore,
  getContent,
  placement,
  size,
}: BaseTooltipProps & { tooltipStore: TooltipStore; getContent: CoreTooltipProps["getTooltipContent"] }) {
  const tooltip = useSelector(tooltipStore, (s) => s);
  if (!tooltip.visible) {
    return null;
  }
  if (!tooltip.point) {
    return null;
    // throw new Error("Invariant violation: visible tooltip does not have point data.");
  }
  const content = getContent?.({ point: tooltip.point });
  if (!content) {
    return null;
  }
  return (
    <InternalChartTooltip
      getTrack={tooltipStore.getTrack}
      trackKey={tooltip.point.x + ":" + tooltip.point.y}
      container={null}
      dismissButton={tooltip.pinned}
      onDismiss={tooltipStore.onDismiss}
      onMouseEnter={tooltipStore.onMouseEnterTooltip}
      onMouseLeave={tooltipStore.onMouseLeaveTooltip}
      title={content.header}
      footer={content.footer}
      size={size}
      position={placement === "bottom" ? "bottom" : undefined}
      minHeight={200}
    >
      {content.body}
    </InternalChartTooltip>
  );
}

interface ReactiveTooltipState {
  visible: boolean;
  pinned: boolean;
  point: null | Highcharts.Point;
}

class TooltipStore extends AsyncStore<ReactiveTooltipState> {
  public getTrack: () => null | HTMLElement | SVGElement = () => null;
  public tooltipProps: CoreTooltipProps = {};

  private getAPI: () => CloudscapeChartAPI;
  private targetElement: null | Highcharts.SVGElement = null;
  private mouseLeaveCall = new DebouncedCall();
  private lastDismissTime = 0;
  private tooltipHovered = false;

  constructor(getAPI: () => CloudscapeChartAPI) {
    super({ visible: false, pinned: false, point: null });
    this.getAPI = getAPI;
  }

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

  public onDismiss = (outsideClick?: boolean) => {
    if (this.get().pinned) {
      this.lastDismissTime = new Date().getTime();
      this.set((prev) => ({ ...prev, visible: false, pinned: false, content: null }));
      // Selecting the point on which the popover was pinned to bring focus back to it when the popover is dismissed.
      // This is unless the popover was dismissed by an outside click, in which case the focus should stay on the click target.
      if (!outsideClick) {
        // This brings the focus back to the chart.
        // If the last focused target is no longer around - the focus goes back to the first data point.
        this.api.chart.series?.[0]?.data?.[0].graphic?.element.focus();
      }
    }
  };

  private updateSetters() {
    for (const s of this.api.chart.series) {
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

  private get api() {
    return this.getAPI();
  }

  private highlightActions = (point: Highcharts.Point) => {
    const target = this.getTarget(point);
    const detail = this.tooltipProps.onPointHighlight?.({ point, target });
    this.destroyMarkers();
    this.createMarkers(target);

    if (detail?.matchedLegendItems) {
      this.api.highlightLegendItems(detail?.matchedLegendItems);
    }
  };

  private getTarget = (point: Highcharts.Point) => {
    return this.tooltipProps.getTargetFromPoint?.(point) ?? this.getDefaultTarget(point);
  };

  private getDefaultTarget = (point: Highcharts.Point) => {
    const placement = this.tooltipProps.placement ?? "target";
    const { plotTop, plotLeft, plotWidth, plotHeight, inverted } = this.api.chart;
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

  private createMarkers = (target: Target) => {
    this.targetElement = this.api.chart.renderer
      .rect(target.x, target.y, target.width, target.height)
      .attr({ fill: "transparent" })
      .add();

    // The targetElement.element can get invalidated by Highcharts, so we cannot use
    // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
    // The getTrack function ensures the latest element reference is given on each request.
    this.getTrack = () => this.targetElement?.element ?? null;
  };

  private clearHighlightActions = () => {
    this.tooltipProps.onClearHighlight?.();
    this.destroyMarkers();
    this.api.clearLegendHighlight();
  };

  private destroyMarkers = () => {
    this.targetElement?.destroy();
  };
}

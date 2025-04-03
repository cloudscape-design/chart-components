// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { DebouncedCall } from "../internal/utils/utils";
import { Point } from "./interfaces-base";
import { CloudscapeChartAPI, CoreTooltipProps } from "./interfaces-core";
import * as Styles from "./styles";

const MOUSE_LEAVE_DELAY = 300;
const LAST_DISMISS_DELAY = 250;

// The custom tooltip does not rely on the Highcharts tooltip. Instead, we listen to the mouse-over event on series points,
// and then render a fake invisible target element to compute the Cloudscape chart popover position against.
// The tooltip can be hidden when we receive mouse-leave. It can also be pinned/unpinned on mouse click.
// Despite event names, they events also fire on keyboard interactions.

export function useChartTooltip(
  highcharts: null | typeof Highcharts,
  getChart: () => CloudscapeChartAPI,
  tooltipProps?: CoreTooltipProps,
) {
  const tooltipStore = useRef(new TooltipStore(getChart)).current;
  tooltipStore.placement = tooltipProps?.placement ?? "target";

  const chartClick: Highcharts.ChartClickCallbackFunction = function () {
    const { hoverPoint } = this;
    if (hoverPoint) {
      tooltipStore.onMouseClickPlot(hoverPoint);
    } else {
      tooltipStore.onMouseClickPlot(null);
    }
  };
  const seriesPointMouseOver: Highcharts.PointMouseOverCallbackFunction = function (event) {
    if (highcharts && event.target instanceof highcharts.Point) {
      tooltipStore.onMouseOverTarget(event.target);
    }
  };
  const seriesPointMouseOut: Highcharts.PointMouseOutCallbackFunction = function () {
    tooltipStore.onMouseLeaveTarget();
  };
  const seriesPointClick: Highcharts.PointClickCallbackFunction = function () {
    tooltipStore.onMouseClickPlot(this);
  };

  const showTooltipOnPoint = (point: Highcharts.Point) => tooltipStore.onMouseOverTarget(point);
  const hideTooltip = () => tooltipStore.onMouseLeaveTarget();

  return {
    options: { chartClick, seriesPointMouseOver, seriesPointMouseOut, seriesPointClick },
    props: {
      tooltipStore,
      getContent: tooltipProps?.getContent ?? (() => null),
      placement: tooltipProps?.placement,
      size: tooltipProps?.size,
    },
    api: { showTooltipOnPoint, hideTooltip },
  };
}

export function ChartTooltip({
  tooltipStore,
  getContent,
  placement,
  size,
}: CoreTooltipProps & { tooltipStore: TooltipStore }) {
  const tooltip = useSelector(tooltipStore, (s) => s);
  if (!tooltip.visible) {
    return null;
  }
  const content = getContent(tooltip.point);
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
    >
      {content.body}
    </InternalChartTooltip>
  );
}

interface ReactiveTooltipState {
  visible: boolean;
  pinned: boolean;
  point: Point;
}

class TooltipStore extends AsyncStore<ReactiveTooltipState> {
  public getTrack: () => null | HTMLElement | SVGElement = () => null;
  public placement: "target" | "bottom" = "target";

  private getChart: () => CloudscapeChartAPI;
  private targetElement: null | Highcharts.SVGElement = null;
  private cursorElement: null | Highcharts.SVGElement = null;
  private mouseLeaveCall = new DebouncedCall();
  private lastDismissTime = 0;
  private tooltipHovered = false;

  constructor(getChart: () => CloudscapeChartAPI) {
    super({ visible: false, pinned: false, point: { x: 0, y: 0 } });
    this.getChart = getChart;
  }

  // When hovering (or focusing) over the target (point, bar, segment, etc.) we show the tooltip in the target coordinate.
  public onMouseOverTarget = (target: Highcharts.Point) => {
    // The behavior is ignored if the tooltip is already shown and pinned.
    if (this.get().pinned) {
      return;
    }
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    this.moveMarkers(target);
    this.set(() => {
      const point = { x: target.x, y: target.y ?? 0 };
      return { visible: true, pinned: false, point };
    });
  };

  // When the plot is clicked we pin the popover in its current position.
  public onMouseClickPlot = (target: null | Highcharts.Point) => {
    // The behavior is ignored if the popover is already pinned.
    if (this.get().pinned) {
      return;
    }
    // If the click point is different from the current position - the tooltip is moved to the new position.
    if (target && this.get().point.x !== target.x && this.get().point.y !== target.y) {
      this.moveMarkers(target);
      this.set((prev) => {
        const point = target ? { x: target.x, y: target.y ?? 0 } : prev.point;
        return { visible: true, pinned: false, point };
      });
    }
    // If the click point is missing or matches the current position and it wasn't recently dismissed - it is pinned in this position.
    else if (new Date().getTime() - this.lastDismissTime > LAST_DISMISS_DELAY) {
      this.set((prev) => {
        const point = target ? { x: target.x, y: target.y ?? 0 } : prev.point;
        return { visible: true, pinned: true, point };
      });
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
        this.destroyMarkers();
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
        this.destroyMarkers();
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
        this.chart.series?.[0]?.data?.[0].graphic?.element.focus();
      }
    }
  };

  private get chart() {
    return this.getChart().hc;
  }

  private moveMarkers = (target: Highcharts.Point) => {
    this.destroyMarkers();
    this.createMarkers(target);
  };

  private createMarkers = (target: Highcharts.Point) => {
    let markerTop = this.chart.plotTop;
    let markerHeight = this.chart.plotHeight;
    let x = (target.plotX ?? 0) + this.chart.plotLeft;
    let y = (target.plotY ?? 0) + this.chart.plotTop;
    if (this.chart.inverted) {
      x = this.chart.plotWidth - (target.plotY ?? 0) + this.chart.plotLeft;
      y = this.chart.plotHeight - (target.plotX ?? 0) + this.chart.plotTop;
    }
    // The pie series segments do not provide plotX, plotY.
    // That's why we use the tooltipPos tuple, which is not covered by Typescript.
    if (target.series.type === "pie" && this.placement === "target") {
      x = (target as any).tooltipPos[0];
      y = (target as any).tooltipPos[1];
    }
    if (target.series.type === "pie" && this.placement === "bottom") {
      const { centerX, centerY, radius } = this.getPieCoordinates(target.series);
      x = centerX;
      y = centerY;
      markerTop = centerY - radius;
      markerHeight = 2 * radius;
    }

    this.cursorElement = this.chart.renderer
      .rect(x, markerTop, 1, markerHeight)
      .attr({ fill: target.series.type !== "pie" ? Styles.colorChartCursor : "transparent" })
      .add();
    this.targetElement = this.placement === "target" ? this.chart.renderer.circle(x, y, 0).add() : this.cursorElement;

    // The targetElement.element can get invalidated by Highcharts, so we cannot use
    // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
    // The getTrack function ensures the latest element reference is given on each request.
    this.getTrack = () => this.targetElement?.element ?? null;
  };

  private getPieCoordinates = (series: Highcharts.Series) => {
    const [relativeX, relativeY, relativeDiameter] = series.center;
    const plotLeft = this.chart.plotLeft;
    const plotTop = this.chart.plotTop;
    const centerX = plotLeft + (typeof relativeX === "number" ? relativeX : (relativeX / 100) * this.chart.plotWidth);
    const centerY = plotTop + (typeof relativeY === "number" ? relativeY : (relativeY / 100) * this.chart.plotHeight);
    const radius =
      (typeof relativeDiameter === "number" ? relativeDiameter : (relativeDiameter / 100) * this.chart.plotWidth) / 2;
    return { centerX, centerY, radius };
  };

  private destroyMarkers = () => {
    this.targetElement?.destroy();
    this.cursorElement?.destroy();
  };
}

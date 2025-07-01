// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getChartSeries } from "../../internal/utils/chart-series";
import { DebouncedCall } from "../../internal/utils/utils";
import { isPointVisible } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

const HOVER_LOST_DELAY = 25;

export interface ChartExtraPointerHandlers {
  onPointHover(point: Highcharts.Point): void;
  onGroupHover(group: Highcharts.Point[]): void;
  onHoverLost(): void;
  onPointClick(point: Highcharts.Point): void;
  onGroupClick(group: Highcharts.Point[]): void;
}

// Chart helper that implements pointer events (click and hover).
export class ChartExtraPointer {
  private context: ChartExtraContext;
  private handlers: ChartExtraPointerHandlers;
  private hoveredPoint: null | Highcharts.Point = null;
  private hoveredGroup: null | Highcharts.Point[] = null;
  private tooltipHovered = false;
  private hoverLostCall = new DebouncedCall();

  constructor(context: ChartExtraContext, handlers: ChartExtraPointerHandlers) {
    this.context = context;
    this.handlers = handlers;
  }

  public onChartLoad = (chart: Highcharts.Chart) => {
    chart.container.addEventListener("mousemove", this.onChartMousemove);
    chart.container.addEventListener("mouseout", this.onChartMouseout);
  };

  public onChartDestroy = () => {
    this.context.chartOrNull?.container?.removeEventListener("mousemove", this.onChartMousemove);
    this.context.chartOrNull?.container?.removeEventListener("mouseout", this.onChartMouseout);
  };

  // This event is triggered by Highcharts when the cursor is over a Highcharts point. We leave this to
  // Highcharts because it includes computation of complex shape intersections, such as pie chart segments.
  // When triggered, we set the given point as hovered, and it takes precedence over hovered groups.
  public onSeriesPointMouseOver = (point: Highcharts.Point) => {
    this.setHoveredPoint(point);
  };

  // When the pointer leaves a point, it does not necessarily mean the hover state needs to be cleared, as another
  // point or group can be hovered next. If it does not happen, the on-hover-lost handler is called after a short delay.
  public onSeriesPointMouseOut = () => {
    this.hoveredPoint = null;
    this.clearHover();
  };

  // We clear hover state when the pointer is moved outside the chart, unless it is moved inside the tooltip.
  // Wo do, hover, clear the point and group hover state so that if the pointer leaves chart from the tooltip,
  // the on-hover-lost handler is still called.
  public onMouseEnterTooltip = () => {
    this.tooltipHovered = true;
    this.hoveredPoint = null;
    this.hoveredGroup = null;
  };

  // When the pointer leaves the tooltip it can hover another point or group. If that does not happen,
  // the on-hover-lost handler is called after a short delay.
  public onMouseLeaveTooltip = () => {
    this.tooltipHovered = false;
    this.clearHover();
  };

  // The mouse-move handler takes all move events inside the chart, and its purpose is to capture hover for groups
  // of points (those having matching X value in cartesian charts), as this is not directly supported by Highcharts.
  // Points hovering takes precedence over groups hovering.
  private onChartMousemove = (event: MouseEvent) => {
    const chart = this.context.chart();
    // In pie charts there is no support for groups - only a single point can be hovered at a time.
    if (getChartSeries(chart.series).some((s) => s.type === "pie")) {
      return;
    }
    // The plotX and plotY are pointer coordinates, normalized against the chart plot.
    const normalized = chart.pointer.normalize(event);
    const plotX = normalized.chartX;
    const plotY = normalized.chartY;
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
    // We only check for matched groups if the plotX, plotY are within the plot area, where series are rendered.
    if (plotX >= plotLeft && plotX <= plotLeft + plotWidth && plotY >= plotTop && plotY <= plotTop + plotHeight) {
      // We match groups by comparing the plotX, plotY against each group rect. If the pointer is within one of
      // the rects - the group is considered matched. Otherwise, we take the group which is closest to the pointer.
      // This is done to avoid gaps, when the hover state switches between on and off in a sparsely populated chart,
      // causing the tooltip to show and hide as the pointer moves.
      let matchedGroup: Highcharts.Point[] = [];
      let minDistance = Number.POSITIVE_INFINITY;
      for (const { group, rect } of this.context.derived.groupRects) {
        const [target, start, end] = chart.inverted
          ? [plotY, rect.y, rect.y + rect.height]
          : [plotX, rect.x, rect.x + rect.width];
        const minTargetDistance = Math.min(Math.abs(start - target), Math.abs(end - target));
        if (start <= target && target < end) {
          matchedGroup = group;
          break;
        } else if (minTargetDistance < minDistance) {
          minDistance = minTargetDistance;
          matchedGroup = group;
        }
      }
      this.setHoveredGroup(matchedGroup);
    }
    // If the plotX, plotY are outside of the series area (e.g. if the pointer is above axis titles or ticks),
    // we clear the group hover state and trigger the on-hover-lost after a short delay.
    else {
      this.hoveredGroup = null;
      this.clearHover();
    }
  };

  // This event is triggered when the pointer leaves the chart area. Here, it is technically not necessary to add
  // a delay before calling the on-hover-lost handler, but it is done for consistency in the UX.
  private onChartMouseout = () => {
    this.hoveredGroup = null;
    this.clearHover();
  };

  // This event is triggered by Highcharts when there is a click inside the chart plot. It might or might not include
  // the point, hovered immediately before the click.
  public onChartClick = (point: null | Highcharts.Point) => {
    this.onClick(point);
  };

  // This event is triggered by Highcharts when a series point is clicked, it always has a point target.
  public onSeriesPointClick = (point: Highcharts.Point) => {
    this.onClick(point);
  };

  // We treat the chart and point clicks the same, but call different handlers depending on the target (null or point).
  // When the point is not present, we assume the click was done on a group, so we take the group that was hovered before
  // the click event triggered.
  // Before calling the on-point-click or on-group-click handlers, we verify if the target point or group are still valid
  // (visible, and not destroyed by Highcharts).
  private onClick = (point: null | Highcharts.Point) => {
    const targetPoint = point ?? (this.hoveredPoint && isPointVisible(this.hoveredPoint) ? this.hoveredPoint : null);
    if (targetPoint) {
      this.handlers.onPointClick(targetPoint);
      return;
    }
    const targetGroup = this.hoveredGroup?.filter(isPointVisible) ?? null;
    if (targetGroup && targetGroup.length > 0) {
      this.handlers.onGroupClick(targetGroup);
      return;
    }
  };

  private setHoveredPoint = (point: Highcharts.Point) => {
    if (isPointVisible(point)) {
      this.hoveredPoint = point;
      this.hoveredGroup = null;
      this.handlers.onPointHover(point);
      this.applyCursorStyle();
    }
  };

  private setHoveredGroup = (group: Highcharts.Point[]) => {
    if (!this.hoveredPoint || !isPointVisible(this.hoveredPoint)) {
      const availablePoints = group.filter(isPointVisible);
      this.hoveredPoint = null;
      this.hoveredGroup = availablePoints;
      this.handlers.onGroupHover(availablePoints);
      this.applyCursorStyle();
    }
  };

  // The function calls the on-hover-lost handler in a short delay to give time for the hover to
  // transition from one target to another. Before calling the handler we check if no target
  // (point, group, or tooltip) is hovered.
  private clearHover = () => {
    this.hoverLostCall.call(() => {
      if (!this.hoveredPoint && !this.hoveredGroup && !this.tooltipHovered) {
        this.handlers.onHoverLost();
        this.applyCursorStyle();
      }
    }, HOVER_LOST_DELAY);
  };

  private applyCursorStyle = () => {
    const container = this.context.chart().container;
    const setCursor = (value: "pointer" | "default") => {
      if (container && container.style.cursor !== value) {
        container.style.cursor = value;
      }
    };
    if (this.hoveredPoint || this.hoveredGroup) {
      setCursor("pointer");
    } else {
      setCursor("default");
    }
  };
}

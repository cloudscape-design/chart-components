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
  // When the mouse exits the tooltip through its arrow/padding area back into the chart's plot area,
  // the mousemove handler immediately finds the nearest group (the same one the tooltip was showing for)
  // and re-triggers the tooltip. This creates an infinite show/hide loop that makes the tooltip appear stuck.
  // This flag suppresses re-hovering for a short window after leaving the tooltip to break the cycle.
  private recentlyLeftTooltip = false;
  private recentlyLeftTooltipX: number | null = null;
  private recentlyLeftTooltipTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverLostCall = new DebouncedCall();

  constructor(context: ChartExtraContext, handlers: ChartExtraPointerHandlers) {
    this.context = context;
    this.handlers = handlers;
  }

  public onChartLoad = (chart: Highcharts.Chart) => {
    chart.container.addEventListener("mousemove", this.onChartMousemove);
    chart.container.addEventListener("mouseleave", this.onChartMouseout);
  };

  public onChartDestroy = () => {
    this.context.chartOrNull?.container?.removeEventListener("mousemove", this.onChartMousemove);
    this.context.chartOrNull?.container?.removeEventListener("mouseleave", this.onChartMouseout);
    if (this.recentlyLeftTooltipTimer !== null) {
      clearTimeout(this.recentlyLeftTooltipTimer);
      this.recentlyLeftTooltipTimer = null;
    }
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
    // Save the X of the currently hovered group/point before clearing, so that
    // setRecentlyLeftTooltip can scope the re-hover suppression to this X only.
    this.recentlyLeftTooltipX = this.hoveredGroup?.[0]?.x ?? this.hoveredPoint?.x ?? null;
    this.tooltipHovered = true;
    this.hoveredPoint = null;
    this.hoveredGroup = null;
  };

  // Reset the tooltip hovered state. This is called when the tooltip is programmatically hidden
  // (e.g. via clearHighlightActions) to prevent tooltipHovered from getting stuck as true.
  // This can happen when the tooltip React component unmounts before the mouseleave event fires,
  // leaving tooltipHovered=true and causing subsequent onChartMouseout calls to skip onHoverLost.
  public resetTooltipHovered = () => {
    this.tooltipHovered = false;
  };

  // When the pointer leaves the tooltip, we immediately check if any point or group is still hovered.
  // If not, we fire onHoverLost immediately to prevent the tooltip from staying visible when the mouse
  // exits the chart area through the tooltip (e.g., moving left).
  public onMouseLeaveTooltip = () => {
    this.tooltipHovered = false;
    this.hoverLostCall.cancelPrevious();
    if (!this.hoveredPoint && !this.hoveredGroup) {
      // Suppress re-hovering briefly to prevent an infinite show/hide loop when the mouse exits
      // the tooltip through its arrow/padding area back into the chart's plot area. Without this,
      // onChartMousemove immediately re-matches the same group and re-shows the tooltip.
      this.setRecentlyLeftTooltip();
      this.handlers.onHoverLost();
      this.applyCursorStyle();
    }
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
    // we immediately clear all hover state. Unlike transitions between points/groups within the plot area,
    // there is no need to debounce here as the cursor has definitively left the data region.
    else {
      this.hoveredPoint = null;
      this.hoveredGroup = null;
      this.hoverLostCall.cancelPrevious();
      if (!this.tooltipHovered) {
        this.handlers.onHoverLost();
        this.applyCursorStyle();
      } else {
        // Safety net: same as in onChartMouseout — if the mouse moves outside the plot area
        // while tooltipHovered is true, schedule a deferred check to break the deadlock in case
        // onMouseLeaveTooltip never fires (e.g. tooltip unmounts before mouseleave propagates).
        this.hoverLostCall.call(() => {
          if (this.tooltipHovered && !this.hoveredPoint && !this.hoveredGroup) {
            this.tooltipHovered = false;
            this.handlers.onHoverLost();
            this.applyCursorStyle();
          }
        }, HOVER_LOST_DELAY);
      }
    }
  };

  // This event is triggered when the pointer leaves the chart container entirely.
  // We immediately clear all hover state since the cursor has definitively left the chart.
  private onChartMouseout = () => {
    this.hoveredPoint = null;
    this.hoveredGroup = null;
    this.hoverLostCall.cancelPrevious();
    if (!this.tooltipHovered) {
      this.handlers.onHoverLost();
      this.applyCursorStyle();
    } else {
      // Safety net: When the mouse exits the chart while tooltipHovered is true,
      // schedule a deferred check. Normally, onMouseLeaveTooltip() will fire and
      // handle cleanup. But if it doesn't (browser quirk, React re-render race,
      // tooltip at viewport edge), this ensures the tooltip is eventually dismissed.
      this.hoverLostCall.call(() => {
        if (this.tooltipHovered && !this.hoveredPoint && !this.hoveredGroup) {
          this.tooltipHovered = false;
          this.handlers.onHoverLost();
          this.applyCursorStyle();
        }
      }, HOVER_LOST_DELAY);
    }
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
    // Only suppress re-hover for the same X position that was just dismissed,
    // allowing adjacent groups to still show their tooltip without flickering.
    if (this.recentlyLeftTooltip && point.x === this.recentlyLeftTooltipX) {
      return;
    }
    if (isPointVisible(point)) {
      this.hoveredPoint = point;
      this.hoveredGroup = null;
      this.handlers.onPointHover(point);
      this.applyCursorStyle();
    }
  };

  private setHoveredGroup = (group: Highcharts.Point[]) => {
    // Only suppress re-hover for the same X position that was just dismissed,
    // allowing adjacent groups to still show their tooltip without flickering.
    if (this.recentlyLeftTooltip && group[0]?.x === this.recentlyLeftTooltipX) {
      return;
    }
    if (!this.hoveredPoint || !isPointVisible(this.hoveredPoint)) {
      const availablePoints = group.filter(isPointVisible);
      this.hoveredPoint = null;
      this.hoveredGroup = availablePoints;
      this.handlers.onGroupHover(availablePoints);
      this.applyCursorStyle();
    }
  };

  private setRecentlyLeftTooltip = () => {
    this.recentlyLeftTooltip = true;
    if (this.recentlyLeftTooltipTimer !== null) {
      clearTimeout(this.recentlyLeftTooltipTimer);
    }
    this.recentlyLeftTooltipTimer = setTimeout(() => {
      this.recentlyLeftTooltip = false;
      this.recentlyLeftTooltipTimer = null;
    }, HOVER_LOST_DELAY);
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
    if (container) {
      const value = this.hoveredPoint || this.hoveredGroup ? "pointer" : "default";
      container.style.cursor = value;
    }
  };
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { isPointVisible } from "../utils";
import { ChartAPIContext } from "./chart-context";

import testClasses from "../test-classes/styles.css.js";

export interface ChartExtraPointerHandlers {
  onPointHover(point: Highcharts.Point): void;
  onGroupHover(group: Highcharts.Point[]): void;
  onHoverLost(): void;
  onPointClick(point: Highcharts.Point): void;
  onGroupClick(group: Highcharts.Point[]): void;
}

// Chart helper that implements pointer events (click and hover).
export class ChartExtraPointer {
  private context: ChartAPIContext;
  private handlers: ChartExtraPointerHandlers;
  private hoveredPoint: null | Highcharts.Point = null;
  private hoveredGroup: null | Highcharts.Point[] = null;

  constructor(context: ChartAPIContext, handlers: ChartExtraPointerHandlers) {
    this.context = context;
    this.handlers = handlers;
  }

  public onChartLoad = (chart: Highcharts.Chart) => {
    document.addEventListener("mousemove", this.onDocumentMousemove);
    chart.container.addEventListener("mousemove", this.onChartMousemove);
  };

  public onChartDestroy = () => {
    document.removeEventListener("mousemove", this.onDocumentMousemove);
    this.context.chartOrNull?.container?.removeEventListener("mousemove", this.onChartMousemove);
  };

  public onSeriesPointMouseOver = (point: Highcharts.Point) => {
    this.setHoveredPoint(point);
  };

  public onSeriesPointMouseOut = () => {
    this.hoveredPoint = null;
  };

  private onChartMousemove = (event: MouseEvent) => {
    const chart = this.context.chart();
    const normalized = chart.pointer.normalize(event);
    const plotX = normalized.chartX;
    const plotY = normalized.chartY;
    const { plotLeft, plotTop, plotWidth, plotHeight } = chart;

    if (plotX >= plotLeft && plotX <= plotLeft + plotWidth && plotY >= plotTop && plotY <= plotTop + plotHeight) {
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

      if (matchedGroup.length > 0) {
        this.setHoveredGroup(matchedGroup);
      }
    }
  };

  private onDocumentMousemove = (event: MouseEvent) => {
    if (!(event.target instanceof HTMLElement) && !(event.target instanceof SVGElement)) {
      return;
    }
    if (!this.hoveredPoint && !this.hoveredGroup) {
      return;
    }
    const svg = this.context.chartOrNull?.container.querySelector("svg");
    const insideChart = svg?.contains(event.target);
    const insideTooltip = !!event.target.closest(`.${testClasses.tooltip}`);
    if (!insideChart && !insideTooltip) {
      this.clearHover();
    }
  };

  public onChartClick = (point: null | Highcharts.Point) => {
    this.onClick(point);
  };

  public onSeriesPointClick = (point: Highcharts.Point) => {
    this.onClick(point);
  };

  public onClick = (point: null | Highcharts.Point) => {
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
    }
  };

  private setHoveredGroup = (group: Highcharts.Point[]) => {
    if (!this.hoveredPoint || !isPointVisible(this.hoveredPoint)) {
      const availablePoints = group.filter(isPointVisible);
      this.hoveredPoint = null;
      this.hoveredGroup = availablePoints;
      this.handlers.onGroupHover(availablePoints);
    }
  };

  private clearHover = () => {
    this.hoveredPoint = null;
    this.hoveredGroup = null;
    this.handlers.onHoverLost();
  };
}

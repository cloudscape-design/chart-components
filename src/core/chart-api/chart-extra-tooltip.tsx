// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getIsRtl } from "@cloudscape-design/component-toolkit/internal";

import { renderMarker } from "../../internal/components/series-marker";
import AsyncStore from "../../internal/utils/async-store";
import { SVGRendererPool } from "../../internal/utils/utils";
import { Rect, RenderTooltipProps } from "../interfaces-core";
import * as Styles from "../styles";
import { getGroupRect, getPointRect, isXThreshold } from "../utils";
import { ChartAPIContext } from "./chart-context";

export interface ReactiveTooltipState {
  visible: boolean;
  pinned: boolean;
  point: null | Highcharts.Point;
  group: Highcharts.Point[];
}

// Chart helper that implements tooltip placement logic and cursors.
export class ChartExtraTooltip extends AsyncStore<ReactiveTooltipState> {
  private context: ChartAPIContext;
  constructor(context: ChartAPIContext) {
    super({ visible: false, pinned: false, point: null, group: [] });
    this.context = context;
  }
  private cursor = new HighlightCursorCartesian();
  private targetTrack: null | Highcharts.SVGElement = null;
  private groupTrack: null | Highcharts.SVGElement = null;

  // The targetElement.element can get invalidated by Highcharts, so we cannot use
  // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
  // The getTrack function ensures the latest element reference is given on each request.
  public getTargetTrack = () => (this.targetTrack?.element ?? null) as null | SVGElement;
  public getGroupTrack = () => (this.groupTrack?.element ?? null) as null | SVGElement;

  public onChartDestroy() {
    this.cursor.destroy();
    this.targetTrack?.destroy();
    this.groupTrack?.destroy();
  }

  public setTooltipPoint(point: Highcharts.Point, matchingGroup: Highcharts.Point[]) {
    this.set(() => ({ visible: true, pinned: false, point, group: matchingGroup }));
  }

  public setTooltipGroup(group: Highcharts.Point[]) {
    this.set(() => ({ visible: true, pinned: false, point: null, group }));
  }

  public hideTooltip() {
    this.set((prev) => ({ ...prev, visible: false, pinned: false }));
  }

  public pinTooltip() {
    this.set((prev) => ({ ...prev, visible: true, pinned: true }));
  }

  public onRenderTooltip = (props: RenderTooltipProps) => {
    if (this.context.chart().series.some((s) => s.type === "pie")) {
      return this.onRenderTooltipPie(props);
    } else {
      return this.onRenderTooltipCartesian(props);
    }
  };

  public onClearHighlight = () => {
    this.cursor.hide();
    this.targetTrack?.hide();
    this.groupTrack?.hide();
  };

  private onRenderTooltipCartesian = ({ point, group }: RenderTooltipProps) => {
    const pointRect = point ? getPointRect(point) : getPointRect(group[0]);
    const groupRect = getGroupRect(group);
    const hasColumnSeries = this.context.chart().series.some((s) => s.type === "column");
    this.cursor.create(groupRect, point, group, !hasColumnSeries);

    this.targetTrack?.hide();
    this.groupTrack?.hide();
    this.createPointTrack(pointRect);
    this.createGroupTrack(groupRect);
  };

  private onRenderTooltipPie = ({ group }: RenderTooltipProps) => {
    const pointRect = getPieChartTargetPlacement(group[0]);

    this.targetTrack?.hide();
    this.createPointTrack(pointRect);
  };

  private createPointTrack = (pointRect: Rect) => {
    if (!this.targetTrack) {
      this.targetTrack = this.context.chart().renderer.rect().add();
    }
    this.targetTrack
      .attr({
        ...pointRect,
        fill: "transparent",
        zIndex: -1,
        direction: this.isRtl() ? "rtl" : "ltr",
        style: "pointer-events:none",
      })
      .show();
  };

  private createGroupTrack = (groupRect: Rect) => {
    if (!this.groupTrack) {
      this.groupTrack = this.context.chart().renderer.rect().add();
    }
    this.groupTrack
      .attr({
        ...groupRect,
        fill: "transparent",
        zIndex: -1,
        direction: this.isRtl() ? "rtl" : "ltr",
        style: "pointer-events:none",
      })
      .show();
  };

  // We set the direction to target element so that the direction check done by the tooltip
  // is done correctly. Without that, the asserted target direction always results to "ltr".
  private isRtl() {
    return getIsRtl(this.context.chart().container.parentElement);
  }
}

class HighlightCursorCartesian {
  private cursorElementsPool = new SVGRendererPool();
  private markerElementsPool = new SVGRendererPool();

  public create(target: Rect, point: null | Highcharts.Point, group: Highcharts.Point[], showCursor: boolean) {
    this.hide();

    const chart = group[0]?.series.chart;
    if (!chart) {
      return;
    }

    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    if (showCursor) {
      const cursorAttrs = chart.inverted
        ? {
            x: chart.plotLeft,
            y: chart.plotTop + (target.y - 2 * target.height),
            width: chart.plotWidth,
            height: 1,
          }
        : {
            x: target.x + target.width / 2,
            y: chart.plotTop,
            width: 1,
            height: chart.plotHeight,
          };
      this.cursorElementsPool.rect(chart.renderer, { ...Styles.cursorStyle, ...cursorAttrs }).show();
    }

    const matchedPoints = group.filter(
      (p) => !isXThreshold(p.series) && p.series.type !== "column" && p.series.type !== "errorbar",
    );

    for (const p of matchedPoints) {
      if (p.plotX !== undefined && p.plotY !== undefined) {
        renderMarker(chart, this.markerElementsPool, p, p === point);
      }
    }
  }

  public hide() {
    this.cursorElementsPool.hideAll();
    this.markerElementsPool.hideAll();
  }

  public destroy() {
    this.cursorElementsPool.destroyAll();
    this.markerElementsPool.destroyAll();
  }
}

function getPieChartTargetPlacement(point: Highcharts.Point): Rect {
  // The pie series segments do not provide plotX, plotY to compute the tooltip placement.
  // Instead, there is a `tooltipPos` tuple, which is not covered by TS.
  if ("tooltipPos" in point && Array.isArray(point.tooltipPos)) {
    return { x: point.tooltipPos[0], y: point.tooltipPos[1], width: 0, height: 0 };
  }
  return getPieMiddlePlacement(point);
}

function getPieMiddlePlacement(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  const [relativeX, relativeY, relativeDiameter] = point.series.center;
  const plotLeft = chart.plotLeft;
  const plotTop = chart.plotTop;
  const centerX = plotLeft + (typeof relativeX === "number" ? relativeX : (relativeX / 100) * chart.plotWidth);
  const centerY = plotTop + (typeof relativeY === "number" ? relativeY : (relativeY / 100) * chart.plotHeight);
  const radius =
    (typeof relativeDiameter === "number" ? relativeDiameter : (relativeDiameter / 100) * chart.plotWidth) / 2;
  return { x: centerX, y: centerY - radius, width: 1, height: 2 * radius };
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { renderMarker } from "../../internal/components/series-marker";
import { Rect, RenderTooltipProps } from "../interfaces-core";
import * as Styles from "../styles";
import { getGroupRect, getPointRect, isXThreshold } from "../utils";

// Chart helper that implements tooltip placement logic and cursors.
// It handles cartesian and pie charts.
export class ChartExtraTooltip {
  // The chart is only initialized in the render event. Using any methods before that is not expected.
  private _chart: null | Highcharts.Chart = null;
  public get chart(): Highcharts.Chart {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }
  private cursor = new HighlightCursorCartesian();

  public onChartRender = (chart: Highcharts.Chart) => {
    this._chart = chart;
  };

  public onRenderTooltip = (props: RenderTooltipProps): { pointRect: Rect; groupRect: Rect } => {
    if (this.chart.series.some((s) => s.type === "pie")) {
      return this.onRenderTooltipPie(props);
    } else {
      return this.onRenderTooltipCartesian(props);
    }
  };

  public onClearHighlight = () => {
    this.cursor.destroy();
  };

  private onRenderTooltipCartesian = ({ point, group }: RenderTooltipProps): { pointRect: Rect; groupRect: Rect } => {
    const pointRect = point ? getPointRect(point) : getPointRect(group[0]);
    const groupRect = getGroupRect(group);
    const hasColumnSeries = this.chart.series.some((s) => s.type === "column");
    this.cursor.create(groupRect, point, group, !hasColumnSeries);
    return { pointRect, groupRect };
  };

  private onRenderTooltipPie = ({ group }: RenderTooltipProps): { pointRect: Rect; groupRect: Rect } => {
    const pointRect = getPieChartTargetPlacement(group[0]);
    const groupRect = pointRect;
    return { pointRect, groupRect };
  };
}

class HighlightCursorCartesian {
  private refs: Highcharts.SVGElement[] = [];

  public create(target: Rect, point: null | Highcharts.Point, group: Highcharts.Point[], showCursor: boolean) {
    this.destroy();

    const chart = group[0]?.series.chart;
    if (!chart) {
      return;
    }

    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    if (showCursor) {
      this.refs.push(
        chart.inverted
          ? chart.renderer
              .rect(chart.plotLeft, chart.plotTop + (target.y - 2 * target.height), chart.plotWidth, 1)
              .attr(Styles.cursorStyle)
              .add()
          : chart.renderer
              .rect(target.x + target.width / 2, chart.plotTop, 1, chart.plotHeight)
              .attr(Styles.cursorStyle)
              .add(),
      );
    }

    const matchedPoints = group.filter(
      (p) => !isXThreshold(p.series) && p.series.type !== "column" && p.series.type !== "errorbar",
    );

    for (const p of matchedPoints) {
      if (p.plotX !== undefined && p.plotY !== undefined) {
        this.refs.push(renderMarker(chart, p, p === point));
      }
    }
  }

  public destroy() {
    this.refs.forEach((ref) => ref.destroy());
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

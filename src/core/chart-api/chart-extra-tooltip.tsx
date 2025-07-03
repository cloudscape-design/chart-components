// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import type Highcharts from "highcharts";

import { getIsRtl } from "@cloudscape-design/component-toolkit/internal";

import * as Styles from "../../internal/chart-styles";
import { renderMarker } from "../../internal/components/series-marker/render-marker";
import AsyncStore from "../../internal/utils/async-store";
import { SVGRendererPool, SVGRendererSingle } from "../../internal/utils/renderer-utils";
import { DebouncedCall } from "../../internal/utils/utils";
import { Rect } from "../interfaces";
import { getGroupRect, getPointRect, isXThreshold } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

import testClasses from "../test-classes/styles.css.js";

const TOOLTIP_LAST_DISMISS_DELAY = 250;

// The reactive state is used to propagate updates to the chart tooltip React component. The tooltip
// content is to be derived from the target point and group.
export interface ReactiveTooltipState {
  visible: boolean;
  pinned: boolean;
  point: null | Highcharts.Point;
  group: readonly Highcharts.Point[];
}

// Chart helper that implements tooltip placement logic and cursors.
export class ChartExtraTooltip extends AsyncStore<ReactiveTooltipState> {
  private context: ChartExtraContext;

  // The tooltip lock is used to prevent tooltip position changes shortly after it was dismissed, to
  // deny its immediate re-appearance in the spot under where the dismiss button was.
  public tooltipLock = false;
  private tooltipLockCall = new DebouncedCall();
  private setTooltipLock = () => {
    if (this.get().pinned) {
      this.tooltipLock = true;
      this.tooltipLockCall.call(() => (this.tooltipLock = false), TOOLTIP_LAST_DISMISS_DELAY);
    }
  };

  // The cursor is a vertical or horizontal (in inverted charts) line and hollow or filled markers,
  // shown in cartesian charts on top of the matched group or point.
  private cursor = new HighlightCursorCartesian();
  // The track elements are invisible rectangles, compted for the given target point or group.
  // The target track is used for the "target" tooltip placement. The group track is used for
  // the "middle" and "outside" tooltip placement.
  private targetTrack = new SVGRendererSingle();
  private groupTrack = new SVGRendererSingle();

  constructor(context: ChartExtraContext) {
    super({ visible: false, pinned: false, point: null, group: [] });
    this.context = context;
  }

  // The targetElement.element can get invalidated by Highcharts, so we cannot use
  // trackRef.current = targetElement.element as it might get invalidated unexpectedly.
  // The getTrack function ensures the latest element reference is given on each request.
  public getTargetTrack = () => (this.targetTrack.element?.element ?? null) as null | SVGElement;
  public getGroupTrack = () => (this.groupTrack.element?.element ?? null) as null | SVGElement;

  public onChartDestroy() {
    this.cursor.destroy();
    this.targetTrack.destroy();
    this.groupTrack.destroy();
  }

  public showTooltipOnPoint(point: Highcharts.Point, matchingGroup: readonly Highcharts.Point[], ignoreLock = false) {
    if (!this.tooltipLock || ignoreLock) {
      this.set(() => ({ visible: true, pinned: false, point, group: matchingGroup }));
      this.onRenderTooltip({ point, group: matchingGroup });
    }
  }

  public showTooltipOnGroup(group: readonly Highcharts.Point[], ignoreLock = false) {
    if (!this.tooltipLock || ignoreLock) {
      this.set(() => ({ visible: true, pinned: false, point: null, group }));
      this.onRenderTooltip({ point: null, group });
    }
  }

  public hideTooltip() {
    this.cursor.hide();
    this.targetTrack.hide();
    this.groupTrack.hide();
    this.setTooltipLock();
    this.set((prev) => ({ ...prev, visible: false, pinned: false }));
  }

  public pinTooltip() {
    if (this.context.settings.tooltipEnabled) {
      this.set((prev) => ({ ...prev, visible: true, pinned: true }));
    }
  }

  private onRenderTooltip = (props: { point: null | Highcharts.Point; group: readonly Highcharts.Point[] }) => {
    if (this.context.chart().series.some((s) => s.type === "pie")) {
      return this.onRenderTooltipPie(props.group[0]);
    } else {
      return this.onRenderTooltipCartesian(props);
    }
  };

  private onRenderTooltipCartesian = ({
    point,
    group,
  }: {
    point: null | Highcharts.Point;
    group: readonly Highcharts.Point[];
  }) => {
    const pointRect = point ? getPointRect(point) : getGroupRect(group.slice(0, 1));
    const groupRect = getGroupRect(group);
    // The cursor is not shown when column series are present (a UX decision).
    const hasColumnSeries = this.context.chart().series.some((s) => s.type === "column");
    this.cursor.create(groupRect, point, group, !hasColumnSeries);
    this.targetTrack.rect(this.context.chart().renderer, { ...pointRect, ...this.commonTrackAttrs });
    this.groupTrack.rect(this.context.chart().renderer, { ...groupRect, ...this.commonTrackAttrs });
  };

  private onRenderTooltipPie = (point: Highcharts.Point) => {
    // We only create target track for pie chart as pie chart does not support groups.
    // It is also expected that only "target" tooltip position is used for pie charts.
    const pointRect = getPieChartTargetPlacement(point);
    this.targetTrack.rect(this.context.chart().renderer, { ...pointRect, ...this.commonTrackAttrs });
  };

  private get commonTrackAttrs() {
    return { fill: "transparent", zIndex: -1, style: "pointer-events:none", direction: this.direction };
  }

  // We compute the direction from the chart container and then explicitly set it to the track
  // elements, as otherwise the direction check done for track elements always results to "ltr".
  private get direction() {
    const isRtl = getIsRtl(this.context.chart().container.parentElement);
    return isRtl ? "rtl" : "ltr";
  }
}

// A helper class to draw the cursor elements (include cursor line and matched points markers).
class HighlightCursorCartesian {
  private lineElement = new SVGRendererSingle();
  private markerElementsPool = new SVGRendererPool();

  public create(target: Rect, point: null | Highcharts.Point, group: readonly Highcharts.Point[], showLine: boolean) {
    this.hide();
    const chart = group[0]?.series.chart;
    if (!chart) {
      return;
    }
    if (showLine) {
      // The cursor line is rendered orthogonally to the x axis (when the chart is inverted, the line is rendered horizontally).
      // The line is 1px thick, and is rendered through the center of the target's rect.
      const lineAttrs = chart.inverted
        ? {
            x: chart.plotLeft,
            y: chart.plotTop + target.y - target.height - 1,
            width: chart.plotWidth,
            height: 1,
          }
        : {
            x: target.x + target.width / 2,
            y: chart.plotTop,
            width: 1,
            height: chart.plotHeight,
          };
      this.lineElement.rect(chart.renderer, { ...Styles.cursorLine, ...lineAttrs });
    }
    for (const p of group.filter(this.isPointEligibleForMarker)) {
      if (p.plotX !== undefined && p.plotY !== undefined) {
        const selected = p === point;
        const className = clsx(testClasses["highlight-marker"], selected && testClasses["highlight-marker-selected"]);
        renderMarker(chart, this.markerElementsPool, p, selected, className);
      }
    }
  }

  public hide() {
    this.lineElement.hide();
    this.markerElementsPool.hideAll();
  }

  public destroy() {
    this.lineElement.destroy();
    this.markerElementsPool.destroyAll();
  }

  private isPointEligibleForMarker = (point: Highcharts.Point) => {
    return !isXThreshold(point.series) && point.series.type !== "column" && point.series.type !== "errorbar";
  };
}

function getPieChartTargetPlacement(point: Highcharts.Point): Rect {
  // The pie series segments do not provide plotX, plotY to compute the tooltip placement.
  // Instead, there is a `tooltipPos` tuple, which is not covered by TS.
  // See: https://github.com/highcharts/highcharts/issues/23118.
  if ("tooltipPos" in point && Array.isArray(point.tooltipPos)) {
    return { x: point.tooltipPos[0], y: point.tooltipPos[1], width: 0, height: 0 };
  }
  // We use the alternative, middle, tooltip placement as a fallback, in case the undocumented "tooltipPos"
  // is no longer available in the point.
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

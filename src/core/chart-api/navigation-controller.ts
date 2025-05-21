// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex, handleKey, KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import * as Styles from "../styles";
import {
  findFirstGroup,
  findFirstPointInSeries,
  findLastGroup,
  findLastPointInSeries,
  findMatchingGroup,
  findNextGroup,
  findNextPointInSeries,
  findPrevGroup,
  findPrevPointInSeries,
  getGroupRect,
  getPointRect,
} from "../utils";

export interface NavigationControllerHandlers {
  onFocusChart(): void;
  onFocusPoint(point: Highcharts.Point): void;
  onFocusGroup(point: Highcharts.Point): void;
  onBlur(): void;
  onActivatePoint(point: Highcharts.Point): void;
  onActivateGroup(point: Highcharts.Point): void;
}

export type FocusedState = FocusedStateChart | FocusedStateGroup | FocusedStatePoint;

interface FocusedStateChart {
  type: "chart";
}
interface FocusedStateGroup {
  type: "group";
  point: Highcharts.Point;
}
interface FocusedStatePoint {
  type: "point";
  point: Highcharts.Point;
}

// Navigation controller handles focus behavior and keyboard navigation for all charts.
// When the chart is first focused, the focus lands on the chart plot. Once navigation is engaged,
// the focus can land either on the group of points matched by X value, or on a specific point.
// In either case, there is always some point that is considered highlighted.
// The focused X value and point are stored so that navigating back to the chart will focus the previously
// focused point. If the stored point no longer belongs to the chart the focus falls back to the chart plot.
export class NavigationController {
  private chart: null | Highcharts.Chart = null;
  private handlers: NavigationControllerHandlers;
  private focusOutline: null | FocusOutline = null;
  private focusCaptureEl: null | HTMLElement = null;
  private focusedState: null | FocusedState = null;

  constructor(handlers: NavigationControllerHandlers) {
    this.handlers = handlers;
  }

  public init(chart: Highcharts.Chart) {
    this.chart = chart;
    this.focusOutline = new FocusOutline(chart);
  }

  private get safe() {
    if (!this.chart || !this.focusOutline) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return { chart: this.chart, focusOutline: this.focusOutline };
  }

  // This function is used as React ref on the focus capture element, positioned right before the chart plot in the DOM.
  // Once the element reference is obtained, we assign the required event listeners directly to the element.
  // That is done for simplicity to avoid passing React event handlers down to the element.
  public setFocusCapture = (element: null | HTMLElement) => {
    if (this.focusCaptureEl) {
      this.focusCaptureEl.removeEventListener("focus", this.onFocus);
      this.focusCaptureEl.removeEventListener("blur", this.onBlur);
      this.focusCaptureEl.removeEventListener("keydown", this.onKeyDown);
    }

    this.focusCaptureEl = element;

    if (this.focusCaptureEl) {
      this.focusCaptureEl.addEventListener("focus", this.onFocus);
      this.focusCaptureEl.addEventListener("blur", this.onBlur);
      this.focusCaptureEl.addEventListener("keydown", this.onKeyDown);
    }
  };

  // Casting focus to the capture element dispatches it to the previously focused element or the chart.
  // This is used to restore focus after the tooltip is dismissed.
  public focusCapture() {
    this.focusCaptureEl?.focus();
  }

  private onFocus = () => {
    this.focusCurrent();
  };

  private onBlur = () => {
    this.safe.focusOutline.hide();
    this.handlers.onBlur();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (
      [
        KeyCode.up,
        KeyCode.down,
        KeyCode.left,
        KeyCode.right,
        KeyCode.enter,
        KeyCode.escape,
        KeyCode.home,
        KeyCode.end,
      ].includes(event.keyCode)
    ) {
      event.preventDefault();
    }
    if (this.focusedState && this.focusedState.type === "group") {
      this.onKeyDownGroup(event, this.focusedState.point);
    } else if (this.focusedState && this.focusedState.type === "point") {
      this.onKeyDownPoint(event, this.focusedState.point);
    } else {
      this.onKeyDownChart(event);
    }
  };

  private onKeyDownChart = (event: KeyboardEvent) => {
    handleKey(event as any, {
      onActivate: () => this.moveToFirstGroup(),
      onInlineStart: () => this.moveToLastGroup(),
      onInlineEnd: () => this.moveToFirstGroup(),
      onBlockStart: () => this.moveToLastGroup(),
      onBlockEnd: () => this.moveToFirstGroup(),
      onHome: () => this.moveToFirstGroup(),
      onEnd: () => this.moveToLastGroup(),
    });
  };

  private onKeyDownGroup = (event: KeyboardEvent, point: Highcharts.Point) => {
    const i = !!this.chart?.inverted;
    handleKey(event as any, {
      onActivate: () => this.activateGroup(point),
      onEscape: () => this.moveToChart(),
      onInlineStart: () => (i ? this.moveToLastInGroup(point) : this.moveToPrevGroup(point)),
      onInlineEnd: () => (i ? this.moveToFirstInGroup(point) : this.moveToNextGroup(point)),
      onBlockStart: () => (i ? this.moveToPrevGroup(point) : this.moveToLastInGroup(point)),
      onBlockEnd: () => (i ? this.moveToNextGroup(point) : this.moveToFirstInGroup(point)),
      onHome: () => this.moveToFirstGroup(),
      onEnd: () => this.moveToLastGroup(),
    });
  };

  private onKeyDownPoint = (event: KeyboardEvent, point: Highcharts.Point) => {
    const i = !!this.chart?.inverted;
    handleKey(event as any, {
      onActivate: () => this.activatePoint(point),
      onEscape: () => this.moveToParentGroup(point),
      onInlineEnd: () => (i ? this.moveToNextInGroup(point) : this.moveToNextInSeries(point)),
      onInlineStart: () => (i ? this.moveToPrevInGroup(point) : this.moveToPrevInSeries(point)),
      onBlockEnd: () => (i ? this.moveToNextInSeries(point) : this.moveToNextInGroup(point)),
      onBlockStart: () => (i ? this.moveToPrevInSeries(point) : this.moveToPrevInGroup(point)),
      onHome: () => this.moveToFirstInSeries(point),
      onEnd: () => this.moveToLastInSeries(point),
    });
  };

  private moveToFirstGroup() {
    this.focusGroup(findFirstGroup(this.safe.chart));
  }

  private moveToLastGroup() {
    this.focusGroup(findLastGroup(this.safe.chart));
  }

  private moveToNextGroup(point: Highcharts.Point) {
    this.focusGroup(findNextGroup(point));
  }

  private moveToPrevGroup(point: Highcharts.Point) {
    this.focusGroup(findPrevGroup(point));
  }

  private moveToParentGroup(point: Highcharts.Point) {
    const group = findMatchingGroup(point);
    if (group.length > 0 && group[0].series.type !== "pie") {
      this.focusGroup(group);
    } else {
      this.focusChart();
    }
  }

  private moveToChart() {
    this.focusChart();
  }

  private moveToFirstInGroup(point: Highcharts.Point) {
    const group = findMatchingGroup(point);
    this.focusPoint(group[0]);
  }

  private moveToLastInGroup(point: Highcharts.Point) {
    const group = findMatchingGroup(point);
    this.focusPoint(group[group.length - 1]);
  }

  private moveToPrevInGroup(point: Highcharts.Point) {
    const group = findMatchingGroup(point);
    const pointIndex = group.indexOf(point);
    this.focusPoint(group[circleIndex(pointIndex - 1, [0, group.length - 1])]);
  }

  private moveToNextInGroup(point: Highcharts.Point) {
    const group = findMatchingGroup(point);
    const pointIndex = group.indexOf(point);
    this.focusPoint(group[circleIndex(pointIndex + 1, [0, group.length - 1])]);
  }

  private moveToFirstInSeries(point: Highcharts.Point) {
    this.focusPoint(findFirstPointInSeries(point));
  }

  private moveToLastInSeries(point: Highcharts.Point) {
    this.focusPoint(findLastPointInSeries(point));
  }

  private moveToNextInSeries(point: Highcharts.Point) {
    this.focusPoint(findNextPointInSeries(point));
  }

  private moveToPrevInSeries(point: Highcharts.Point) {
    this.focusPoint(findPrevPointInSeries(point));
  }

  private activateGroup(point: Highcharts.Point) {
    this.handlers.onActivateGroup(point);
  }

  private activatePoint(point: Highcharts.Point) {
    this.handlers.onActivatePoint(point);
  }

  private focusCurrent() {
    if (!this.focusedState || this.focusedState.type === "chart") {
      this.focusChart();
    } else if (this.focusedState.type === "group") {
      this.focusGroup(findMatchingGroup(this.focusedState.point));
    } else {
      this.focusPoint(this.focusedState.point);
    }
  }

  private focusChart = () => {
    this.focusedState = { type: "chart" };
    this.safe.focusOutline.showChartOutline();
    this.handlers.onFocusChart();
  };

  private focusGroup(group: Highcharts.Point[]) {
    if (group.length === 0) {
      this.focusChart();
    } else if (group[0].series.type === "pie") {
      this.focusPoint(group[0]);
    } else {
      this.focusedState = { type: "group", point: group[0] };
      this.safe.focusOutline.showXOutline(getGroupRect(group));
      this.handlers.onFocusGroup(group[0]);
    }
  }

  private focusPoint(point?: null | Highcharts.Point) {
    if (point) {
      this.focusedState = { type: "point", point };
      this.safe.focusOutline.showPointOutline(getPointRect(point));
      this.handlers.onFocusPoint(point);
    } else {
      this.focusChart();
    }
  }
}

class FocusOutline {
  private chart: Highcharts.Chart;
  private refs: Highcharts.SVGElement[] = [];

  constructor(chart: Highcharts.Chart) {
    this.chart = chart;
  }

  public showChartOutline = () => {
    const [x, y, width, height] = [
      this.chart.plotLeft,
      this.chart.plotTop,
      this.chart.plotWidth,
      this.chart.plotHeight,
    ];
    this.showRectOutline({ x: x + 1, y: y + 1, width: width - 2, height: height - 2 });
  };

  public showXOutline = (rect: Rect) => {
    this.showRectOutline({ x: rect.x - 3, y: rect.y - 3, width: rect.width + 6, height: rect.height + 6 });
  };

  public showPointOutline = (rect: Rect) => {
    this.showRectOutline({ x: rect.x - 2, y: rect.y - 2, width: rect.width + 4, height: rect.height + 4 });
  };

  private showRectOutline = (rect: Rect) => {
    this.hide();
    this.refs.push(
      this.chart.renderer.rect(rect.x, rect.y, rect.width, rect.height).attr(Styles.navigationFocusOutlineStyle).add(),
    );
  };

  public hide() {
    this.refs.forEach((ref) => ref.destroy());
  }
}

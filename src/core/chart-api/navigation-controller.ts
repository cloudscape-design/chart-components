// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex, handleKey, KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import * as Styles from "../styles";
import { getGroupRect, getPointRect } from "../utils";
import { ChartExtra } from "./chart-extra";

export interface NavigationControllerHandlers {
  onFocusChart(): void;
  onFocusPoint(point: Highcharts.Point, group: Highcharts.Point[]): void;
  onFocusGroup(group: Highcharts.Point[]): void;
  onBlur(): void;
  onActivatePoint(point: Highcharts.Point, group: Highcharts.Point[]): void;
  onActivateGroup(group: Highcharts.Point[]): void;
}

export type FocusedState = FocusedStateChart | FocusedStateGroup | FocusedStatePoint;

interface FocusedStateChart {
  type: "chart";
}
interface FocusedStateGroup {
  type: "group";
  group: Highcharts.Point[];
}
interface FocusedStatePoint {
  type: "point";
  point: Highcharts.Point;
  group: Highcharts.Point[];
}

// Navigation controller handles focus behavior and keyboard navigation for all charts.
// When the chart is first focused, the focus lands on the chart plot. Once navigation is engaged,
// the focus can land either on the group of points matched by X value, or on a specific point.
// In either case, there is always some point that is considered highlighted.
// The focused X value and point are stored so that navigating back to the chart will focus the previously
// focused point. If the stored point no longer belongs to the chart the focus falls back to the chart plot.
export class NavigationController {
  private chartExtra: ChartExtra;
  private focusOutline: FocusOutline;
  private handlers: NavigationControllerHandlers;
  private applicationEl: null | HTMLElement = null;
  private focusedState: null | FocusedState = null;
  private fakeFocus = false;

  constructor(chartExtra: ChartExtra, handlers: NavigationControllerHandlers) {
    this.chartExtra = chartExtra;
    this.focusOutline = new FocusOutline(chartExtra);
    this.handlers = handlers;
  }

  private get chart() {
    return this.chartExtra.chart;
  }

  // This function is used as React ref on the application element, positioned right before the chart plot in the DOM.
  // Once the element reference is obtained, we assign the required event listeners directly to the element.
  // That is done for simplicity to avoid passing React event handlers down to the element.
  public setApplication = (element: null | HTMLElement) => {
    if (this.applicationEl) {
      this.applicationEl.removeEventListener("focus", this.onFocus);
      this.applicationEl.removeEventListener("blur", this.onBlur);
      this.applicationEl.removeEventListener("keydown", this.onKeyDown);
    }

    this.applicationEl = element;

    if (this.applicationEl) {
      this.applicationEl.addEventListener("focus", this.onFocus);
      this.applicationEl.addEventListener("blur", this.onBlur);
      this.applicationEl.addEventListener("keydown", this.onKeyDown);
    }
  };

  // Casting focus to the application element dispatches it to the previously focused element or the chart.
  // This is used to restore focus after the tooltip is dismissed.
  public focusApplication(point: null | Highcharts.Point, group: Highcharts.Point[]) {
    this.focusedState = point ? { type: "point", point, group } : { type: "group", group };
    this.applicationEl?.focus();
  }

  public announceChart(ariaLabel: string) {
    this.announce({ role: "application", "aria-label": ariaLabel });
  }

  public announceElement(ariaLabel: string, pinned: boolean) {
    this.announce({ role: "button", "aria-label": ariaLabel, "aria-haspopup": true, "aria-expanded": pinned });
  }

  private announce(elementProps: React.ButtonHTMLAttributes<unknown>) {
    if (!this.applicationEl) {
      return;
    }

    // Remove prev attributes.
    for (const attributeName of this.applicationEl.getAttributeNames()) {
      if (attributeName === "role" || attributeName.slice(0, 4) === "aria") {
        this.applicationEl.removeAttribute(attributeName);
      }
    }

    // Copy new attributes.
    for (const [attributeName, attributeValue] of Object.entries(elementProps)) {
      this.applicationEl.setAttribute(attributeName, `${attributeValue}`);
    }

    this.fakeFocus = true;

    // Re-attach and re-focus application element to trigger a screen-reader announcement.
    const container = this.applicationEl.parentElement!;
    container.removeChild(this.applicationEl);
    container.appendChild(this.applicationEl);
    this.applicationEl.focus({ preventScroll: true });

    setTimeout(() => (this.fakeFocus = false), 0);
  }

  private onFocus = () => {
    if (!this.fakeFocus) {
      this.focusCurrent();
    }
  };

  private onBlur = () => {
    if (!this.fakeFocus) {
      this.focusOutline.hide();
      this.handlers.onBlur();
    }
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
        KeyCode.pageUp,
        KeyCode.pageDown,
        KeyCode.home,
        KeyCode.end,
      ].includes(event.keyCode)
    ) {
      event.preventDefault();
    }
    if (this.focusedState && this.focusedState.type === "group") {
      this.onKeyDownGroup(event, this.focusedState.group);
    } else if (this.focusedState && this.focusedState.type === "point") {
      this.onKeyDownPoint(event, this.focusedState.point, this.focusedState.group);
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

  private onKeyDownGroup = (event: KeyboardEvent, group: Highcharts.Point[]) => {
    const i = !!this.chart?.inverted;
    handleKey(event as any, {
      onActivate: () => this.activateGroup(group),
      onEscape: () => this.moveToChart(),
      onInlineStart: () => (i ? this.moveToLastInGroup(group) : this.moveToPrevGroup(group)),
      onInlineEnd: () => (i ? this.moveToFirstInGroup(group) : this.moveToNextGroup(group)),
      onBlockStart: () => (i ? this.moveToPrevGroup(group) : this.moveToLastInGroup(group)),
      onBlockEnd: () => (i ? this.moveToNextGroup(group) : this.moveToFirstInGroup(group)),
      onPageDown: () => this.moveToNextPageGroup(group),
      onPageUp: () => this.moveToPrevPageGroup(group),
      onHome: () => this.moveToFirstGroup(),
      onEnd: () => this.moveToLastGroup(),
    });
  };

  private onKeyDownPoint = (event: KeyboardEvent, point: Highcharts.Point, group: Highcharts.Point[]) => {
    const i = !!this.chart?.inverted;
    handleKey(event as any, {
      onActivate: () => this.activatePoint(point, group),
      onEscape: () => this.moveToParentGroup(point),
      onInlineEnd: () => (i ? this.moveToPrevInGroup(point) : this.moveToNextInSeries(point)),
      onInlineStart: () => (i ? this.moveToNextInGroup(point) : this.moveToPrevInSeries(point)),
      onBlockEnd: () => (i ? this.moveToNextInSeries(point) : this.moveToNextInGroup(point)),
      onBlockStart: () => (i ? this.moveToPrevInSeries(point) : this.moveToPrevInGroup(point)),
      onPageDown: () => this.moveToNextPageInSeries(point),
      onPageUp: () => this.moveToPrevPageInSeries(point),
      onHome: () => this.moveToFirstInSeries(point),
      onEnd: () => this.moveToLastInSeries(point),
    });
  };

  private moveToFirstGroup() {
    this.focusGroup(this.chartExtra.findFirstGroup());
  }

  private moveToLastGroup() {
    this.focusGroup(this.chartExtra.findLastGroup());
  }

  private moveToNextGroup(group: Highcharts.Point[]) {
    const nextGroup = group[0] ? this.chartExtra.findNextGroup(group[0]) : [];
    this.focusGroup(nextGroup);
  }

  private moveToPrevGroup(group: Highcharts.Point[]) {
    const prevGroup = group[0] ? this.chartExtra.findPrevGroup(group[0]) : [];
    this.focusGroup(prevGroup);
  }

  private moveToParentGroup(point: Highcharts.Point) {
    const group = this.chartExtra.findMatchingGroup(point);
    if (group.length > 0 && group[0].series.type !== "pie") {
      this.focusGroup(group);
    } else {
      this.focusChart();
    }
  }

  private moveToChart() {
    this.focusChart();
  }

  private moveToFirstInGroup(group: Highcharts.Point[]) {
    this.focusPoint(group[0], group);
  }

  private moveToLastInGroup(group: Highcharts.Point[]) {
    this.focusPoint(group[group.length - 1], group);
  }

  private moveToPrevInGroup(point: Highcharts.Point) {
    const group = this.chartExtra.findMatchingGroup(point);
    const pointIndex = group.indexOf(point);
    this.focusPoint(group[circleIndex(pointIndex - 1, [0, group.length - 1])], group);
  }

  private moveToNextInGroup(point: Highcharts.Point) {
    const group = this.chartExtra.findMatchingGroup(point);
    const pointIndex = group.indexOf(point);
    this.focusPoint(group[circleIndex(pointIndex + 1, [0, group.length - 1])], group);
  }

  private moveToFirstInSeries(point: Highcharts.Point) {
    const firstPoint = this.chartExtra.findFirstPointInSeries(point);
    if (firstPoint) {
      this.focusPoint(firstPoint, this.chartExtra.findMatchingGroup(firstPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToLastInSeries(point: Highcharts.Point) {
    const lastPoint = this.chartExtra.findLastPointInSeries(point);
    if (lastPoint) {
      this.focusPoint(lastPoint, this.chartExtra.findMatchingGroup(lastPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToNextInSeries(point: Highcharts.Point) {
    const nextPoint = this.chartExtra.findNextPointInSeries(point);
    if (nextPoint) {
      this.focusPoint(nextPoint, this.chartExtra.findMatchingGroup(nextPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToPrevInSeries(point: Highcharts.Point) {
    const prevPoint = this.chartExtra.findPrevPointInSeries(point);
    if (prevPoint) {
      this.focusPoint(prevPoint, this.chartExtra.findMatchingGroup(prevPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToNextPageGroup(group: Highcharts.Point[]) {
    const nextPageGroup = group[0] ? this.chartExtra.findNextPageGroup(group[0]) : [];
    this.focusGroup(nextPageGroup);
  }

  private moveToPrevPageGroup(group: Highcharts.Point[]) {
    const prevPageGroup = group[0] ? this.chartExtra.findPrevPageGroup(group[0]) : [];
    this.focusGroup(prevPageGroup);
  }

  private moveToNextPageInSeries(point: Highcharts.Point) {
    const nextPagePoint = this.chartExtra.findNextPagePointInSeries(point);
    if (nextPagePoint) {
      this.focusPoint(nextPagePoint, this.chartExtra.findMatchingGroup(nextPagePoint));
    } else {
      this.focusChart();
    }
  }

  private moveToPrevPageInSeries(point: Highcharts.Point) {
    const prevPagePoint = this.chartExtra.findPrevPagePointInSeries(point);
    if (prevPagePoint) {
      this.focusPoint(prevPagePoint, this.chartExtra.findMatchingGroup(prevPagePoint));
    } else {
      this.focusChart();
    }
  }

  private activateGroup(group: Highcharts.Point[]) {
    this.handlers.onActivateGroup(group);
  }

  private activatePoint(point: Highcharts.Point, group: Highcharts.Point[]) {
    this.handlers.onActivatePoint(point, group);
  }

  private focusCurrent() {
    if (!this.focusedState || this.focusedState.type === "chart") {
      this.focusChart();
    } else if (this.focusedState.type === "group") {
      this.focusGroup(this.chartExtra.findMatchingGroup(this.focusedState.group[0]));
    } else {
      this.focusPoint(this.focusedState.point, this.focusedState.group);
    }
  }

  private focusChart = () => {
    this.focusedState = { type: "chart" };
    this.focusOutline.showChartOutline();
    this.handlers.onFocusChart();
  };

  private focusGroup(group: Highcharts.Point[]) {
    if (group.length === 0) {
      this.focusChart();
    } else if (group[0].series.type === "pie") {
      this.focusPoint(group[0] ?? null, group);
    } else {
      this.focusedState = { type: "group", group };
      this.focusOutline.showXOutline(getGroupRect(group));
      this.handlers.onFocusGroup(group);
    }
  }

  private focusPoint(point: null | Highcharts.Point, group: Highcharts.Point[]) {
    if (point) {
      this.focusedState = { type: "point", point, group };
      this.focusOutline.showPointOutline(getPointRect(point));
      this.handlers.onFocusPoint(point, group);
    } else {
      this.focusChart();
    }
  }
}

class FocusOutline {
  private chartExtra: ChartExtra;
  private refs: Highcharts.SVGElement[] = [];

  constructor(chartExtra: ChartExtra) {
    this.chartExtra = chartExtra;
  }

  private get chart() {
    return this.chartExtra.chart;
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
    this.showRectOutline({ x: rect.x - 4, y: rect.y - 4, width: rect.width + 8, height: rect.height + 8 });
  };

  public showPointOutline = (rect: Rect) => {
    this.showRectOutline({ x: rect.x - 6, y: rect.y - 6, width: rect.width + 12, height: rect.height + 12 });
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import {
  circleIndex,
  getIsRtl,
  handleKey as toolkitHandleKey,
  KeyCode,
} from "@cloudscape-design/component-toolkit/internal";

import * as Styles from "../../internal/chart-styles";
import { SVGRendererPool } from "../../internal/utils/renderer-utils";
import { Rect } from "../interfaces";
import { getGroupRect, getPointRect, isPointVisible, isXThreshold } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

// In charts with many data points one can navigate faster by using Page Down/Up keys that
// navigate PAGE_SIZE_PERCENTAGE of the points forwards or backwards.
const PAGE_SIZE_PERCENTAGE = 0.05;

export interface ChartExtraNavigationHandlers {
  onFocusChart(): void;
  onFocusPoint(point: Highcharts.Point, group: readonly Highcharts.Point[]): void;
  onFocusGroup(group: readonly Highcharts.Point[]): void;
  onBlur(): void;
  onActivatePoint(point: Highcharts.Point, group: readonly Highcharts.Point[]): void;
  onActivateGroup(group: readonly Highcharts.Point[]): void;
}

export type FocusedState = FocusedStateChart | FocusedStateGroup | FocusedStatePoint;

interface FocusedStateChart {
  type: "chart";
}
interface FocusedStateGroup {
  type: "group";
  group: readonly Highcharts.Point[];
}
interface FocusedStatePoint {
  type: "point";
  point: Highcharts.Point;
  group: readonly Highcharts.Point[];
}

// Navigation controller handles focus behavior and keyboard navigation for all charts.
// When the chart is first focused, the focus lands on the chart plot. Once navigation is engaged,
// the focus can land either on the group of points matched by X value, or on a specific point.
// The focused X value and point are stored so that navigating back to the chart will focus the previously
// focused point. If the stored point no longer belongs to the chart the focus falls back to the chart plot.
export class ChartExtraNavigation {
  private context: ChartExtraContext;
  private handlers: ChartExtraNavigationHandlers;
  private focusOutline: FocusOutline;
  // The application element is a dom element with role="application", rendered right before the chart plot.
  // When the application element is in focus, the keyboard navigation is possible. Upon using navigation commands,
  // we bring the visible focus state to the chart elements, such as points and groups of points. The last visible
  // focus state is persisted.
  private applicationElement: null | HTMLElement = null;
  private focusedState: null | FocusedState = null;
  private ignoreFocus = false;

  constructor(context: ChartExtraContext, handlers: ChartExtraNavigationHandlers) {
    this.context = context;
    this.handlers = handlers;
    this.focusOutline = new FocusOutline(context);
  }

  public onChartDestroy() {
    this.focusOutline.destroy();
  }

  // This function is used as React ref on the application element, positioned right before the chart plot in the DOM.
  // Once the element reference is obtained, we assign the required event listeners directly to the element.
  // That is done for simplicity to avoid passing React event handlers down to the element.
  public setApplication = (element: null | HTMLElement) => {
    if (this.applicationElement) {
      this.applicationElement.removeEventListener("focus", this.onFocus);
      this.applicationElement.removeEventListener("blur", this.onBlur);
      this.applicationElement.removeEventListener("keydown", this.onKeyDown);
    }

    if (this.context.settings.keyboardNavigationEnabled || !element) {
      this.applicationElement = element;
    }

    if (this.applicationElement) {
      this.applicationElement.addEventListener("focus", this.onFocus);
      this.applicationElement.addEventListener("blur", this.onBlur);
      this.applicationElement.addEventListener("keydown", this.onKeyDown);
    }
  };

  // Casting focus to the application element brings the visible focus state to the chart or last focused
  // chart point or group of points. This is used to restore focus after the tooltip is dismissed.
  public focusApplication(point: null | Highcharts.Point, group: readonly Highcharts.Point[]) {
    if (this.context.settings.keyboardNavigationEnabled) {
      this.focusedState = point ? { type: "point", point, group } : { type: "group", group };
      this.applicationElement?.focus();
    }
  }

  public announceChart(ariaLabel: string) {
    this.announce({ role: "application", "aria-label": ariaLabel });
  }

  public announceElement(ariaLabel: string, pinned: boolean) {
    this.announce({ role: "button", "aria-label": ariaLabel, "aria-haspopup": true, "aria-expanded": pinned });
  }

  // Every time the chart focus is obtained or a navigation action is performed, this needs to be announced
  // to screen-readers. The announcement is made by updating the application element with the attributes of
  // the visually focused element (chart, point, or group), and re-focusing it.
  private announce(elementAttributes: React.ButtonHTMLAttributes<unknown>) {
    if (this.applicationElement) {
      // Remove prev attributes.
      for (const attributeName of this.applicationElement.getAttributeNames()) {
        if (attributeName === "role" || attributeName.slice(0, 4) === "aria") {
          this.applicationElement.removeAttribute(attributeName);
        }
      }
      // Copy new attributes.
      for (const [attributeName, attributeValue] of Object.entries(elementAttributes)) {
        this.applicationElement.setAttribute(attributeName, `${attributeValue}`);
      }
      // Temporarily disable focus/blur event handlers to not respond to the next programmatically
      // cast focus event, which has the only purpose of making the application element announced to
      // the assistive software.
      this.ignoreFocus = true;
      // Re-attach and re-focus application element to trigger a screen-reader announcement.
      const container = this.applicationElement.parentElement!;
      container.removeChild(this.applicationElement);
      container.appendChild(this.applicationElement);
      this.applicationElement.focus({ preventScroll: true });
      // Remove focus lock. The blur and focus events should have already occurred at this point.
      setTimeout(() => (this.ignoreFocus = false), 0);
    }
  }

  // Upon obtaining focus, we show the visible focus state and announce the previously focused element
  // (chart, point, or group). If the previously focused point or group is no longer available, the focus
  // is shown for their respective parent.
  private onFocus = () => {
    if (!this.ignoreFocus) {
      if (!this.focusedState || this.focusedState.type === "chart") {
        this.focusChart();
      } else if (this.focusedState.type === "group") {
        this.focusGroup(this.focusedState.group);
      } else {
        this.focusPoint(this.focusedState.point, this.focusedState.group);
      }
    }
  };

  private onBlur = () => {
    if (!this.ignoreFocus) {
      this.focusOutline.hide();
      this.handlers.onBlur();
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    // The `handleKey` helper we use does not prevent the default keys behavior, so we do it here for
    // all used keyboard commands.
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
    // We execute different actions depending on the current focus target (chart, group, or point).
    // It is expected, that the focused element is still available in the chart.
    if (this.focusedState && this.focusedState.type === "group") {
      this.onKeyDownGroup(event, this.focusedState.group);
    } else if (this.focusedState && this.focusedState.type === "point") {
      this.onKeyDownPoint(event, this.focusedState.point, this.focusedState.group);
    } else {
      this.onKeyDownChart(event);
    }
  };

  private onKeyDownChart = (event: KeyboardEvent) => {
    handleKey(event, {
      onActivate: () => this.moveToFirstGroup(),
      onInlineStart: () => this.moveToLastGroup(),
      onInlineEnd: () => this.moveToFirstGroup(),
      onBlockStart: () => this.moveToLastGroup(),
      onBlockEnd: () => this.moveToFirstGroup(),
      onHome: () => this.moveToFirstGroup(),
      onEnd: () => this.moveToLastGroup(),
    });
  };

  private onKeyDownGroup = (event: KeyboardEvent, group: readonly Highcharts.Point[]) => {
    const i = !!this.context.chart().inverted;
    handleKey(event, {
      onActivate: () => this.activateGroup(group),
      onEscape: () => this.moveToChart(),
      onInlineStart: () => (i ? this.moveToFirstInGroup(group) : this.moveToPrevGroup(group)),
      onInlineEnd: () => (i ? this.moveToLastInGroup(group) : this.moveToNextGroup(group)),
      onBlockStart: () => (i ? this.moveToPrevGroup(group) : this.moveToLastInGroup(group)),
      onBlockEnd: () => (i ? this.moveToNextGroup(group) : this.moveToFirstInGroup(group)),
      onPageDown: () => this.moveToNextPageGroup(group),
      onPageUp: () => this.moveToPrevPageGroup(group),
      onHome: () => this.moveToFirstGroup(),
      onEnd: () => this.moveToLastGroup(),
    });
  };

  private onKeyDownPoint = (event: KeyboardEvent, point: Highcharts.Point, group: readonly Highcharts.Point[]) => {
    const i = !!this.context.chart().inverted;
    handleKey(event, {
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
    this.focusGroup(this.findFirstGroup());
  }

  private moveToLastGroup() {
    this.focusGroup(this.findLastGroup());
  }

  private moveToNextGroup(group: readonly Highcharts.Point[]) {
    const nextGroup = group[0] ? this.findNextGroup(group[0]) : [];
    this.focusGroup(nextGroup);
  }

  private moveToPrevGroup(group: readonly Highcharts.Point[]) {
    const prevGroup = group[0] ? this.findPrevGroup(group[0]) : [];
    this.focusGroup(prevGroup);
  }

  private moveToParentGroup(point: Highcharts.Point) {
    const group = this.findMatchingGroup(point);
    if (group.length > 0 && group[0].series.type !== "pie") {
      this.focusGroup(group);
    } else {
      this.focusChart();
    }
  }

  private moveToChart() {
    this.focusChart();
  }

  private moveToFirstInGroup(group: readonly Highcharts.Point[]) {
    const points = group.filter((p) => !isXThreshold(p.series));
    this.focusPoint(points[0], group);
  }

  private moveToLastInGroup(group: readonly Highcharts.Point[]) {
    const points = group.filter((p) => !isXThreshold(p.series));
    this.focusPoint(points[points.length - 1], group);
  }

  private moveToPrevInGroup(point: Highcharts.Point) {
    const points = this.findMatchingGroup(point).filter((p) => !isXThreshold(p.series));
    const pointIndex = points.indexOf(point);
    this.focusPoint(points[circleIndex(pointIndex - 1, [0, points.length - 1])], points);
  }

  private moveToNextInGroup(point: Highcharts.Point) {
    const points = this.findMatchingGroup(point).filter((p) => !isXThreshold(p.series));
    const pointIndex = points.indexOf(point);
    this.focusPoint(points[circleIndex(pointIndex + 1, [0, points.length - 1])], points);
  }

  private moveToFirstInSeries(point: Highcharts.Point) {
    const firstPoint = this.findFirstPointInSeries(point);
    if (firstPoint) {
      this.focusPoint(firstPoint, this.findMatchingGroup(firstPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToLastInSeries(point: Highcharts.Point) {
    const lastPoint = this.findLastPointInSeries(point);
    if (lastPoint) {
      this.focusPoint(lastPoint, this.findMatchingGroup(lastPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToNextInSeries(point: Highcharts.Point) {
    const nextPoint = this.findNextPointInSeries(point);
    if (nextPoint) {
      this.focusPoint(nextPoint, this.findMatchingGroup(nextPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToPrevInSeries(point: Highcharts.Point) {
    const prevPoint = this.findPrevPointInSeries(point);
    if (prevPoint) {
      this.focusPoint(prevPoint, this.findMatchingGroup(prevPoint));
    } else {
      this.focusChart();
    }
  }

  private moveToNextPageGroup(group: readonly Highcharts.Point[]) {
    const nextPageGroup = group[0] ? this.findNextPageGroup(group[0]) : [];
    this.focusGroup(nextPageGroup);
  }

  private moveToPrevPageGroup(group: readonly Highcharts.Point[]) {
    const prevPageGroup = group[0] ? this.findPrevPageGroup(group[0]) : [];
    this.focusGroup(prevPageGroup);
  }

  private moveToNextPageInSeries(point: Highcharts.Point) {
    const nextPagePoint = this.findNextPagePointInSeries(point);
    if (nextPagePoint) {
      this.focusPoint(nextPagePoint, this.findMatchingGroup(nextPagePoint));
    } else {
      this.focusChart();
    }
  }

  private moveToPrevPageInSeries(point: Highcharts.Point) {
    const prevPagePoint = this.findPrevPagePointInSeries(point);
    if (prevPagePoint) {
      this.focusPoint(prevPagePoint, this.findMatchingGroup(prevPagePoint));
    } else {
      this.focusChart();
    }
  }

  private activateGroup(group: readonly Highcharts.Point[]) {
    this.handlers.onActivateGroup(group);
  }

  private activatePoint(point: Highcharts.Point, group: readonly Highcharts.Point[]) {
    this.handlers.onActivatePoint(point, group);
  }

  private focusChart = () => {
    this.focusedState = { type: "chart" };
    this.focusOutline.chart();
    this.handlers.onFocusChart();
  };

  private focusGroup(group: readonly Highcharts.Point[]) {
    // When the chart is re-focused, the group that was focused before might no longer be valid if its
    // points are no longer visible or were destroyed by Highcharts. In that case we focus the chart as
    // a fallback.
    const visiblePoints = group.filter(isPointVisible);
    if (visiblePoints.length === 0) {
      this.focusChart();
    }
    // In pie charts we only focus points, so moving focus to points and groups is equivalent.
    else if (visiblePoints[0].series.type === "pie") {
      this.focusPoint(visiblePoints[0] ?? null, group);
    }
    // When focusing a group we draw the focus outline around the corresponding group rect, including
    // all points of that group.
    else {
      this.focusedState = { type: "group", group: visiblePoints };
      this.focusOutline.group(getGroupRect(visiblePoints));
      this.handlers.onFocusGroup(visiblePoints);
    }
  }

  private focusPoint(point: null | Highcharts.Point, group: readonly Highcharts.Point[]) {
    // When the chart is re-focused, the point that was focused before might no longer be valid it became
    // hidden or was destroyed by Highcharts. In that case we focus the point's parent group as a fallback.
    if (!point || !isPointVisible(point)) {
      this.focusGroup(group);
    }
    // When focusing a point we draw the focus outline around its corresponding rect, but with different offsets,
    // depending on the point's series type.
    else {
      this.focusedState = { type: "point", point, group };
      this.focusOutline.point(getPointRect(point), point);
      this.handlers.onFocusPoint(point, group);
    }
  }

  private get allX(): number[] {
    return this.context.derived.allX;
  }

  private getAllXInSeries = (series: Highcharts.Series): number[] => {
    return this.context.derived.getAllXInSeries(series);
  };

  private getPointsByX = (x: number): Highcharts.Point[] => {
    return this.context.derived.getPointsByX(x);
  };

  private findMatchingGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    return this.getPointsByX(point.x);
  };

  private findFirstGroup = (): Highcharts.Point[] => {
    return this.getPointsByX(this.allX[0]);
  };

  private findLastGroup = (): Highcharts.Point[] => {
    return this.getPointsByX(this.allX[this.allX.length - 1]);
  };

  private findNextGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextIndex(this.allX, this.allX.indexOf(point.x), 1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  private findPrevGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextIndex(this.allX, this.allX.indexOf(point.x), -1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  private findNextPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextPageIndex(this.allX, this.allX.indexOf(point.x), 1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  private findPrevPageGroup = (point: Highcharts.Point): Highcharts.Point[] => {
    const nextIndex = getNextPageIndex(this.allX, this.allX.indexOf(point.x), -1);
    return this.getPointsByX(this.allX[nextIndex]);
  };

  private findFirstPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    return point.series.data.find((d) => d.x === seriesX[0]) ?? null;
  };

  private findLastPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    return point.series.data.find((d) => d.x === seriesX[seriesX.length - 1]) ?? null;
  };

  private findNextPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !shouldInvertPointsDirection(point) ? 1 : -1;
    const nextIndex = getNextIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  private findPrevPointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !shouldInvertPointsDirection(point) ? -1 : 1;
    const nextIndex = getNextIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  private findNextPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !shouldInvertPointsDirection(point) ? 1 : -1;
    const nextIndex = getNextPageIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };

  private findPrevPagePointInSeries = (point: Highcharts.Point): null | Highcharts.Point => {
    const seriesX = this.getAllXInSeries(point.series);
    const delta = !shouldInvertPointsDirection(point) ? -1 : 1;
    const nextIndex = getNextPageIndex(seriesX, seriesX.indexOf(point.x), delta);
    return point.series.data.find((d) => d.x === seriesX[nextIndex]) ?? null;
  };
}

function handleKey(
  event: KeyboardEvent,
  handlers: {
    onActivate?: () => void;
    onBlockEnd?: () => void;
    onBlockStart?: () => void;
    onDefault?: () => void;
    onEnd?: () => void;
    onEscape?: () => void;
    onHome?: () => void;
    onInlineEnd?: () => void;
    onInlineStart?: () => void;
    onPageDown?: () => void;
    onPageUp?: () => void;
  },
) {
  if (!event.currentTarget) {
    return;
  }
  if (!(event.currentTarget instanceof HTMLElement) && !(event.currentTarget instanceof SVGElement)) {
    return;
  }
  toolkitHandleKey({ keyCode: event.keyCode, currentTarget: event.currentTarget }, handlers);
}

// A helper class to draw the focus outline around given chart elements.
class FocusOutline {
  private context: ChartExtraContext;
  private elementsPool = new SVGRendererPool();

  constructor(context: ChartExtraContext) {
    this.context = context;
  }

  public chart = () => {
    const [x, y, width, height] = [
      this.context.chart().plotLeft,
      this.context.chart().plotTop,
      this.context.chart().plotWidth,
      this.context.chart().plotHeight,
    ];
    this.rect({ x, y, width, height }, Styles.focusOutlineOffsets.chart);
  };

  public group = (rect: Rect) => {
    this.rect(rect, Styles.focusOutlineOffsets.group);
  };

  public point = (rect: Rect, point: Highcharts.Point) => {
    const offsetByType = Styles.focusOutlineOffsets.pointByType[point.series.type];
    const offset = offsetByType ?? Styles.focusOutlineOffsets.point;
    this.rect(rect, offset);
  };

  public hide() {
    this.elementsPool.hideAll();
  }

  public destroy() {
    this.elementsPool.destroyAll();
  }

  private rect = ({ x, y, width, height }: Rect, offset: number) => {
    this.elementsPool.hideAll();
    this.elementsPool.rect(this.context.chart().renderer, {
      x: x - offset,
      y: y - offset,
      width: width + offset * 2,
      height: height + offset * 2,
      ...Styles.navigationFocusOutline,
    });
  };
}

// We do not invert the direction of pie segments when RTL, but swap the left/right keys.
// To offset for that, the prev/next points direction is swapped, too.
function shouldInvertPointsDirection(point: Highcharts.Point) {
  const isRTL = getIsRtl(point.series.chart.container.parentElement);
  return point.series.type === "pie" && isRTL;
}

function getNextIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return circleIndex(pointIndex + delta, [0, array.length - 1]);
}

function getNextPageIndex(array: unknown[], pointIndex: number, delta: -1 | 1): number {
  return Math.min(array.length - 1, Math.max(0, pointIndex + delta * Math.round(array.length * PAGE_SIZE_PERCENTAGE)));
}

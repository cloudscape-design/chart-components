// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { CoreChartProps } from "../../../lib/components/core/interfaces";
import {
  CoreChartTestProps,
  createChartWrapper as getChart,
  getCurrentChart,
  renderChart,
  renderStatefulChart,
} from "./common";
import { zoomMessages } from "./zoom-messages";

import testClasses from "../../../lib/components/core/test-classes/styles.css.js";

type ZoomTestSeries = NonNullable<CoreChartProps.ChartOptions["series"]>;

export const series: ZoomTestSeries = [
  {
    type: "line",
    name: "Requests",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
      { x: 3, y: 25 },
      { x: 4, y: 40 },
    ],
  },
];

export type ZoomTestProps = Omit<CoreChartTestProps, "options"> & {
  series?: ZoomTestSeries;
  xAxis?: CoreChartProps.XAxisOptions;
  inverted?: boolean;
  onChartClick?: () => void;
};

export function renderStatefulZoomChart(props: ZoomTestProps) {
  return renderStatefulChart(getZoomChartProps(props));
}

export function renderZoomChart(props: ZoomTestProps) {
  const { rerender } = renderChart(getZoomChartProps(props));
  return { rerender: (props: ZoomTestProps) => rerender(getZoomChartProps(props)) };
}

function getZoomChartProps({ series: chartSeries = series, xAxis, inverted, onChartClick, ...props }: ZoomTestProps) {
  return {
    highcharts,
    i18nProvider: zoomMessages,
    ...props,
    options: {
      chart: { inverted, events: { click: onChartClick } },
      series: structuredClone(chartSeries),
      xAxis: { min: 0, max: 4, ...xAxis },
    },
  };
}

export const onZoomRangeChange = vi.fn();

export function getOverlay() {
  const cursor = getChart().findZoomCursor()!.getElement() as HTMLElement;
  return {
    band: findZoomSvg("zoom-selection"),
    startDivider: findZoomSvg("zoom-selection-start"),
    cursor,
  };
}

export function isVisible(element: null | Element) {
  if (element instanceof HTMLElement) {
    return element.style.visibility === "visible";
  }
  return !!element && element.getAttribute("visibility") !== "hidden";
}

export function getCursorAttributes() {
  const cursor = getChart().findZoomCursor()!.getElement();
  return {
    min: cursor.getAttribute("aria-valuemin"),
    max: cursor.getAttribute("aria-valuemax"),
    now: cursor.getAttribute("aria-valuenow"),
    text: cursor.getAttribute("aria-valuetext"),
  };
}

export function pointerEventAtValue(type: string, value: number, offset = 0, init: PointerEventInit = {}) {
  const chart = getCurrentChart();
  const pixel = chart.xAxis[0].toPixels(value, false) + offset;
  const horizontal = chart.xAxis[0].horiz !== false;
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    buttons: 1,
    clientX: horizontal ? pixel : chart.plotLeft + chart.plotWidth / 2,
    clientY: horizontal ? chart.plotTop + chart.plotHeight / 2 : pixel,
    ...init,
  });
}

export function dispatchPointer(type: string, value: number, offset = 0, init: PointerEventInit = {}) {
  const event = pointerEventAtValue(type, value, offset, init);
  act(() => {
    getCurrentChart().container.dispatchEvent(event);
  });
}

export function getCursorLeft() {
  return parseFloat(getOverlay().cursor.style.left);
}

export function seriesOfLength(count: number): ZoomTestSeries {
  return [{ type: "line", name: "Requests", data: Array.from({ length: count }, (_, x) => ({ x, y: x })) }];
}

export function enterZoomMode() {
  getChart().findZoomButton()!.click();
}

export function pressCursorKey(keyCode: number, times = 1) {
  for (let i = 0; i < times; i++) {
    getChart().findZoomCursor()!.keydown(keyCode);
  }
}

export function keyboardZoomToIndexes(startIndex: number, endIndex: number) {
  enterZoomMode();
  pressCursorKey(KeyCode.right, startIndex);
  pressCursorKey(KeyCode.enter);
  pressCursorKey(KeyCode.right, endIndex - startIndex);
  pressCursorKey(KeyCode.enter);
}

export function findZoomSvg(className: string): null | SVGElement {
  return getChart().getElement().querySelector(`.${testClasses[className]}`);
}

// The zoomed range is marked with a band and a border at each end, drawn on the plot and read back as x values.
export function getZoomRangeAffordance() {
  const xAxis = getCurrentChart().xAxis[0];
  const band = findZoomSvg("zoom-range");
  const borders = findZoomSvg("zoom-range-borders");
  const toValue = (pixel: number) => Math.round(xAxis.toValue(pixel) * 1000) / 1000;
  return {
    present: !!band && !!borders,
    band: band && {
      from: toValue(Number(band.getAttribute("x"))),
      to: toValue(Number(band.getAttribute("x")) + Number(band.getAttribute("width"))),
    },
    boundaries:
      borders &&
      (borders.getAttribute("d") ?? "")
        .split("M")
        .filter((part) => part.trim())
        .map((part) => toValue(Number(part.trim().split(" ")[0]))),
  };
}

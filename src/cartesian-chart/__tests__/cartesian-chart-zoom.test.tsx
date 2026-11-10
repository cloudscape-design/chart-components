// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { InternalZoomProps } from "../../../lib/components/core/internal-interfaces";
import {
  createChartWrapper as getChart,
  enterZoomMode,
  getXExtremes,
  keyboardZoomToIndexes,
  pressCursorKey,
} from "../../core/__tests__/common";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { zoomMessages } from "../../core/__tests__/zoom-messages";
import { renderCartesianChart } from "./common";

const TEST_TIMEOUT = 15_000;

const series: CartesianChartProps.SeriesOptions[] = [
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

const defaultProps = {
  highcharts,
  i18nProvider: zoomMessages,
  series,
  xAxis: { title: "X", type: "linear" as const, min: 0, max: 4 },
  yAxis: { title: "Y", type: "linear" as const },
};

const onZoomRangeChange = vi.fn();

type ZoomTestProps = Partial<CartesianChartProps> &
  InternalZoomProps & {
    highcharts: typeof highcharts;
    i18nProvider?: Record<string, Record<string, string>>;
  };

function renderZoomChart(props: ZoomTestProps) {
  const { rerender } = renderCartesianChart(props);
  return { rerender: (props: ZoomTestProps) => rerender(props) };
}

function getCursorAttributes() {
  const cursor = getChart().findZoomCursor()!.getElement();
  return {
    min: cursor.getAttribute("aria-valuemin"),
    max: cursor.getAttribute("aria-valuemax"),
    now: cursor.getAttribute("aria-valuenow"),
    text: cursor.getAttribute("aria-valuetext"),
  };
}

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CartesianChart: zoom selection, with other series types", { timeout: TEST_TIMEOUT }, () => {
  test("zooms into two adjacent points without explicit axis bounds", () => {
    renderZoomChart({
      highcharts,
      series: [
        {
          type: "column",
          name: "A",
          data: [
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
          ],
        },
        {
          type: "column",
          name: "B",
          data: [
            { x: 0, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 4 },
            { x: 3, y: 5 },
            { x: 4, y: 6 },
          ],
        },
      ],
      xAxis: { title: "X", type: "linear" as const },
      yAxis: { title: "Y", type: "linear" as const },
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    keyboardZoomToIndexes(1, 2);
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  test("ignores error bar series when collecting cursor stops", () => {
    renderZoomChart({
      highcharts,
      series: [
        {
          type: "line",
          id: "line",
          name: "Line",
          data: [
            { x: 0, y: 10 },
            { x: 10, y: 20 },
            { x: 20, y: 30 },
            { x: 30, y: 25 },
            { x: 40, y: 40 },
          ],
        },
        {
          type: "errorbar",
          linkedTo: "line",
          name: "Error",
          data: [
            { low: 8, high: 12 },
            { low: 18, high: 22 },
            { low: 28, high: 32 },
            { low: 23, high: 27 },
            { low: 38, high: 42 },
          ],
        },
      ],
      xAxis: { title: "X", type: "linear" as const },
      yAxis: { title: "Y", type: "linear" as const },
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    enterZoomMode();
    expect(getCursorAttributes()).toEqual({ min: "0", max: "40", now: "0", text: "0" });
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes().now).toBe("10");

    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 10, max: 30 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 10, endValue: 30 } } } }),
    );
  });

  test("zooms an inverted chart with the keyboard", () => {
    renderZoomChart({
      ...defaultProps,
      inverted: true,
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    enterZoomMode();
    const cursor = getChart().findZoomCursor()!.getElement();
    expect(cursor).toHaveAttribute("aria-orientation", "vertical");

    expect(getCursorAttributes().now).toBe("0");
    pressCursorKey(KeyCode.down);
    expect(getCursorAttributes().now).toBe("1");
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.down, 2);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
  test("disables the Zoom button for threshold-only charts", () => {
    renderZoomChart({
      ...defaultProps,
      series: [{ type: "x-threshold", name: "Peak", value: 2 }],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("passes the zoom properties through to the core chart", () => {
    const { rerender } = renderZoomChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
      onZoomRangeChange,
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    getChart().findResetZoomButton()!.click();
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));

    rerender({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    expect(getChart().findZoomButton()).toBe(null);
  });
});

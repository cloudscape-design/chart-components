// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { InternalZoomProps } from "../../../lib/components/core/internal-interfaces";
import { createChartWrapper as getChart, getXExtremes } from "../../core/__tests__/common";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { zoomMessages } from "../../core/__tests__/zoom-messages";
import { enterZoomMode, getCursorAttributes, pressCursorKey } from "../../core/__tests__/zoom-test-utils";
import { renderCartesianChart } from "./common";

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

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CartesianChart: zoom selection, with other series types", () => {
  test("moves the zoom cursor between the data points, not the error bars", () => {
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

  test("disables the Zoom button for threshold-only charts", () => {
    renderZoomChart({
      ...defaultProps,
      series: [{ type: "x-threshold", name: "Peak", value: 2 }],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("skips the threshold series when moving the zoom cursor", () => {
    renderZoomChart({
      ...defaultProps,
      series: [
        {
          type: "line",
          name: "Requests",
          data: [
            { x: 0, y: 10 },
            { x: 2, y: 20 },
            { x: 4, y: 30 },
          ],
        },
        { type: "x-threshold", name: "Deploy", value: 3 },
        { type: "y-threshold", name: "Limit", value: 25 },
      ],
      zoom: { enabled: true },
    });
    enterZoomMode();
    pressCursorKey(KeyCode.end);
    pressCursorKey(KeyCode.left);
    expect(getCursorAttributes().now).toBe("2");
  });

  test("disables the Zoom button when only the threshold series add points", () => {
    renderZoomChart({
      ...defaultProps,
      series: [
        {
          type: "line",
          name: "Requests",
          data: [
            { x: 0, y: 10 },
            { x: 1, y: null },
            { x: 2, y: null },
          ],
        },
        { type: "y-threshold", name: "Limit", value: 25 },
      ],
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

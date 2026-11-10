// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { afterEach, describe, expect, test } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { getChart, renderCartesianChart } from "./common";
import {
  defaultProps,
  enterZoomMode,
  getCursorAttributes,
  getXExtremes,
  keyboardZoomToIndexes,
  onZoomRangeChange,
  pressCursorKey,
  pressCursorKeyTimes,
  TEST_TIMEOUT,
} from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CartesianChart: zoom with other series types", { timeout: TEST_TIMEOUT }, () => {
  test("zooms into two adjacent points without explicit axis bounds", () => {
    renderCartesianChart({
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
    renderCartesianChart({
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
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 10, max: 30 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 10, endValue: 30 } } } }),
    );
  });

  test("zooms an inverted chart with the keyboard", () => {
    renderCartesianChart({
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
    pressCursorKeyTimes(KeyCode.down, 2);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
});

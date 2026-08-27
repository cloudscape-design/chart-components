// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart, renderStatefulChart } from "./common";

// Every test here renders a real chart, which takes ~2s in jsdom, and the zoom interactions re-render it.
const TEST_TIMEOUT = 15_000;

// Zooming belongs to the core chart, which is what consumers that build their own chart components
// render. The affordances themselves are covered in depth against CartesianChart; the tests here cover
// what only the core chart can show: that zooming is reachable through the core chart's own properties,
// slots, and API, and that it observes the series visibility the core chart applies from its own effect.

const series: CoreChartProps.ChartOptions["series"] = [
  {
    type: "line",
    name: "L1",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
      { x: 3, y: 25 },
      { x: 4, y: 40 },
    ],
  },
  {
    type: "line",
    name: "L2",
    data: [
      { x: 0, y: 40 },
      { x: 1, y: 25 },
      { x: 2, y: 30 },
      { x: 3, y: 20 },
      { x: 4, y: 10 },
    ],
  },
];

const defaultProps = {
  highcharts,
  options: { series, xAxis: { min: 0, max: 4 } },
  zoom: { enabled: true },
};

const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

function getCurrentChart() {
  // Target the most recently rendered chart: highcharts.charts accumulates entries across tests
  // (disposed charts remain as holes), so the last defined entry is the one under test.
  return [...highcharts.charts].reverse().find((c) => c)!;
}

function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

function enterZoomMode() {
  createChartWrapper().findZoomButton()!.click();
}

function pressCursorKey(keyCode: number, times = 1) {
  for (let i = 0; i < times; i++) {
    createChartWrapper().findZoomCursor()!.keydown(keyCode);
  }
}

// Drives a full keyboard zoom over the visible points, by index: the cursor starts at the first visible
// point, so stepping right N times lands on the N-th visible point.
function keyboardZoomToIndexes(startIndex: number, endIndex: number) {
  enterZoomMode();
  pressCursorKey(KeyCode.right, startIndex);
  pressCursorKey(KeyCode.enter);
  pressCursorKey(KeyCode.right, endIndex - startIndex);
  pressCursorKey(KeyCode.enter);
}

describe("CoreChart: zoom", { timeout: TEST_TIMEOUT }, () => {
  test("renders no zoom affordances when zoom is not enabled", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoom: undefined });
    expect(wrapper.findZoomButton()).toBe(null);
    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(wrapper.findResetZoomButton()).toBe(null);
    expect(wrapper.findZoomCursor()).toBe(null);
  });

  // The zoom controls render in the chart's header area, so they precede the plot in the DOM and in the
  // focus order, while a navigator given by the consumer keeps its own place after the plot.
  test("renders the zoom controls before the plot, leaving the navigator slot to the consumer", () => {
    const { wrapper } = renderChart({
      ...defaultProps,
      navigator: <div>Custom navigator</div>,
    });

    const navigator = wrapper.findNavigator()!;
    const zoomButton = wrapper.findZoomButton()!.getElement();
    const container = getCurrentChart().container;

    expect(navigator.getElement()).toHaveTextContent("Custom navigator");
    expect(navigator.getElement().contains(zoomButton)).toBe(false);
    expect(zoomButton.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(navigator.getElement().compareDocumentPosition(container) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  test("zooms into a range with the keyboard and resets it", () => {
    const { wrapper } = renderChart({ ...defaultProps, onZoomRangeChange });

    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );

    onZoomRangeChange.mockReset();
    wrapper.findResetZoomButton()!.click();

    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("takes the zoomed range from the zoomRange property when it is controlled", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: null, onZoomRangeChange });

    keyboardZoomToIndexes(1, 3);

    // The consumer owns the range, so the chart still shows the full one and only announces the change.
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );

    rerender({ ...defaultProps, zoomRange: { x: { startValue: 1, endValue: 3 } }, onZoomRangeChange });

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(wrapper.findResetZoomButton()).not.toBe(null);
  });

  test("exposes the zoom methods on the chart API", () => {
    let chartApi: CoreChartProps.ChartAPI | null = null;
    const { wrapper } = renderChart({ ...defaultProps, callback: (api) => (chartApi = api) });

    act(() => chartApi!.enterZoomMode());
    expect(wrapper.findExitZoomButton()).not.toBe(null);

    act(() => chartApi!.exitZoomMode());
    expect(wrapper.findExitZoomButton()).toBe(null);

    keyboardZoomToIndexes(1, 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    act(() => chartApi!.resetZoom());
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
  });

  // The core chart applies the visibleItems property to the series from an effect of its own, and the
  // zoom reconciles after that effect: it has to see the series as the chart leaves them, or it keeps
  // offering a range that is no longer in the plot.
  test("leaves zoom mode when the remaining series are hidden mid-selection", () => {
    // The series visibility stays controlled for the lifetime of the component: switching from
    // uncontrolled to controlled is not supported and the update would be ignored.
    const { wrapper, rerender } = renderChart({ ...defaultProps, visibleItems: ["L1", "L2"] });

    enterZoomMode();
    expect(wrapper.findExitZoomButton()).not.toBe(null);

    rerender({ ...defaultProps, visibleItems: [] });

    expect(wrapper.findExitZoomButton()).toBe(null);
    // With no points left there is no range to select, so the button has nothing to offer.
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(true);
  });

  test("zooms over the points of the series that are still visible", () => {
    renderStatefulChart({ ...defaultProps, visibleItems: ["L2"], onZoomRangeChange });

    // L1 is hidden, and the range is selected over the points of L2, which span the same x values.
    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });
});

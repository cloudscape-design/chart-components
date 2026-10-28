// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart, renderStatefulChart } from "./common";
import { zoomMessages } from "./zoom-messages";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors.js";

// Every test here renders a real chart, which takes ~2s in jsdom, and the zoom interactions re-render it.
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
  i18nProvider: zoomMessages,
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

describe("CoreChart: zoom", () => {
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

  test("ignores the zoom while the x-axes are removed, and applies it again once they are back", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: { x: { startValue: 1, endValue: 3 } } });
    expect(getCurrentChart().xAxis[0].getExtremes()).toEqual(expect.objectContaining({ min: 1, max: 3 }));

    rerender({ ...defaultProps, options: { series, xAxis: [] }, zoomRange: { x: { startValue: 1, endValue: 3 } } });
    expect(document.querySelector(`.${testClasses["zoom-range"]}`)).toBe(null);
    expect(wrapper.findZoomButton()).toBe(null);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: { x: { startValue: 1, endValue: 3 } } });
    expect(getCurrentChart().xAxis[0].getExtremes()).toEqual(expect.objectContaining({ min: 1, max: 3 }));
    expect(wrapper.findResetZoomButton()).not.toBe(null);
  });

  test("applies the zoom range to an x-axis that replaces the first one", () => {
    const zoomRange = { x: { startValue: 1, endValue: 3 } };
    const options = {
      series,
      xAxis: [
        { id: "first", min: 0, max: 4 },
        { id: "second", min: 0, max: 4 },
      ],
    };
    const { rerender } = renderChart({ ...defaultProps, options, zoomRange });
    rerender({ ...defaultProps, options: { series, xAxis: [{ id: "second", min: 0, max: 4 }] }, zoomRange });
    expect(getCurrentChart().xAxis[0].options.id).toBe("second");
    expect(getCurrentChart().xAxis[0].getExtremes()).toEqual(expect.objectContaining({ min: 1, max: 3 }));
  });

  test("leaves x-axis extremes it did not apply to the consumer", () => {
    renderChart({ ...defaultProps, zoom: undefined });
    act(() => getCurrentChart().xAxis[0].setExtremes(2, 3));
    act(() => getCurrentChart().redraw());
    expect(getCurrentChart().xAxis[0].getExtremes()).toEqual(expect.objectContaining({ min: 2, max: 3 }));
  });

  test("marks the zoomed range when zoom is enabled on an axis already showing that range", () => {
    const { rerender } = renderChart({
      ...defaultProps,
      zoom: undefined,
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    act(() => getCurrentChart().xAxis[0].setExtremes(1, 3));
    rerender({
      ...defaultProps,
      zoom: { enabled: true, hideZoomControls: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    expect(document.querySelector(`.${testClasses["zoom-range"]}`)).not.toBe(null);
  });

  test("keeps the x-axis minRange declared by the consumer", () => {
    renderChart({ ...defaultProps, options: { ...defaultProps.options, xAxis: { min: 0, max: 4, minRange: 3 } } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(3);
  });

  test("clears the zoom minRange once zoom is disabled", () => {
    const { rerender } = renderChart(defaultProps);
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(Number.MIN_VALUE);
    rerender({ ...defaultProps, zoom: { enabled: false } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBeUndefined();
  });

  test.each([
    { inverted: false, touchAction: "pan-y" },
    { inverted: true, touchAction: "pan-x" },
  ])("leaves touch drags along the x axis to the zoom, inverted=$inverted", ({ inverted, touchAction }) => {
    renderChart({ ...defaultProps, options: { ...defaultProps.options, chart: { inverted } } });
    expect(getCurrentChart().container).toHaveStyle({ touchAction });
  });

  // Highcharts keeps the points outside the x-axis extremes in the series until it exceeds cropThreshold.
  // Keyboard navigation must not reach them, whether the extremes come from a zoom or from the consumer.
  test.each([
    { name: "a zoom", props: {}, zoomTo: [1, 3], first: "1", last: "3" },
    {
      name: "consumer axis bounds",
      props: { zoom: undefined, options: { series, xAxis: { min: 2, max: 3 } } },
      zoomTo: null,
      first: "2",
      last: "3",
    },
  ])("navigates only the points within the x-axis extremes set by $name", ({ props, zoomTo, first, last }) => {
    renderChart({ ...defaultProps, ...props, ariaLabel: "Chart" });
    if (zoomTo) {
      keyboardZoomToIndexes(zoomTo[0], zoomTo[1]);
    }
    const application = createChartWrapper().findApplication()!;
    application.focus();
    application.keydown(KeyCode.home);
    expect(document.activeElement).toHaveAttribute("aria-label", first);
    application.keydown(KeyCode.end);
    expect(document.activeElement).toHaveAttribute("aria-label", last);
  });

  // A reversed x axis draws the values from right to left. The cursor still starts at the left edge of the
  // plot, and the arrow keys still move it the way they point on screen.
  test("follows a reversed x axis on screen", () => {
    renderChart({ ...defaultProps, options: { series, xAxis: { min: 0, max: 4, reversed: true } } });
    enterZoomMode();
    const cursor = createChartWrapper().findZoomCursor()!.getElement();
    expect(cursor).toHaveAttribute("aria-valuenow", "4");

    pressCursorKey(KeyCode.left);
    expect(cursor).toHaveAttribute("aria-valuenow", "4");
    pressCursorKey(KeyCode.right);
    expect(cursor).toHaveAttribute("aria-valuenow", "3");

    pressCursorKey(KeyCode.end);
    expect(cursor).toHaveAttribute("aria-valuenow", "0");
  });
});

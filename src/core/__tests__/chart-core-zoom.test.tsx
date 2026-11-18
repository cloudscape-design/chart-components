// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "highcharts/highcharts-more";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { ZoomRange } from "../../../lib/components/core/internal-interfaces";
import { getSeriesData } from "../../../lib/components/internal/utils/highcharts";
import {
  CoreChartTestProps,
  createChartWrapper,
  getCurrentChart,
  getXExtremes,
  renderChart,
  renderStatefulChart,
} from "./common";
import { stubPlotGeometry } from "./plot-geometry";
import { zoomMessages } from "./zoom-messages";
import {
  enterZoomMode,
  findZoomSvg,
  getZoomRangeAffordance,
  keyboardZoomToIndexes,
  pressCursorKey,
} from "./zoom-test-utils";

stubPlotGeometry();

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

const defaultProps: CoreChartTestProps = {
  highcharts,
  i18nProvider: zoomMessages,
  ariaLabel: "Chart",
  options: { series, xAxis: { min: 0, max: 4 } },
  zoom: { enabled: true },
};

const zoomedRange: ZoomRange = { x: { startValue: 1, endValue: 3 } };
const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

describe("CoreChart: zoom range", () => {
  test("ignores the zoom range when zoom is not enabled", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoom: undefined, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("applies the zoom range and marks it with a band and boundary lines", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
    expect(wrapper.findResetZoomButton()!.getElement()).toHaveTextContent("Reset");

    rerender({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("normalizes a zoom range given from the higher to the lower value", () => {
    renderChart({ ...defaultProps, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
  });

  test("allows a zoom range of two adjacent points without explicit axis bounds", () => {
    renderChart({
      ...defaultProps,
      options: { series: [{ type: "column", name: "C1", data: [10, 20, 30, 25, 40] }], xAxis: {} },
      zoomRange: { x: { startValue: 1, endValue: 2 } },
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
  });

  test("shows the consumer x-axis range when zoom is disabled", () => {
    const options = { series, xAxis: { min: 0, max: 4, plotLines: [{ id: "line", value: 2 }] } };
    const { wrapper, rerender } = renderChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options, zoom: { enabled: false }, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("ignores the zoom when the chart declares no x-axis", () => {
    const { wrapper } = renderChart({ ...defaultProps, options: { series }, zoomRange: zoomedRange });
    const { min, max } = getXExtremes();
    expect(min).toBeLessThanOrEqual(0);
    expect(max).toBeGreaterThanOrEqual(4);
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("ignores the zoom while the x-axes are removed, and applies it again once they are back", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options: { series, xAxis: [] }, zoomRange: zoomedRange, onZoomRangeChange });
    expect(findZoomSvg("zoom-range")).toBe(null);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(wrapper.findResetZoomButton()).not.toBe(null);
  });

  test("applies the zoom range to an x-axis that replaces the first one", () => {
    const options = {
      series,
      xAxis: [
        { id: "first", min: 0, max: 4 },
        { id: "second", min: 0, max: 4 },
      ],
    };
    const { rerender } = renderChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({
      ...defaultProps,
      options: { series, xAxis: [{ id: "second", min: 0, max: 4 }] },
      zoomRange: zoomedRange,
    });
    expect(getCurrentChart().xAxis[0].options.id).toBe("second");
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("leaves x-axis extremes it did not apply to the consumer", () => {
    renderChart({ ...defaultProps, zoom: undefined });
    act(() => getCurrentChart().xAxis[0].setExtremes(2, 3));
    act(() => getCurrentChart().redraw());
    expect(getXExtremes()).toEqual({ min: 2, max: 3 });
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
    expect(findZoomSvg("zoom-range")).not.toBe(null);
  });

  test("keeps the x-axis minRange declared by the consumer", () => {
    renderChart({ ...defaultProps, options: { series, xAxis: { min: 0, max: 4, minRange: 3 } } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(3);
  });

  test("clears the zoom minRange once zoom is disabled", () => {
    const { rerender } = renderChart(defaultProps);
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(Number.MIN_VALUE);
    rerender({ ...defaultProps, zoom: { enabled: false } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBeUndefined();
  });
});

describe("CoreChart: zoom controls", () => {
  test("renders the controls before the plot, leaving the navigator slot to the consumer", () => {
    const { wrapper } = renderChart({
      ...defaultProps,
      zoomRange: zoomedRange,
      navigator: <div>Custom navigator</div>,
    });
    const navigator = wrapper.findNavigator()!;
    const controls = wrapper.findResetZoomButton()!.getElement().closest('[role="region"]')!;
    const container = getCurrentChart().container;

    expect(controls).toHaveAttribute("role", "region");
    expect(controls).toHaveAttribute("aria-label", "Chart zoom controls");
    expect(navigator.getElement()).toHaveTextContent("Custom navigator");
    expect(navigator.getElement().contains(controls)).toBe(false);
    expect(controls.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("the Reset button asks the consumer to show the full range, and leaves the range to the consumer", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    wrapper.findResetZoomButton()!.click();

    expect(onZoomRangeChange).toHaveBeenCalledTimes(1);
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("resets a controlled zoom and announces it", () => {
    const { wrapper } = renderStatefulChart({
      ...defaultProps,
      visibleItems: ["L1", "L2"],
      zoomRange: zoomedRange,
      onZoomRangeChange,
    });
    wrapper.findResetZoomButton()!.focus();
    wrapper.findResetZoomButton()!.click();

    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
    expect(wrapper.getElement()).toHaveTextContent("Zoom reset. Showing the full data range.");
  });
});

describe("CoreChart: zoom selection", () => {
  test("leaves zoom mode when the remaining series are hidden mid-selection", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, visibleItems: ["L1", "L2"] });

    enterZoomMode();
    expect(wrapper.findExitZoomButton()).not.toBe(null);

    rerender({ ...defaultProps, visibleItems: [] });

    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(true);
  });

  test("zooms over the points of the series that are still visible", () => {
    renderStatefulChart({ ...defaultProps, visibleItems: ["L2"], onZoomRangeChange });

    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("moves the zoom cursor only between the points of the first x-axis", () => {
    renderChart({
      ...defaultProps,
      options: {
        xAxis: [{ min: 0, max: 4 }, {}],
        series: [
          {
            type: "line",
            name: "L1",
            data: [
              { x: 0, y: 1 },
              { x: 2, y: 2 },
              { x: 4, y: 3 },
            ],
          },
          {
            type: "line",
            name: "L2",
            xAxis: 1,
            data: [
              { x: 1, y: 1 },
              { x: 3, y: 2 },
            ],
          },
        ],
      },
    });
    enterZoomMode();
    const cursor = createChartWrapper().findZoomCursor()!.getElement();
    pressCursorKey(KeyCode.right);
    expect(cursor).toHaveAttribute("aria-valuenow", "2");
    pressCursorKey(KeyCode.end);
    expect(cursor).toHaveAttribute("aria-valuenow", "4");
  });

  test("moves focus to Reset after a zoom into a controlled range", () => {
    const { wrapper } = renderStatefulChart({
      ...defaultProps,
      visibleItems: ["L1", "L2"],
      zoomRange: null,
      onZoomRangeChange,
    });
    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(document.activeElement).toBe(wrapper.findResetZoomButton()!.getElement());
  });

  test("allows zooming once zoom is enabled on data that changed while it was disabled", () => {
    const options = (values: number[]) => ({
      series: [{ type: "line" as const, name: "L1", data: values.map((x) => ({ x, y: x })) }],
      xAxis: { min: 0, max: 4 },
    });
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: options([0, 1]) });
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(true);

    rerender({ ...defaultProps, zoom: { enabled: false }, options: options([0, 1]) });
    rerender({ ...defaultProps, zoom: { enabled: false }, options: options([0, 1, 2, 3, 4]) });
    rerender({ ...defaultProps, options: options([0, 1, 2, 3, 4]) });
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(false);
  });

  test.each([
    { name: "", props: {} },
    { name: " with noData", props: { noData: { statusType: "finished" as const } } },
    { name: " with keyboard navigation turned off", props: { keyboardNavigation: false } },
  ])("moves focus to the disabled Zoom button when the data leaves nothing to select$name", ({ props }) => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, ...props });
    enterZoomMode();
    rerender({ ...defaultProps, ...props, options: { series: [], xAxis: { min: 0, max: 4 } } });

    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(true);
    expect(document.activeElement).toBe(wrapper.findZoomButton()!.getElement());
  });

  test("explains why the Zoom button is disabled", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: { x: { startValue: 1, endValue: 2 } } });
    const zoomButton = wrapper.findZoomButton()!;
    expect(zoomButton.isDisabled()).toBe(true);
    zoomButton.focus();
    expect(zoomButton.findDisabledReason()!.getElement()).toHaveTextContent("There is no narrower range to zoom into");
  });

  test("hides the tooltip of a hovered point when zoom mode is entered", async () => {
    vi.useFakeTimers();
    try {
      const { wrapper } = renderChart(defaultProps);
      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(wrapper.findTooltip()).not.toBe(null);

      wrapper.findZoomButton()!.click();
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(wrapper.findExitZoomButton()).not.toBe(null);
      expect(wrapper.findTooltip()).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  test("can still cancel zoom mode with the Zoom button after the data shrinks during a selection", () => {
    const { wrapper, rerender } = renderChart(defaultProps);
    enterZoomMode();
    rerender({
      ...defaultProps,
      options: {
        series: [
          {
            type: "line",
            name: "L1",
            data: [
              { x: 0, y: 1 },
              { x: 4, y: 2 },
            ],
          },
        ],
        xAxis: {},
      },
    });

    const exitButton = wrapper.findExitZoomButton()!;
    expect(exitButton.isDisabled()).toBe(false);
    exitButton.click();
    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(wrapper.findZoomButton()!.isDisabled()).toBe(true);
  });

  test("moves the cursor to the point nearest on screen on a logarithmic x-axis", () => {
    renderChart({
      ...defaultProps,
      options: {
        series: [{ type: "line", name: "L1", data: [1, 100, 10000].map((x) => ({ x, y: x })) }],
        xAxis: { type: "logarithmic", min: 1, max: 10000 },
      },
    });
    enterZoomMode();
    const chart = getCurrentChart();
    const pointer = new PointerEvent("pointermove", {
      bubbles: true,
      pointerId: 1,
      pointerType: "mouse",
      clientX: chart.xAxis[0].toPixels(40, false),
      clientY: chart.plotTop + chart.plotHeight / 2,
    });
    act(() => {
      chart.container.dispatchEvent(pointer);
    });

    expect(createChartWrapper().findZoomCursor()!.getElement()).toHaveAttribute("aria-valuenow", "100");
  });

  test("follows a reversed x axis on screen", () => {
    renderChart({ ...defaultProps, options: { series, xAxis: { min: 0, max: 4, reversed: true } } });
    enterZoomMode();
    const cursor = createChartWrapper().findZoomCursor()!.getElement();
    expect(cursor).toHaveAttribute("aria-valuenow", "0");

    pressCursorKey(KeyCode.right);
    expect(cursor).toHaveAttribute("aria-valuenow", "0");
    pressCursorKey(KeyCode.left);
    expect(cursor).toHaveAttribute("aria-valuenow", "1");

    pressCursorKey(KeyCode.end);
    expect(cursor).toHaveAttribute("aria-valuenow", "4");
    pressCursorKey(KeyCode.home);
    expect(cursor).toHaveAttribute("aria-valuenow", "0");
  });
});

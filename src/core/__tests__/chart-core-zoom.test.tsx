// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart, renderStatefulChart } from "./common";
import { stubPlotGeometry } from "./plot-geometry";
import { zoomMessages } from "./zoom-messages";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors.js";

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

function keyboardZoomToIndexes(startIndex: number, endIndex: number) {
  enterZoomMode();
  pressCursorKey(KeyCode.right, startIndex);
  pressCursorKey(KeyCode.enter);
  pressCursorKey(KeyCode.right, endIndex - startIndex);
  pressCursorKey(KeyCode.enter);
}

describe("CoreChart: zoom", () => {
  test("keeps the clicks that set the range boundaries away from the chart", () => {
    const onChartClick = vi.fn();
    renderChart({ ...defaultProps, options: { ...defaultProps.options, chart: { events: { click: onChartClick } } } });
    const click = (value: number) => {
      const chart = getCurrentChart();
      const init = {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        buttons: 1,
        clientX: chart.xAxis[0].toPixels(value, false),
        clientY: chart.plotTop + chart.plotHeight / 2,
      };
      for (const type of ["pointerdown", "pointerup", "click"]) {
        act(() => {
          chart.container.dispatchEvent(new PointerEvent(type, init));
        });
      }
    };

    enterZoomMode();
    click(1);
    click(3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onChartClick).not.toHaveBeenCalled();

    click(2);
    expect(onChartClick).toHaveBeenCalledTimes(1);
  });

  test("renders no zoom affordances when zoom is not enabled", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoom: undefined });
    expect(wrapper.findZoomButton()).toBe(null);
    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(wrapper.findResetZoomButton()).toBe(null);
    expect(wrapper.findZoomCursor()).toBe(null);
  });

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

  test("only stops the cursor on the points of the zoomed first x-axis", () => {
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

  test("moves focus to the Zoom button after a zoom into a controlled range the consumer ignores", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: null, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(document.activeElement).toBe(wrapper.findZoomButton()!.getElement());
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

  test("moves focus to the chart when the data leaves nothing to select", () => {
    const { wrapper, rerender } = renderChart(defaultProps);
    enterZoomMode();
    rerender({ ...defaultProps, options: { series: [], xAxis: { min: 0, max: 4 } } });

    expect(wrapper.findExitZoomButton()).toBe(null);
    expect(document.activeElement).toBe(wrapper.findApplication()!.getElement());
  });

  test("unpins the tooltip when zoom mode is entered with the keyboard", () => {
    const { wrapper } = renderChart(defaultProps);
    wrapper.findApplication()!.focus();
    wrapper.findApplication()!.keydown(KeyCode.enter);
    wrapper.findApplication()!.keydown(KeyCode.enter);
    expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);

    wrapper.findZoomButton()!.click();
    expect(wrapper.findExitZoomButton()).not.toBe(null);
    expect(wrapper.findTooltip()).toBe(null);
  });

  test("keeps the pressed Zoom button enabled when the data shrinks during a selection", () => {
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

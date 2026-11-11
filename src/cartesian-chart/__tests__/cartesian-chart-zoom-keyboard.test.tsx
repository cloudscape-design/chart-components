// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act, useState } from "react";
import { render } from "@testing-library/react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import CartesianChart, { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { zoomMessages } from "../../core/__tests__/zoom-messages";
import { getChart, renderCartesianChart } from "./common";
import {
  defaultProps,
  dispatchPointer,
  enterZoomMode,
  focusOutsideChart,
  getCursorAttributes,
  getCursorLeft,
  getXExtremes,
  keyboardZoomToIndexes,
  onZoomRangeChange,
  pressCursorKey,
  pressCursorKeyTimes,
  renderInRtl,
  seriesOfLength,
  TEST_TIMEOUT,
} from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CartesianChart: zoom keyboard interaction", { timeout: TEST_TIMEOUT }, () => {
  test.each([
    { key: "Enter", keyCode: KeyCode.enter },
    { key: "Space", keyCode: KeyCode.space },
  ])("selects a range with the arrow keys and $key", ({ keyCode }) => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(keyCode);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(keyCode);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("moves the cursor to the range edges with Home and End", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.end);
    expect(getCursorAttributes().now).toBe("4");
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.home);
    expect(getCursorAttributes().now).toBe("0");
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
  });

  test.each([
    { count: 5, step: 1 },
    { count: 50, step: 5 },
  ])("steps the cursor a tenth of $count points with PageDown and PageUp", ({ count, step }) => {
    renderCartesianChart({
      ...defaultProps,
      series: seriesOfLength(count),
      xAxis: { ...defaultProps.xAxis, max: count - 1 },
      zoom: { enabled: true },
    });
    enterZoomMode();
    pressCursorKey(KeyCode.pageDown);
    expect(getCursorAttributes().now).toBe(String(step));
    pressCursorKey(KeyCode.pageUp);
    expect(getCursorAttributes().now).toBe("0");
  });

  test.each([
    { name: "left-to-right page", rtl: false, inverted: false, key: KeyCode.pageDown, now: "5" },
    { name: "inverted chart", rtl: false, inverted: true, key: KeyCode.pageDown, now: "5" },
    { name: "right-to-left page", rtl: true, inverted: false, key: KeyCode.pageDown, now: "5" },
  ])("pages through the values in order, as chart navigation does, in a $name", ({ rtl, inverted, key, now }) => {
    if (rtl) {
      renderInRtl();
    }
    const props = {
      ...defaultProps,
      inverted,
      series: seriesOfLength(50),
      xAxis: { ...defaultProps.xAxis, max: 49 },
      zoom: { enabled: true },
    };
    try {
      const { rerender } = renderCartesianChart(props);
      rerender(props);
      enterZoomMode();
      pressCursorKey(key);
      expect(getCursorAttributes().now).toBe(now);
    } finally {
      vi.restoreAllMocks();
    }
  });

  test("ignores vertical arrow keys on a horizontal axis", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.up);
    pressCursorKey(KeyCode.down);
    expect(getCursorAttributes().now).toBe("0");
  });

  test("Escape cancels the selection", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.escape);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("rejects a selection of a single point", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
    expect(getChart().findExitZoomButton()).not.toBe(null);
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 0, max: 1 });
  });

  test("entering zoom mode moves focus to the cursor", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(document.activeElement).toBe(getChart().findZoomCursor()!.getElement());
  });

  test("exposes the cursor position on the slider", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    const cursor = getChart().findZoomCursor()!.getElement();
    expect(cursor).toHaveAttribute("role", "slider");
    expect(cursor).toHaveAttribute("aria-orientation", "horizontal");
    expect(cursor).toHaveAttribute("aria-label", "Zoom range cursor");
    expect(getCursorAttributes()).toEqual({ min: "0", max: "4", now: "0", text: "0" });

    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes()).toEqual({ min: "0", max: "4", now: "1", text: "1" });

    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes()).toEqual({
      min: "0",
      max: "4",
      now: "2",
      text: "Selecting zoom range from 1 to 2.",
    });
  });

  test("moves focus to Reset after zooming, and back to Zoom after resetting", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());

    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the chart after resetting when the Zoom button is disabled", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 2 } },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findApplication()!.getElement());
  });

  test("moves focus to the Zoom button when the selection is cancelled", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.escape);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("exits zoom mode when focus leaves the chart", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);

    focusOutsideChart();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("keeps zoom mode when focus moves within the chart", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    act(() => (getChart().findExitZoomButton()!.getElement() as HTMLElement).focus());
    expect(getChart().findExitZoomButton()).not.toBe(null);
  });

  test("exits zoom mode when focus leaves the chart from the zoom controls", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    act(() => (getChart().findExitZoomButton()!.getElement() as HTMLElement).focus());

    focusOutsideChart();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("keeps the start point on its value when the data changes", () => {
    const xs = (values: number[]) => [
      { type: "line" as const, name: "Requests", data: values.map((x) => ({ x, y: x })) },
    ];
    const props = { ...defaultProps, xAxis: { ...defaultProps.xAxis, max: 40 }, zoom: { enabled: true } };
    const { rerender } = renderCartesianChart({ ...props, series: xs([0, 10, 20, 30, 40]) });
    enterZoomMode();
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);

    rerender({ ...props, series: xs([0, 20, 30, 40]) });
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 20, max: 30 });
  });

  test("moves focus to the chart when a cancelled selection leaves nothing to zoom into", () => {
    const { rerender } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    rerender({ ...defaultProps, series: seriesOfLength(2), zoom: { enabled: true } });
    expect(getChart().findExitZoomButton()).not.toBe(null);

    pressCursorKey(KeyCode.escape);
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    expect(document.activeElement).toBe(getChart().findApplication()!.getElement());
  });

  test("moves focus to Reset after a zoom into a controlled range", () => {
    function ControlledChart() {
      const [zoomRange, setZoomRange] = useState<null | CartesianChartProps.ZoomRange>(null);
      return (
        <TestI18nProvider messages={zoomMessages}>
          <CartesianChart
            {...defaultProps}
            zoom={{ enabled: true }}
            zoomRange={zoomRange}
            onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
          />
        </TestI18nProvider>
      );
    }
    render(<ControlledChart />);
    keyboardZoomToIndexes(1, 3);

    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());
  });

  test("confines the cursor to the zoomed window", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    enterZoomMode();
    expect(getCursorAttributes()).toEqual({ min: "1", max: "3", now: "1", text: "1" });

    pressCursorKeyTimes(KeyCode.right, 5);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKeyTimes(KeyCode.left, 5);
    expect(getCursorAttributes().now).toBe("1");
  });
});
describe("CartesianChart: zoom direction", { timeout: TEST_TIMEOUT }, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    { name: "left-to-right page", rtl: false, towardsEnd: KeyCode.right, direction: 1 },
    { name: "right-to-left page", rtl: true, towardsEnd: KeyCode.left, direction: -1 },
  ])("starts at the first value and follows the plot on screen in a $name", ({ rtl, towardsEnd, direction }) => {
    if (rtl) {
      renderInRtl();
    }
    const { rerender } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    rerender({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();

    expect(getCursorAttributes().now).toBe("0");
    const startLeft = getCursorLeft();
    pressCursorKey(towardsEnd);
    expect(getCursorAttributes().now).toBe("1");
    expect(Math.sign(getCursorLeft() - startLeft)).toBe(direction);

    pressCursorKey(KeyCode.end);
    expect(getCursorAttributes().now).toBe("4");
    pressCursorKey(KeyCode.home);
    expect(getCursorAttributes().now).toBe("0");
  });

  test("zooms an inverted chart by dragging along the vertical axis", () => {
    renderCartesianChart({ ...defaultProps, inverted: true, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("zooms an inverted chart with two clicks in zoom mode", () => {
    renderCartesianChart({ ...defaultProps, inverted: true, zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    dispatchPointer("pointerdown", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
});
describe("CartesianChart: zoom announcements", { timeout: TEST_TIMEOUT }, () => {
  test.each([
    {
      step: "entering zoom mode",
      run: () => enterZoomMode(),
      text: "Zoom mode. Cursor at 0. Use arrow keys to move, Enter to set the start point.",
    },
    {
      step: "setting the start point",
      run: () => {
        enterZoomMode();
        pressCursorKey(KeyCode.right);
        pressCursorKey(KeyCode.enter);
      },
      text: "Start point set at 1. Move the cursor and set the end point to zoom.",
    },
    {
      step: "cancelling zoom mode",
      run: () => {
        enterZoomMode();
        pressCursorKey(KeyCode.escape);
      },
      text: "Zoom mode cancelled",
    },
    {
      step: "resetting the zoom",
      run: () => {
        keyboardZoomToIndexes(1, 3);
        getChart().findResetZoomButton()!.click();
      },
      text: "Zoom reset. Showing the full data range.",
    },
  ])("announces $step", ({ run, text }) => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    run();
    expect(getChart().getElement()).toHaveTextContent(text);
  });

  test("formats the cursor position and the range with the x-axis value formatter", () => {
    const day = 24 * 60 * 60 * 1000;
    const start = Date.UTC(2025, 0, 1);
    renderCartesianChart({
      highcharts,
      i18nProvider: zoomMessages,
      series: [{ type: "line", name: "Requests", data: [0, 1, 2, 3, 4].map((i) => ({ x: start + i * day, y: i })) }],
      xAxis: {
        title: "Time",
        type: "datetime",
        valueFormatter: (value) => new Date(value!).toISOString().slice(0, 10),
        min: start,
        max: start + 4 * day,
      },
      yAxis: { title: "Count" },
      zoom: { enabled: true },
    });
    enterZoomMode();
    expect(getCursorAttributes().text).toBe("2025-01-01");
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes().text).toBe("Selecting zoom range from 2025-01-02 to 2025-01-03.");
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("Zoomed from 2025-01-02 to 2025-01-03");
  });
});
describe("CartesianChart: zoom repeated announcements", { timeout: TEST_TIMEOUT }, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("announces the start point again when Enter is pressed twice on it", async () => {
    vi.useFakeTimers();
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const startPointText = "Start point set at 0. Move the cursor and set the end point to zoom.";
    let announcements = 0;
    const observer = new MutationObserver((records) => {
      for (const { target } of records) {
        const element = target instanceof Element ? target : target.parentElement;
        if (element?.matches("[aria-live]") && element.textContent?.startsWith(startPointText.slice(0, -1))) {
          announcements++;
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    try {
      enterZoomMode();
      pressCursorKey(KeyCode.enter);
      await act(() => vi.advanceTimersByTimeAsync(2000));
      pressCursorKey(KeyCode.enter);
      await act(() => vi.advanceTimersByTimeAsync(2000));
    } finally {
      observer.disconnect();
    }
    expect(announcements).toBe(2);
  });
});

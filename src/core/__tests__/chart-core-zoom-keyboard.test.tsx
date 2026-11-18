// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { createChartWrapper as getChart, focusOutsideChart, getXExtremes, renderInRtl } from "./common";
import { stubPlotGeometry } from "./plot-geometry";
import {
  dispatchPointer,
  enterZoomMode,
  getCursorAttributes,
  getCursorLeft,
  keyboardZoomToIndexes,
  onZoomRangeChange,
  pressCursorKey,
  renderZoomChart,
  seriesOfLength,
} from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  vi.restoreAllMocks();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CoreChart: zoom selection, keyboard interaction", () => {
  test.each([
    { key: "Enter", keyCode: KeyCode.enter },
    { key: "Space", keyCode: KeyCode.space },
  ])("selects a range with the arrow keys and $key", ({ keyCode }) => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(keyCode);
    pressCursorKey(KeyCode.right, 2);
    pressCursorKey(keyCode);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("moves the cursor to the range edges with Home and End", () => {
    renderZoomChart({ zoom: { enabled: true } });
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
    renderZoomChart({
      series: seriesOfLength(count),
      xAxis: { max: count - 1 },
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
    { name: "inverted chart on a right-to-left page", rtl: true, inverted: true, key: KeyCode.pageDown, now: "5" },
  ])("pages through the values in order, as chart navigation does, in a $name", ({ rtl, inverted, key, now }) => {
    if (rtl) {
      renderInRtl();
    }
    const props = {
      inverted,
      series: seriesOfLength(50),
      xAxis: { max: 49 },
      zoom: { enabled: true },
    };
    try {
      const { rerender } = renderZoomChart(props);
      rerender(props);
      enterZoomMode();
      pressCursorKey(key);
      expect(getCursorAttributes().now).toBe(now);
    } finally {
      vi.restoreAllMocks();
    }
  });

  test.each([
    { name: "left-to-right page", rtl: false },
    { name: "right-to-left page", rtl: true },
  ])("zooms an inverted chart with the arrow keys on a $name", ({ rtl }) => {
    if (rtl) {
      renderInRtl();
    }
    const props = { inverted: true, zoom: { enabled: true }, onZoomRangeChange };
    const { rerender } = renderZoomChart(props);
    rerender(props);
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

  test("ignores vertical arrow keys on a horizontal axis", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.up);
    pressCursorKey(KeyCode.down);
    expect(getCursorAttributes().now).toBe("0");
  });

  test("Escape cancels the selection and returns focus to the Zoom button", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.escape);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("rejects a selection of a single point", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    expect(document.activeElement).toBe(getChart().findZoomCursor()!.getElement());
  });

  test("exposes the cursor position on the slider", () => {
    renderZoomChart({ zoom: { enabled: true } });
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

  test("moves focus to Reset after zooming", () => {
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());
  });

  test("exits zoom mode when focus leaves the chart", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);

    const outside = focusOutsideChart();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(document.activeElement).toBe(outside);
  });

  test("keeps zoom mode when focus moves within the chart", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    act(() => (getChart().findExitZoomButton()!.getElement() as HTMLElement).focus());
    expect(getChart().findExitZoomButton()).not.toBe(null);
  });

  test("exits zoom mode when focus leaves the chart from the zoom controls", () => {
    renderZoomChart({ zoom: { enabled: true } });
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
    const props = { xAxis: { max: 40 }, zoom: { enabled: true } };
    const { rerender } = renderZoomChart({ ...props, series: xs([0, 10, 20, 30, 40]) });
    enterZoomMode();
    pressCursorKey(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);

    rerender({ ...props, series: xs([0, 20, 30, 40]) });
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 20, max: 30 });
  });

  test("moves focus to the disabled Zoom button when a cancelled selection leaves nothing to zoom into", () => {
    const { rerender } = renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    rerender({ series: seriesOfLength(2), zoom: { enabled: true } });
    expect(getChart().findExitZoomButton()).not.toBe(null);

    pressCursorKey(KeyCode.escape);
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("confines the cursor to the zoomed window", () => {
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    enterZoomMode();
    expect(getCursorAttributes()).toEqual({ min: "1", max: "3", now: "1", text: "1" });

    pressCursorKey(KeyCode.right, 5);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKey(KeyCode.left, 5);
    expect(getCursorAttributes().now).toBe("1");
  });
});
describe("CoreChart: zoom selection, direction", () => {
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
    const { rerender } = renderZoomChart({ zoom: { enabled: true } });
    rerender({ zoom: { enabled: true } });
    enterZoomMode();

    expect(getCursorAttributes().now).toBe("0");
    const startLeft = getCursorLeft();
    pressCursorKey(towardsEnd);
    expect(getCursorAttributes().now).toBe("1");
    expect(Math.sign(getCursorLeft() - startLeft)).toBe(direction);
  });

  test("zooms an inverted chart with two clicks in zoom mode", () => {
    renderZoomChart({ inverted: true, zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    dispatchPointer("pointerdown", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
});
describe("CoreChart: zoom selection, announcements", () => {
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
    renderZoomChart({ zoom: { enabled: true } });
    run();
    expect(getChart().getElement()).toHaveTextContent(text);
  });

  test("formats the cursor position and the range with the x-axis value formatter", () => {
    const day = 24 * 60 * 60 * 1000;
    const start = Date.UTC(2025, 0, 1);
    renderZoomChart({
      series: [{ type: "line", name: "Requests", data: [0, 1, 2, 3, 4].map((i) => ({ x: start + i * day, y: i })) }],
      xAxis: {
        type: "datetime",
        valueFormatter: (value) => new Date(value!).toISOString().slice(0, 10),
        min: start,
        max: start + 4 * day,
      },
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

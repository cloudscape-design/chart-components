// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { getSeriesData } from "../../../lib/components/internal/utils/highcharts";
import { createChartWrapper as getChart, getCurrentChart, getXExtremes, renderInRtl } from "./common";
import { stubPlotGeometry } from "./plot-geometry";
import {
  dispatchPointer,
  enterZoomMode,
  findZoomSvg,
  getCursorAttributes,
  getOverlay,
  isVisible,
  keyboardZoomToIndexes,
  onZoomRangeChange,
  pointerEventAtValue,
  pressCursorKey,
  renderZoomChart,
} from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  vi.restoreAllMocks();
});

describe("CoreChart: zoom selection, overlay", () => {
  test.each([
    { state: "idle", act: () => {}, zoomed: false },
    { state: "after a committed zoom", act: () => keyboardZoomToIndexes(1, 3), zoomed: true },
  ])("draws no selection overlay $state", ({ act: run, zoomed }) => {
    renderZoomChart({ zoom: { enabled: true } });
    run();
    const { band, startDivider, cursor } = getOverlay();
    for (const element of [band, startDivider, cursor]) {
      expect(isVisible(element)).toBe(false);
    }
    expect(isVisible(findZoomSvg("zoom-range"))).toBe(zoomed);
  });

  test("shows the cursor while selecting, and the band once the start point is set", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    expect(isVisible(getOverlay().cursor)).toBe(true);
    expect(isVisible(getOverlay().band)).toBe(false);

    pressCursorKey(KeyCode.enter);
    expect(isVisible(getOverlay().startDivider)).toBe(true);

    pressCursorKey(KeyCode.right);
    expect(isVisible(getOverlay().band)).toBe(true);
  });
});
describe("CoreChart: zoom selection, pointer interaction", () => {
  test("sets a boundary when a press on the plot is released outside the chart", () => {
    renderZoomChart({ zoom: { enabled: true } });
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    try {
      enterZoomMode();
      dispatchPointer("pointerdown", 1);
      act(() => {
        outside.dispatchEvent(pointerEventAtValue("pointerup", 3));
      });
      expect(isVisible(getOverlay().startDivider)).toBe(true);
      expect(getCursorAttributes().text).toBe("Selecting zoom range from 1 to 1.");
    } finally {
      outside.remove();
    }
  });

  test("returns to the selection on pointercancel", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointercancel", 1);
    expect(isVisible(getOverlay().startDivider)).toBe(false);
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("ignores the cursor keys while a press is in progress", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 2);
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getCursorAttributes().now).toBe("0");
    expect(isVisible(getOverlay().startDivider)).toBe(false);
  });

  test("leaves presses outside zoom mode to the chart", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("moves the cursor with the pointer hovering the plot in zoom mode", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    const startLeft = getOverlay().cursor.style.left;
    dispatchPointer("pointermove", 3, 0, { buttons: 0 });
    expect(getOverlay().cursor.style.left).not.toBe(startLeft);
    expect(getCursorAttributes().now).toBe(String(3));
  });

  test("previews the band with the pointer hovering the plot after the first click", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    dispatchPointer("pointermove", 3, 0, { buttons: 0 });
    const { band } = getOverlay();
    expect(isVisible(band)).toBe(true);
    expect(Number(band!.getAttribute("width"))).toBeGreaterThan(1);
    expect(getCursorAttributes().text).toBe("Selecting zoom range from 1 to 3.");
  });

  test("shows no tooltip for a point hovered in zoom mode", async () => {
    renderZoomChart({ zoom: { enabled: true } });
    vi.useFakeTimers();
    try {
      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).not.toBe(null);
      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOut());
      await act(() => vi.advanceTimersByTimeAsync(500));

      enterZoomMode();
      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  test.each([
    { name: "a mouse", pointerType: "mouse", rtl: false },
    { name: "touch", pointerType: "touch", rtl: false },
    { name: "a mouse on a right-to-left page", pointerType: "mouse", rtl: true },
  ])("selects the range with two presses using $name", ({ pointerType, rtl }) => {
    if (rtl) {
      renderInRtl();
    }
    const props = { zoom: { enabled: true }, onZoomRangeChange };
    const { rerender } = renderZoomChart(props);
    rerender(props);
    enterZoomMode();
    dispatchPointer("pointerdown", 1, 0, { pointerType });
    dispatchPointer("pointerup", 1, 0, { pointerType });
    expect(isVisible(getOverlay().startDivider)).toBe(true);

    dispatchPointer("pointerdown", 3, 0, { pointerType });
    dispatchPointer("pointerup", 3, 0, { pointerType });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("does not pin a tooltip or fire the chart click for the clicks that set the zoom range", async () => {
    const onChartClick = vi.fn();
    renderZoomChart({ zoom: { enabled: true }, onChartClick });
    const click = (value: number) => {
      dispatchPointer("pointerdown", value);
      dispatchPointer("pointerup", value);
      dispatchPointer("click", value);
    };

    enterZoomMode();
    click(1);
    click(3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onChartClick).not.toHaveBeenCalled();

    vi.useFakeTimers();
    try {
      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).not.toBe(null);
    } finally {
      vi.useRealTimers();
    }

    click(2);
    expect(onChartClick).toHaveBeenCalledTimes(1);
  });

  test("shows the tooltip again after zoom mode ends with a press released outside the chart", async () => {
    renderZoomChart({ zoom: { enabled: true } });
    vi.useFakeTimers();
    try {
      enterZoomMode();
      dispatchPointer("pointerdown", 1);
      act(() => {
        document.body.dispatchEvent(pointerEventAtValue("pointerup", 1));
      });
      pressCursorKey(KeyCode.escape);

      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).not.toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  test("shows the tooltip again when zoom is disabled during a press", async () => {
    const { rerender } = renderZoomChart({ zoom: { enabled: true } });
    vi.useFakeTimers();
    try {
      enterZoomMode();
      dispatchPointer("pointerdown", 1);
      rerender({ zoom: { enabled: false } });

      act(() => getSeriesData(getCurrentChart().series[0])[2].onMouseOver());
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).not.toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  test("ignores presses of non-primary mouse buttons", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1, 0, { button: 2, buttons: 2 });
    dispatchPointer("pointerup", 1, 0, { button: 2, buttons: 0 });
    expect(isVisible(getOverlay().startDivider)).toBe(false);
  });
});

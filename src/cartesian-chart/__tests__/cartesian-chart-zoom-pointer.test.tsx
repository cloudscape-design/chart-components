// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { getSeriesData } from "../../../lib/components/internal/utils/highcharts";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { getChart, renderCartesianChart } from "./common";
import {
  defaultProps,
  dispatchPointer,
  enterZoomMode,
  findSvg,
  getCurrentChart,
  getCursorAttributes,
  getOverlay,
  getXExtremes,
  isVisible,
  keyboardZoomToIndexes,
  onZoomRangeChange,
  pointerEventAtValue,
  pressCursorKey,
  TEST_TIMEOUT,
} from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CartesianChart: zoom overlay", { timeout: TEST_TIMEOUT }, () => {
  test.each([
    { state: "idle", act: () => {}, zoomed: false },
    { state: "after a committed zoom", act: () => keyboardZoomToIndexes(1, 3), zoomed: true },
  ])("draws no selection overlay $state", ({ act: run, zoomed }) => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    run();
    const { band, startDivider, endDivider, cursor } = getOverlay();
    for (const element of [band, startDivider, endDivider, cursor]) {
      expect(isVisible(element)).toBe(false);
    }
    expect(isVisible(findSvg("zoom-range"))).toBe(zoomed);
  });

  test("shows the cursor while selecting, and the band once the start point is set", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(isVisible(getOverlay().cursor)).toBe(true);
    expect(isVisible(getOverlay().band)).toBe(false);

    pressCursorKey(KeyCode.enter);
    expect(isVisible(getOverlay().startDivider)).toBe(true);

    pressCursorKey(KeyCode.right);
    expect(isVisible(getOverlay().band)).toBe(true);
  });
});
describe("CartesianChart: zoom pointer interaction", { timeout: TEST_TIMEOUT }, () => {
  test("dragging across the plot zooms into the dragged range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("keeps following a drag whose moves and release land outside the plot", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    try {
      dispatchPointer("pointerdown", 1);
      act(() => {
        outside.dispatchEvent(pointerEventAtValue("pointermove", 3));
      });
      expect(isVisible(getOverlay().band)).toBe(true);

      act(() => {
        outside.dispatchEvent(pointerEventAtValue("pointerup", 3));
      });
      expect(getXExtremes()).toEqual({ min: 1, max: 3 });
      expect(isVisible(getOverlay().band)).toBe(false);
    } finally {
      outside.remove();
    }
  });

  test("zooms on a drag over a chart further down a scrolled page", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    const scrollY = 1000;
    const chart = getCurrentChart();
    vi.spyOn(chart.container, "getBoundingClientRect").mockReturnValue(new DOMRect(0, -scrollY, 600, 400));
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(scrollY);
    delete (chart.pointer as { chartPosition?: unknown }).chartPosition;
    const dispatchScrolled = (type: string, value: number) => {
      const clientY = chart.plotTop + chart.plotHeight / 2 - scrollY;
      const event = pointerEventAtValue(type, value, 0, { clientY });
      Object.defineProperty(event, "pageY", { value: clientY + scrollY });
      act(() => {
        chart.container.dispatchEvent(event);
      });
    };
    try {
      dispatchScrolled("pointerdown", 1);
      dispatchScrolled("pointermove", 3);
      dispatchScrolled("pointerup", 3);
      expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    } finally {
      vi.restoreAllMocks();
    }
  });

  test("stops following the pointer once the press ends", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    act(() => {
      document.body.dispatchEvent(pointerEventAtValue("pointermove", 3));
    });
    expect(isVisible(getOverlay().band)).toBe(false);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("moves the cursor with the pointer hovering the plot in zoom mode", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    const startLeft = getOverlay().cursor.style.left;
    dispatchPointer("pointermove", 3, 0, { buttons: 0 });
    expect(getOverlay().cursor.style.left).not.toBe(startLeft);
    expect(getCursorAttributes().now).toBe(String(3));
  });

  test("previews the band with the pointer hovering the plot after the first click", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
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
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
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

  test("draws the drag boundaries while dragging", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    const { band, startDivider, endDivider } = getOverlay();
    expect(isVisible(band)).toBe(true);
    expect(isVisible(startDivider)).toBe(true);
    expect(isVisible(endDivider)).toBe(true);

    dispatchPointer("pointerup", 3);
    expect(isVisible(getOverlay().band)).toBe(false);
  });

  test("does not zoom on a press that does not pass the drag threshold", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 1, 5);
    dispatchPointer("pointerup", 1, 5);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("captures the pointer only once a press turns into a drag", () => {
    const setPointerCapture = vi.fn();
    Object.assign(HTMLElement.prototype, { setPointerCapture, hasPointerCapture: () => false });
    try {
      renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
      dispatchPointer("pointerdown", 1);
      dispatchPointer("pointermove", 1, 5);
      expect(setPointerCapture).not.toHaveBeenCalled();

      dispatchPointer("pointermove", 3);
      expect(setPointerCapture).toHaveBeenCalledWith(1);
      dispatchPointer("pointerup", 3);
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
      delete (HTMLElement.prototype as Partial<HTMLElement>).hasPointerCapture;
    }
  });

  test("does not zoom on a drag covering a single data point", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 1, 20);
    dispatchPointer("pointerup", 1, 20);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
    expect(isVisible(getOverlay().band)).toBe(false);
  });

  test("abandons the drag on pointercancel", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointercancel", 3);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
    expect(isVisible(getOverlay().band)).toBe(false);
  });

  test("clicking twice in zoom mode selects the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    expect(isVisible(getOverlay().startDivider)).toBe(true);

    dispatchPointer("pointerdown", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("ignores presses of non-primary mouse buttons", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1, 0, { button: 2, buttons: 2 });
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });
});

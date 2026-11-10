// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { getChart, ref, renderCartesianChart } from "./common";
import {
  defaultProps,
  dispatchPointer,
  enterZoomMode,
  getCurrentChart,
  getXExtremes,
  getZoomRangeAffordance,
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

describe("CartesianChart: zoom controls", { timeout: TEST_TIMEOUT }, () => {
  test("renders the Zoom button in idle state when zoom is enabled", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("Zoom");
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("labels the zoom controls region", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const region = getChart().getElement().querySelector('[role="region"]')!;
    expect(region).toHaveAttribute("aria-label", "Chart zoom controls");
  });

  test("hides the built-in buttons with hideZoomControls, keeping the cursor available", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomCursor()).not.toBe(null);
  });

  test("renders the zoom controls before the plot in DOM order", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const zoomButton = getChart().findZoomButton()!.getElement();
    const position = zoomButton.compareDocumentPosition(getCurrentChart().container);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("clicking Zoom enters zoom mode and keeps the Zoom label", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("Zoom");
  });

  test("keeps the same accessible name on the Zoom button in zoom mode", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const button = getChart().findZoomButton()!.getElement();
    expect(button).not.toHaveAttribute("aria-label");
    enterZoomMode();
    expect(button).not.toHaveAttribute("aria-label");
    expect(button).toHaveTextContent("Zoom");
  });

  test("clicking the pressed Zoom button returns to idle state", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("the Zoom button is a toggle button that is pressed in zoom mode", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const button = getChart().findZoomButton()!.getElement();
    expect(button).toHaveAttribute("aria-pressed", "false");
    enterZoomMode();
    expect(getChart().findExitZoomButton()!.getElement()).toBe(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  test("ref.enterZoomMode / exitZoomMode toggle zoom mode", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => ref.current!.enterZoomMode());
    expect(getChart().findExitZoomButton()).not.toBe(null);
    act(() => ref.current!.exitZoomMode());
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("ref.resetZoom restores the full range after a zoom without firing onZoomRangeChange", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    onZoomRangeChange.mockReset();
    act(() => ref.current!.resetZoom());
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("the Reset button fires onZoomRangeChange with a null range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);

    onZoomRangeChange.mockReset();
    getChart().findResetZoomButton()!.click();
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("ref.resetZoom does not fire an event when the chart is not zoomed", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => ref.current!.resetZoom());
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("ref.resetZoom on a controlled chart fires onZoomRangeChange for the consumer to apply", () => {
    const zoomedProps = { ...defaultProps, zoom: { enabled: true }, zoomRange: { x: { startValue: 1, endValue: 3 } } };
    const { rerender } = renderCartesianChart({ ...zoomedProps, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    act(() => ref.current!.resetZoom());
    expect(onZoomRangeChange).toHaveBeenCalledTimes(1);
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...zoomedProps, zoomRange: null, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });

    onZoomRangeChange.mockReset();
    act(() => ref.current!.resetZoom());
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("controlled zoomRange applies extremes and shows the Reset button", () => {
    const { rerender } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findResetZoomButton()).toBe(null);

    rerender({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getChart().findResetZoomButton()!.getElement()).toHaveTextContent("Reset");

    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("marks the zoomed range with a band and boundary lines", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getZoomRangeAffordance().present).toBe(false);

    keyboardZoomToIndexes(1, 3);
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
  });

  test("clears the zoomed range affordance when the zoom is reset", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    getChart().findResetZoomButton()!.click();
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("marks the zoomed range of a controlled zoomRange", () => {
    const { rerender } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);

    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });

    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("keeps the zoomed range affordance while zoom mode is re-entered", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    enterZoomMode();
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });

    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getZoomRangeAffordance().band).toEqual({ from: 2, to: 3 });
  });

  test("controlled zoomRange is not changed by the interaction, which only fires the event", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: null,
      onZoomRangeChange,
    });
    keyboardZoomToIndexes(1, 3);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("re-entering zoom mode while zoomed keeps the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("exiting a re-zoom returns to the zoomed state with the range intact", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("re-zooming narrows the range from the visible window", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 4);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });

    onZoomRangeChange.mockReset();
    keyboardZoomToIndexes(0, 1);
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  test("Escape during a re-zoom returns to the zoomed state without changing the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 4);

    onZoomRangeChange.mockReset();
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.escape);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("disables the Zoom button once zoomed to the minimum range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getXExtremes()).toEqual({ min: 0, max: 1 });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    getChart().findResetZoomButton()!.click();
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
  });

  test("does not count points without a y value as cursor stops", () => {
    renderCartesianChart({
      ...defaultProps,
      series: [
        {
          type: "line",
          name: "L1",
          data: [
            { x: 0, y: null },
            { x: 1, y: null },
            { x: 2, y: null },
          ],
        },
      ],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("disables the Zoom button when no series with data points are visible", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, visibleSeries: [] });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    act(() => ref.current!.enterZoomMode());
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("disables the Zoom button for threshold-only charts", () => {
    renderCartesianChart({
      ...defaultProps,
      series: [{ type: "x-threshold", name: "Peak", value: 2 }],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("supports i18n overrides for the zoom controls", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nStrings: {
        enterZoomModeButtonText: "Vergrößern",
        resetZoomButtonText: "Zurücksetzen",
        resetZoomButtonAriaLabel: "Zoom zurücksetzen",
        zoomControlsAriaLabel: "Zoom-Steuerung",
      },
    });
    expect(getChart().getElement().querySelector('[role="region"]')).toHaveAttribute("aria-label", "Zoom-Steuerung");
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("Vergrößern");

    keyboardZoomToIndexes(1, 3);
    expect(getChart().findResetZoomButton()!.getElement()).toHaveTextContent("Zurücksetzen");
    expect(getChart().findResetZoomButton()!.getElement()).toHaveAttribute("aria-label", "Zoom zurücksetzen");
  });

  test("resolves the zoom strings from the I18nProvider, with i18nStrings taking precedence", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nStrings: { resetZoomButtonText: "i18n: reset" },
      i18nProvider: {
        "[charts]": {
          "i18nStrings.enterZoomModeButtonText": "provider: zoom",
          "i18nStrings.resetZoomButtonText": "provider: reset",
          "i18nStrings.zoomRangeChangeAnnouncementText": "provider: {startValue} to {endValue}",
        },
      },
    });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("provider: zoom");

    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("provider: 1 to 3");
    expect(getChart().findResetZoomButton()!.getElement()).toHaveTextContent("i18n: reset");
  });

  test("announces the zoom range change, including with hideZoomControls", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    act(() => ref.current!.enterZoomMode());
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("Zoomed from 1 to 3");
  });
});
describe("CartesianChart: zoom focus and keyboard containment", { timeout: TEST_TIMEOUT }, () => {
  test("moves focus to the Zoom button when a controlled reset is not applied", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
      onZoomRangeChange,
    });
    getChart().findResetZoomButton()!.click();
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the Zoom button after resetting from the minimum range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the chart on Escape once the zoom controls are hidden mid-selection", () => {
    const { rerender } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    rerender({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    pressCursorKey(KeyCode.escape);
    expect(document.activeElement).toBe(getChart().findApplication()!.getElement());
  });

  test("does not collect cursor stops on a press when zoom is disabled", () => {
    renderCartesianChart(defaultProps);
    const chartSeries = getCurrentChart().series[0];
    const data = chartSeries.data;
    let reads = 0;
    Object.defineProperty(chartSeries, "data", {
      configurable: true,
      get: () => {
        reads++;
        return data;
      },
    });
    dispatchPointer("pointerdown", 1);
    expect(reads).toBe(0);
  });

  test("moves focus to the chart after a keyboard zoom when the buttons are hidden", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    act(() => ref.current!.enterZoomMode());
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(document.activeElement).toBe(getChart().findApplication()!.getElement());
  });

  test("keeps the keys the cursor handles from reaching the page", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const onPageKeyDown = vi.fn();
    document.addEventListener("keydown", onPageKeyDown);
    try {
      enterZoomMode();
      for (const keyCode of [KeyCode.right, KeyCode.pageUp, KeyCode.end, KeyCode.enter, KeyCode.escape]) {
        pressCursorKey(keyCode);
      }
      expect(onPageKeyDown).not.toHaveBeenCalled();

      enterZoomMode();
      pressCursorKey(KeyCode.tab);
      expect(onPageKeyDown).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener("keydown", onPageKeyDown);
    }
  });

  test("stops following a press when the chart unmounts mid-press", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    try {
      dispatchPointer("pointerdown", 1);
      cleanup();
      const removed = removeEventListener.mock.calls.map(([type]) => type);
      expect(removed).toEqual(expect.arrayContaining(["pointermove", "pointerup", "pointercancel"]));
    } finally {
      removeEventListener.mockRestore();
    }
  });
});

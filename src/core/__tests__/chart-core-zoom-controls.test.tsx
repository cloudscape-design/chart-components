// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
import {
  createChartWrapper as getChart,
  enterZoomMode,
  getCurrentChart,
  getXExtremes,
  getZoomRangeAffordance,
  keyboardZoomToIndexes,
  pressCursorKey,
} from "./common";
import { stubPlotGeometry } from "./plot-geometry";
import { dispatchPointer, onZoomRangeChange, renderZoomChart, TEST_TIMEOUT } from "./zoom-test-utils";

stubPlotGeometry();

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

describe("CoreChart: zoom selection, controls", { timeout: TEST_TIMEOUT }, () => {
  test("renders the Zoom button in idle state when zoom is enabled", () => {
    renderZoomChart({ zoom: { enabled: true } });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("Zoom");
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("labels the zoom controls region", () => {
    renderZoomChart({ zoom: { enabled: true } });
    const region = getChart().getElement().querySelector('[role="region"]')!;
    expect(region).toHaveAttribute("aria-label", "Chart zoom controls");
  });

  test("hides the built-in buttons with hideZoomControls, keeping the cursor available", () => {
    renderZoomChart({ zoom: { enabled: true, hideZoomControls: true } });
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomCursor()).not.toBe(null);
  });

  test("renders the zoom controls before the plot in DOM order", () => {
    renderZoomChart({ zoom: { enabled: true } });
    const zoomButton = getChart().findZoomButton()!.getElement();
    const position = zoomButton.compareDocumentPosition(getCurrentChart().container);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("clicking Zoom enters zoom mode and keeps the Zoom label", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("Zoom");
  });

  test("keeps the same accessible name on the Zoom button in zoom mode", () => {
    renderZoomChart({ zoom: { enabled: true } });
    const button = getChart().findZoomButton()!.getElement();
    expect(button).not.toHaveAttribute("aria-label");
    enterZoomMode();
    expect(button).not.toHaveAttribute("aria-label");
    expect(button).toHaveTextContent("Zoom");
  });

  test("clicking the pressed Zoom button returns to idle state", () => {
    renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("the Zoom button is a toggle button that is pressed in zoom mode", () => {
    renderZoomChart({ zoom: { enabled: true } });
    const button = getChart().findZoomButton()!.getElement();
    expect(button).toHaveAttribute("aria-pressed", "false");
    enterZoomMode();
    expect(getChart().findExitZoomButton()!.getElement()).toBe(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  test("the Reset button fires onZoomRangeChange with a null range", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);

    onZoomRangeChange.mockReset();
    getChart().findResetZoomButton()!.click();
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("controlled zoomRange applies extremes and shows the Reset button", () => {
    const { rerender } = renderZoomChart({ zoom: { enabled: true }, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findResetZoomButton()).toBe(null);

    rerender({
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getChart().findResetZoomButton()!.getElement()).toHaveTextContent("Reset");

    rerender({ zoom: { enabled: true }, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("marks the zoomed range with a band and boundary lines", () => {
    renderZoomChart({ zoom: { enabled: true } });
    expect(getZoomRangeAffordance().present).toBe(false);

    keyboardZoomToIndexes(1, 3);
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
  });

  test("clears the zoomed range affordance when the zoom is reset", () => {
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    getChart().findResetZoomButton()!.click();
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("marks the zoomed range of a controlled zoomRange", () => {
    const { rerender } = renderZoomChart({ zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);

    rerender({ zoom: { enabled: true }, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });

    rerender({ zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("keeps the zoomed range affordance while zoom mode is re-entered", () => {
    renderZoomChart({ zoom: { enabled: true } });
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
    renderZoomChart({
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
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("exiting a re-zoom returns to the zoomed state with the range intact", () => {
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("re-zooming narrows the range from the visible window", () => {
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getXExtremes()).toEqual({ min: 0, max: 1 });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    getChart().findResetZoomButton()!.click();
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
  });

  test("does not count points without a y value as cursor stops", () => {
    renderZoomChart({
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
    renderZoomChart({ zoom: { enabled: true }, visibleItems: [] });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("resolves the zoom strings from the I18nProvider", () => {
    renderZoomChart({
      zoom: { enabled: true },
      i18nProvider: {
        "[charts]": {
          "i18nStrings.enterZoomModeButtonText": "provider: zoom",
          "i18nStrings.zoomRangeChangeAnnouncementText": "provider: {startValue} to {endValue}",
        },
      },
    });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("provider: zoom");

    enterZoomMode();
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("provider: zoom");

    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("provider: 1 to 3");
  });
});
describe("CoreChart: zoom selection, focus and keyboard containment", { timeout: TEST_TIMEOUT }, () => {
  test("moves focus to the Zoom button after resetting from the minimum range", () => {
    renderZoomChart({ zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the chart on Escape once the zoom controls are hidden mid-selection", () => {
    const { rerender } = renderZoomChart({ zoom: { enabled: true } });
    enterZoomMode();
    rerender({ zoom: { enabled: true, hideZoomControls: true } });
    pressCursorKey(KeyCode.escape);
    expect(document.activeElement).toBe(getChart().findApplication()!.getElement());
  });

  test("does not collect cursor stops on a press when zoom is disabled", () => {
    renderZoomChart({});
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

  test("keeps the keys the cursor handles from reaching the page", () => {
    renderZoomChart({ zoom: { enabled: true } });
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
    renderZoomChart({ zoom: { enabled: true } });
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    try {
      enterZoomMode();
      dispatchPointer("pointerdown", 1);
      cleanup();
      const removed = removeEventListener.mock.calls.map(([type]) => type);
      expect(removed).toEqual(expect.arrayContaining(["pointerup", "pointercancel"]));
    } finally {
      removeEventListener.mockRestore();
    }
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { getChart, ref, renderCartesianChart } from "./common";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    type: "line",
    name: "Requests",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
      { x: 3, y: 25 },
      { x: 4, y: 40 },
    ],
  },
];

const defaultProps = {
  highcharts,
  series,
  xAxis: { title: "X", type: "linear" as const, min: 0, max: 4 },
  yAxis: { title: "Y", type: "linear" as const },
};

function getCurrentChart() {
  // Target the most recently rendered chart: highcharts.charts accumulates entries across tests
  // (disposed charts remain as holes), so the last defined entry is the one under test.
  return [...highcharts.charts].reverse().find((c) => c)!;
}

function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

// Reads the persistent zoom-range affordance drawn on the x-axis: the two boundary plot lines and
// the band tint between them. Returns their ids and the band's from/to so tests can assert on them.
function getZoomRangeOverlays() {
  const xAxis = getCurrentChart().xAxis[0] as unknown as {
    plotLinesAndBands: { id?: string; options?: { from?: number; to?: number } }[];
  };
  const items = xAxis.plotLinesAndBands ?? [];
  const startLine = items.find((i) => i.id === "awsui-zoom-range-start");
  const endLine = items.find((i) => i.id === "awsui-zoom-range-end");
  const band = items.find((i) => i.id === "awsui-zoom-range");
  return { startLine, endLine, band };
}

const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

describe("CartesianChart: zoom", () => {
  test("does not render zoom controls when zoom is not enabled", () => {
    renderCartesianChart(defaultProps);
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("renders the Zoom button in idle state when zoom is enabled", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("does not render built-in buttons when hideButtons is set", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideButtons: true } });
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("clicking Zoom enters zoom mode and shows the Exit zoom button", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).not.toBe(null);
  });

  test("clicking Exit zoom returns to idle state", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    act(() => getChart().findExitZoomButton()!.click());
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("ref.enterZoomMode / exitZoomMode toggle zoom mode", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => ref.current!.enterZoomMode());
    expect(getChart().findExitZoomButton()).not.toBe(null);
    act(() => ref.current!.exitZoomMode());
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("ref.resetZoom clears the extremes and fires onZoomRangeChange with null", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    // Programmatically zoom via the chart, then reset.
    act(() => {
      const chart = highcharts.charts.find((c) => c)!;
      chart.xAxis[0].setExtremes(1, 3);
    });
    act(() => ref.current!.resetZoom());
    const { min, max } = getXExtremes();
    expect(min).toBe(0);
    expect(max).toBe(4);
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("controlled zoomRange applies extremes to the chart", () => {
    const { rerender } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: null,
      onZoomRangeChange,
    });
    rerender({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
      onZoomRangeChange,
    });
    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(3);
    // In zoomed state the Reset button is shown.
    expect(getChart().findResetZoomButton()).not.toBe(null);
  });

  // Dispatches a keydown from a real element inside the chart (the core handler calls
  // target.closest, so a Document target would be rejected).
  function pressChartKey(key: string) {
    const chartEl = getChart().getElement();
    const target = chartEl.querySelector('[role="application"]') ?? chartEl;
    act(() => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
  }

  // Drives a full keyboard zoom to (startValue, endValue) over the default data points (x=0..4),
  // reaching the "zoomed" state through the real interaction (which sets extremes + the affordance).
  function keyboardZoomTo(startValue: number, endValue: number) {
    act(() => getChart().findZoomButton()!.click());
    // Cursor starts at the first visible data point (x=0 initially). Step to the start point.
    for (let i = 0; i < startValue; i++) {
      pressChartKey("ArrowRight");
    }
    pressChartKey("Enter");
    for (let i = 0; i < endValue - startValue; i++) {
      pressChartKey("ArrowRight");
    }
    pressChartKey("Enter");
  }

  test("keeps the Zoom button visible alongside Reset while zoomed", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomTo(1, 3);
    // Both controls are available in the zoomed state.
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("clicking Zoom while zoomed re-enters zoom mode and suppresses the range affordance", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomTo(1, 3);
    // Affordance present in the settled zoomed state.
    expect(getZoomRangeOverlays().band).toBeDefined();
    // Re-enter zoom mode: Zoom is replaced by Exit zoom, and the persistent affordance is hidden
    // so the new selection reads like a first-time zoom.
    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getZoomRangeOverlays().band).toBeUndefined();
  });

  test("exiting a re-zoom returns to the zoomed state with the range intact", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomTo(1, 3);
    act(() => getChart().findZoomButton()!.click());
    act(() => getChart().findExitZoomButton()!.click());
    // Back to zoomed (not idle): Reset and Zoom shown, extremes preserved, affordance restored.
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(3);
    expect(getZoomRangeOverlays().band?.options).toMatchObject({ from: 1, to: 3 });
  });

  test("re-zooming to a narrower range updates the extremes and affordance", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    // First zoom to the range (1, 4) so the visible window contains points 1..4.
    keyboardZoomTo(1, 4);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
    // Re-enter zoom mode: the cursor starts at the first visible point (x=1) thanks to the
    // in-view initial cursor. Select a narrower range (2, 3) within the current window.
    act(() => getChart().findZoomButton()!.click());
    pressChartKey("ArrowRight"); // x=2
    pressChartKey("Enter"); // start
    pressChartKey("ArrowRight"); // x=3
    pressChartKey("Enter"); // end → zoom
    expect(getXExtremes()).toEqual({ min: 2, max: 3 });
    expect(getZoomRangeOverlays().band?.options).toMatchObject({ from: 2, to: 3 });
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("Escape during a re-zoom returns to the zoomed state without changing the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomTo(1, 3);
    onZoomRangeChange.mockClear();
    act(() => getChart().findZoomButton()!.click());
    pressChartKey("ArrowRight");
    pressChartKey("Escape");
    // Range unchanged and back in the zoomed state; no new zoom event fired by the cancel.
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getZoomRangeOverlays().band?.options).toMatchObject({ from: 1, to: 3 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("controlled zoomRange=null resets the extremes", () => {
    const { rerender } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
      onZoomRangeChange,
    });
    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: null, onZoomRangeChange });
    const { min, max } = getXExtremes();
    expect(min).toBe(0);
    expect(max).toBe(4);
  });

  test("Escape exits zoom mode", () => {
    const { wrapper } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findExitZoomButton()).not.toBe(null);
    // Dispatch from a real element in the chart so the core keydown handler (which calls
    // target.closest) receives a valid Element target.
    const target = wrapper.getElement().querySelector('[role="application"]') ?? wrapper.getElement();
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("applies i18nStrings overrides to the zoom controls", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nStrings: {
        enterZoomModeButtonText: "Vergrößern",
        enterZoomModeButtonAriaLabel: "Zoom-Modus aktivieren",
      },
    });
    const button = getChart().findZoomButton()!;
    expect(button.getElement().textContent).toContain("Vergrößern");
    expect(button.getElement()).toHaveAttribute("aria-label", "Zoom-Modus aktivieren");
  });

  test("draws the zoom-range boundary lines and band when zoomed via ref", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    // Not zoomed yet — no affordance.
    expect(getZoomRangeOverlays().band).toBeUndefined();
    act(() => ref.current!.enterZoomMode());
    // Keyboard-select a range: x=1 to x=3.
    const chartEl = getChart().getElement();
    const target = chartEl.querySelector('[role="application"]') ?? chartEl;
    const press = (key: string) =>
      act(() => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
    press("ArrowRight");
    press("Enter");
    press("ArrowRight");
    press("ArrowRight");
    press("Enter");

    const { startLine, endLine, band } = getZoomRangeOverlays();
    expect(startLine).toBeDefined();
    expect(endLine).toBeDefined();
    expect(band?.options).toMatchObject({ from: 1, to: 3 });
  });

  test("clears the zoom-range affordance when zoom is reset", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => {
      const chart = highcharts.charts.find((c) => c)!;
      chart.xAxis[0].setExtremes(1, 3);
    });
    act(() => ref.current!.resetZoom());
    const { startLine, endLine, band } = getZoomRangeOverlays();
    expect(startLine).toBeUndefined();
    expect(endLine).toBeUndefined();
    expect(band).toBeUndefined();
  });

  test("controlled zoomRange draws the boundary affordance", () => {
    const { rerender } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: null,
      onZoomRangeChange,
    });
    expect(getZoomRangeOverlays().band).toBeUndefined();
    rerender({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
      onZoomRangeChange,
    });
    expect(getZoomRangeOverlays().band?.options).toMatchObject({ from: 1, to: 3 });
    // Resetting via controlled null clears the affordance.
    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: null, onZoomRangeChange });
    expect(getZoomRangeOverlays().band).toBeUndefined();
  });

  test("exposes a labelled zoom controls region", () => {
    const { wrapper } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nStrings: { zoomControlsAriaLabel: "Custom zoom region" },
    });
    const el = wrapper.getElement().querySelector('[role="region"][aria-label="Custom zoom region"]');
    expect(el).not.toBe(null);
  });
});

describe("CartesianChart: zoom keyboard", () => {
  // Dispatch keydown from a real element inside the chart so the core keydown handler (which calls
  // target.closest) receives a valid Element target instead of the Document.
  function pressKey(key: string) {
    const chartEl = getChart().getElement();
    const target = chartEl.querySelector('[role="application"]') ?? chartEl;
    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  }

  test("arrow keys move the cursor and Enter sets start then end to zoom", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    // Enter zoom mode — cursor starts at the first data point (x=0).
    act(() => getChart().findZoomButton()!.click());

    // Move the cursor right to x=1 and set the start point.
    pressKey("ArrowRight");
    pressKey("Enter");
    // Move the cursor right to x=3 and set the end point → zoom applies.
    pressKey("ArrowRight");
    pressKey("ArrowRight");
    pressKey("Enter");

    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(3);
    expect(onZoomRangeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
    // After zooming, the Reset button is shown.
    expect(getChart().findResetZoomButton()).not.toBe(null);
  });

  test("Space also sets zoom points", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());
    pressKey("ArrowRight"); // cursor at x=1
    pressKey(" "); // set start
    pressKey("ArrowRight"); // cursor at x=2
    pressKey(" "); // set end → zoom
    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(2);
  });

  test("Escape cancels an in-progress keyboard selection without zooming", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());
    pressKey("ArrowRight");
    pressKey("Enter"); // start point set, now selecting
    pressKey("Escape"); // cancel
    const { min, max } = getXExtremes();
    expect(min).toBe(0);
    expect(max).toBe(4);
    // Back to idle: the Zoom button is shown again.
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("renders UAP direction buttons in zoom mode", () => {
    const { wrapper } = renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    const prev = document.querySelector('button[aria-label="Move zoom cursor left"]');
    const next = document.querySelector('button[aria-label="Move zoom cursor right"]');
    expect(prev).not.toBe(null);
    expect(next).not.toBe(null);
    void wrapper;
  });

  test("direction buttons move the cursor", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());
    const next = document.querySelector('button[aria-label="Move zoom cursor right"]') as HTMLButtonElement;
    // Move cursor to x=1 via the button, set start via keyboard.
    act(() => next.click());
    pressKey("Enter");
    // Move cursor to x=2 via the button, set end → zoom.
    act(() => next.click());
    pressKey("Enter");
    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(2);
  });
});

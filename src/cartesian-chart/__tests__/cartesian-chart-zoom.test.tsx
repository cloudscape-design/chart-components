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

function getXExtremes() {
  // Target the most recently rendered chart: highcharts.charts accumulates entries across tests
  // (disposed charts remain as holes), so the last defined entry is the one under test.
  const chart = [...highcharts.charts].reverse().find((c) => c)!;
  const { min, max } = chart.xAxis[0].getExtremes();
  return { min, max };
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

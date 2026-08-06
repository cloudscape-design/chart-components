// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { getChart, ref, renderCartesianChart } from "./common";

// Every test here renders a real chart, which takes ~2s in jsdom, and the zoom interactions re-render
// it repeatedly. That leaves too little headroom under the 5s default when the suite runs in parallel.
const TEST_TIMEOUT = 15_000;

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

// Dispatches a keydown from an element inside the chart. The core keydown handler calls
// target.closest, which a Document target would not satisfy.
function pressChartKey(key: string) {
  const chartElement = getChart().getElement();
  const target = chartElement.querySelector('[role="application"]') ?? chartElement;
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

// Drives a keyboard zoom over the default data points, from the first point to two steps along.
function zoomViaKeyboard() {
  act(() => getChart().findZoomButton()!.click());
  pressChartKey("ArrowRight");
  pressChartKey("Enter");
  pressChartKey("ArrowRight");
  pressChartKey("Enter");
}

// Moves the pointer to a chart-relative x position over the plot, which drives the zoom cursor.
function movePointerTo(chartX: number) {
  const chart = getCurrentChart();
  act(() => {
    chart.container.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: chartX, clientY: chart.plotTop + 5 }),
    );
  });
}

// Reads the persistent zoom-range affordance drawn on the x-axis: the two boundary plot lines and
// the band tint between them. Returns their ids and the band's from/to so tests can assert on them.
function getZoomRangeOverlays() {
  const items = getPlotLinesAndBands();
  const startLine = items.find((i) => i.id === "awsui-zoom-range-start");
  const endLine = items.find((i) => i.id === "awsui-zoom-range-end");
  const band = items.find((i) => i.id === "awsui-zoom-range");
  return { startLine, endLine, band };
}

function getPlotLinesAndBands() {
  const xAxis = getCurrentChart().xAxis[0] as unknown as {
    plotLinesAndBands: {
      id?: string;
      options?: { from?: number; to?: number; value?: number; color?: string };
    }[];
  };
  return xAxis.plotLinesAndBands ?? [];
}

// Reads the dividers drawn at the edges of the native drag-to-zoom selection.
function getDragBoundaries() {
  const items = getPlotLinesAndBands();
  return {
    startLine: items.find((i) => i.id === "awsui-zoom-drag-start"),
    endLine: items.find((i) => i.id === "awsui-zoom-drag-end"),
  };
}

// Simulates a frame of the native drag-to-zoom by asking the pointer for the selection marker
// rectangle it would draw, which is what the component listens to.
function dragSelectionFrame({ chartX }: { chartX: number }) {
  const pointer = getCurrentChart().pointer as unknown as {
    getSelectionMarkerAttrs(chartX: number, chartY: number): { attrs: { x?: number; width?: number } };
  };
  const chart = getCurrentChart();
  return pointer.getSelectionMarkerAttrs(chartX, chart.plotTop + 1).attrs;
}

const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

describe("CartesianChart: zoom", { timeout: TEST_TIMEOUT }, () => {
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

  test("clicking Zoom while zoomed re-enters zoom mode and keeps the range affordance", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomTo(1, 3);
    // Affordance present in the settled zoomed state.
    expect(getZoomRangeOverlays().band).toBeDefined();
    // Re-enter zoom mode: Zoom is replaced by Exit zoom. The affordance stays on screen so the
    // range already in view remains visible while a narrower one is selected inside it.
    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getZoomRangeOverlays().band).toBeDefined();
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

  test("draws boundary dividers at the edges of a drag-to-zoom selection", async () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const chart = getCurrentChart();
    // No drag in progress: no dividers.
    expect(getDragBoundaries().startLine).toBeUndefined();
    expect(getDragBoundaries().endLine).toBeUndefined();

    // Highcharts derives the selection rectangle from where the pointer went down, so seed that and
    // then run a drag frame; the dividers follow the resulting rectangle's edges.
    Object.assign(chart, { mouseDownX: chart.plotLeft + 10, mouseDownY: chart.plotTop + 1 });
    let attrs!: { x?: number; width?: number };
    act(() => {
      attrs = dragSelectionFrame({ chartX: chart.plotLeft + 50 });
    });
    expect(attrs.x).toEqual(expect.any(Number));

    await vi.waitFor(() => expect(getDragBoundaries().startLine).toBeDefined());
    const { startLine, endLine } = getDragBoundaries();
    expect(endLine).toBeDefined();
    // The dividers map back to the axis values under the rectangle's left and right edges.
    const toValue = (pixelX: number) => chart.xAxis[0].toValue(pixelX - chart.plotLeft, true);
    expect(startLine!.options!.value).toBeCloseTo(toValue(attrs.x!), 5);
    expect(endLine!.options!.value).toBeCloseTo(toValue(attrs.x! + attrs.width!), 5);
    // Both use the same divider styling as the click/keyboard selection lines.
    expect(startLine!.options!.color).toBe(endLine!.options!.color);

    // Releasing the drag clears them again.
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect(getDragBoundaries().startLine).toBeUndefined();
    expect(getDragBoundaries().endLine).toBeUndefined();
  });

  test("snaps a click to the nearest data point", () => {
    // No min/max here, so Highcharts applies its default axis padding and the plot extends slightly
    // beyond the first and last points — the strip the keyboard cursor can never reach.
    renderCartesianChart({
      ...defaultProps,
      xAxis: { title: "X", type: "linear" as const },
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    const chart = getCurrentChart();
    act(() => getChart().findZoomButton()!.click());

    // Move the pointer into that leading padding: the raw value there is below the first point (x=0).
    const leadingEdgeX = chart.plotLeft + 1;
    expect(chart.xAxis[0].toValue(leadingEdgeX, false)).toBeLessThan(0);
    // Committing with the keyboard uses wherever the pointer left the cursor, so this asserts on the
    // position the pointer produced.
    movePointerTo(leadingEdgeX);
    pressChartKey("Enter");
    // Then move between two points, nearer x=2 than x=3, and commit.
    movePointerTo(chart.xAxis[0].toPixels(2.4, false));
    pressChartKey("Enter");

    // Both ends land on real data points, so a pointer selection is expressible by the keyboard too.
    expect(onZoomRangeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 0, endValue: 2 } } } }),
    );
  });

  test("hides the zoom controls when no series with data points are visible", () => {
    // Zooming needs points to select between, so the controls are not offered in the no-data state.
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, visibleSeries: [] });
    expect(getChart().findZoomButton()).toBe(null);
    // The ref method is guarded too, since it bypasses the buttons entirely.
    act(() => ref.current!.enterZoomMode());
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("does not offer zooming for threshold-only charts", () => {
    // Thresholds span the whole axis and contribute no points of their own.
    renderCartesianChart({
      ...defaultProps,
      series: [{ type: "y-threshold", name: "SLA limit", value: 20 }],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()).toBe(null);
  });

  test("leaves zoom mode when the last visible series is hidden mid-selection", () => {
    const { rerender } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      visibleSeries: ["Requests"],
    });
    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findExitZoomButton()).not.toBe(null);

    // Hiding everything mid-selection leaves the cursor with nothing to land on, so zoom mode ends
    // rather than stranding the user in a selection they cannot complete.
    rerender({ ...defaultProps, zoom: { enabled: true }, visibleSeries: [] });
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("announces when the built-in buttons are hidden", async () => {
    // A consumer using hideButtons with its own controls still needs the announcements.
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideButtons: true } });
    act(() => ref.current!.enterZoomMode());
    // The live region applies its text after an internal delay that can exceed waitFor's default
    // timeout, so allow longer here.
    await vi.waitFor(
      () =>
        expect([...document.querySelectorAll("[aria-live]")].map((n) => n.textContent).join("")).toContain("Zoom mode"),
      { timeout: 5000 },
    );
  });

  test("leaves the selection states after completing a selection in controlled mode", () => {
    // The consumer owns the extremes and may ignore the event or re-apply the same range, in which
    // case the zoomRange effect does not run. The selection is over regardless, so the chart must
    // not stay in zoom mode with the tooltip suppressed and clicks still setting range points.
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());
    pressChartKey("Enter");
    pressChartKey("ArrowRight");
    pressChartKey("Enter");

    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    // The range is still only reported — applying it remains the consumer's job.
    expect(onZoomRangeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 0, endValue: 1 } } } }),
    );
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
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

describe("CartesianChart: zoom keyboard", { timeout: TEST_TIMEOUT }, () => {
  test("arrow keys move the cursor and Enter sets start then end to zoom", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    // Enter zoom mode — cursor starts at the first data point (x=0).
    act(() => getChart().findZoomButton()!.click());

    // Move the cursor right to x=1 and set the start point.
    pressChartKey("ArrowRight");
    pressChartKey("Enter");
    // Move the cursor right to x=3 and set the end point → zoom applies.
    pressChartKey("ArrowRight");
    pressChartKey("ArrowRight");
    pressChartKey("Enter");

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
    pressChartKey("ArrowRight"); // cursor at x=1
    pressChartKey(" "); // set start
    pressChartKey("ArrowRight"); // cursor at x=2
    pressChartKey(" "); // set end → zoom
    const { min, max } = getXExtremes();
    expect(min).toBe(1);
    expect(max).toBe(2);
  });

  test("Escape cancels an in-progress keyboard selection without zooming", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());
    pressChartKey("ArrowRight");
    pressChartKey("Enter"); // start point set, now selecting
    pressChartKey("Escape"); // cancel
    const { min, max } = getXExtremes();
    expect(min).toBe(0);
    expect(max).toBe(4);
    // Back to idle: the Zoom button is shown again.
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("announces a range selected by dragging, in both controlled and uncontrolled mode", async () => {
    const announcement = () =>
      [...document.querySelectorAll("[aria-live]")].map((n) => n.textContent?.trim()).join(" ");

    // Uncontrolled: Highcharts applies the extremes and we observe them.
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getCurrentChart().xAxis[0].setExtremes(1, 3, true, false, { trigger: "zoom" }));
    await vi.waitFor(() => expect(announcement()).toContain("Zoomed from 1 to 3"), { timeout: 5000 });

    // Controlled: the extremes are the consumer's to apply, but the drag still needs confirming —
    // this path previously fired the event without announcing anything.
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null, onZoomRangeChange });
    act(() => getCurrentChart().xAxis[0].setExtremes(1, 2, true, false, { trigger: "zoom" }));
    await vi.waitFor(() => expect(announcement()).toContain("Zoomed from 1 to 2"), { timeout: 5000 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  test("ignores zoom keys dispatched outside the chart", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    act(() => getChart().findZoomButton()!.click());

    // A key press that did not originate inside the chart must not drive the zoom cursor: another
    // chart in zoom mode, or a dialog opened over this one, would otherwise move this chart's cursor.
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    act(() => {
      outside.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      outside.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      outside.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      outside.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    // Still in zoom mode, with nothing selected and no zoom applied.
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });

    // Escape from outside must not exit zoom mode either.
    act(() => {
      outside.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(getChart().findExitZoomButton()).not.toBe(null);

    outside.remove();
  });

  test("announces exiting zoom mode and resetting the zoom", async () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    // The live region is rendered in a portal outside the chart, and its text is applied after a
    // short delay, so it is searched for from the document root and awaited.
    const announcement = () => [...document.querySelectorAll("[aria-live]")].map((n) => n.textContent?.trim()).join("");

    // Leaving zoom mode is a state change, so it is announced rather than left silent.
    act(() => getChart().findZoomButton()!.click());
    act(() => getChart().findExitZoomButton()!.click());
    await vi.waitFor(() => expect(announcement()).toBe("Zoom mode cancelled"));

    // So is returning to the full data range.
    zoomViaKeyboard();
    act(() => getChart().findResetZoomButton()!.click());
    await vi.waitFor(() => expect(announcement()).toBe("Zoom reset. Showing the full data range."));
  });

  test("moves focus to the Exit zoom button when zoom mode is entered", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    // The activated button is replaced by "Exit zoom", so focus lands there. Leaving focus on the plot
    // would make the exit unreachable: tabbing forward walks into the chart's own data points.
    expect(document.activeElement).toBe(getChart().findExitZoomButton()!.getElement());

    // The keys must still drive the cursor from there, rather than only working on the plot.
    pressChartKey("ArrowRight");
    pressChartKey("Enter");
    pressChartKey("ArrowRight");
    pressChartKey("Enter");
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
  });

  test("moves focus to the Zoom button when Reset is activated", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    zoomViaKeyboard();
    // Applying the zoom lands focus on the newly shown Reset button.
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());

    // Reset removes that button, so focus moves to Zoom, which takes its place — rather than being
    // dropped to the body, which would send keyboard users back to the top of the page.
    act(() => getChart().findResetZoomButton()!.click());
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("renders the zoom cursor buttons in zoom mode only", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getChart().findZoomCursorPreviousButton()).toBe(null);
    expect(getChart().findZoomCursorNextButton()).toBe(null);

    act(() => getChart().findZoomButton()!.click());
    expect(getChart().findZoomCursorPreviousButton()).not.toBe(null);
    expect(getChart().findZoomCursorNextButton()).not.toBe(null);

    act(() => getChart().findExitZoomButton()!.click());
    expect(getChart().findZoomCursorPreviousButton()).toBe(null);
    expect(getChart().findZoomCursorNextButton()).toBe(null);
  });

  test("zoom cursor buttons move the cursor and are disabled at the ends of the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    // The cursor starts on the first point, so it cannot move any further towards the start.
    expect(getChart().findZoomCursorPreviousButton()!.getElement()).toHaveProperty("disabled", true);

    const next = () => getChart().findZoomCursorNextButton()!.getElement();
    // Move the cursor to x=1 with the button, then set the start of the range.
    act(() => next().click());
    pressChartKey("Enter");
    // Move the cursor to x=2 with the button, then set the end of the range, applying the zoom.
    act(() => next().click());
    pressChartKey("Enter");
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
  });

  test("zoom cursor buttons step back towards the start of the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    act(() => getChart().findZoomButton()!.click());
    // Move to the last point, where the cursor cannot move any further towards the end.
    for (let i = 0; i < 4; i++) {
      act(() => getChart().findZoomCursorNextButton()!.getElement().click());
    }
    expect(getChart().findZoomCursorNextButton()!.getElement()).toHaveProperty("disabled", true);

    // Step back to x=3 and zoom from there to the last point.
    act(() => getChart().findZoomCursorPreviousButton()!.getElement().click());
    pressChartKey("Enter");
    act(() => getChart().findZoomCursorNextButton()!.getElement().click());
    pressChartKey("Enter");
    expect(getXExtremes()).toEqual({ min: 3, max: 4 });
  });

  test("a range selected by dragging is reported but not applied when the range is controlled", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: null,
      onZoomRangeChange,
    });
    // Dragging across the plot makes Highcharts apply the extremes itself. The consumer owns the range
    // here and ignores the event, so the chart must stay at the full range it was given.
    act(() => {
      getCurrentChart().xAxis[0].setExtremes(1, 3, true, false, { trigger: "zoom" });
    });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
  });
});

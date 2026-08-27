// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
// The error bar series type is only available with the highcharts-more module.
import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { getChart, ref, renderCartesianChart } from "./common";

// Every test here renders a real chart, which takes ~2s in jsdom, and the zoom interactions re-render
// it multiple times.
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

const onZoomRangeChange = vi.fn();

// Pointer interactions are hit-tested against the plot area, so the chart needs a plot area with a
// real size. Highcharts derives it from two browser APIs that jsdom does not implement faithfully:
//
// 1. SVGElement.getBBox, which jsdom does not provide at all, so all rendered text measures as
//    undefined and every axis label offset becomes NaN.
// 2. The computed font size of the axis labels, which Highcharts parses into label metrics. Our
//    labels are styled with Cloudscape design tokens (`var(--font-size-body-s, 12px)`), and jsdom
//    returns the declaration verbatim instead of resolving it, which parses to NaN.
//
// Both make chart.plotHeight NaN, and every plot-area hit test then fails. Browsers resolve both,
// so the stubs below bring jsdom's geometry in line with the browser rather than papering over a
// product defect. Drag zooming is additionally covered end-to-end in test/functional.
const nativeGetComputedStyle = window.getComputedStyle.bind(window);
const nativeGetBBox = (SVGElement.prototype as { getBBox?: () => DOMRect }).getBBox;

function resolveCustomProperty(value: string) {
  const customPropertyWithFallback = /^var\(\s*--[\w-]+\s*,\s*([^)]+)\)$/.exec(value.trim());
  return customPropertyWithFallback ? customPropertyWithFallback[1].trim() : value;
}

beforeAll(() => {
  (SVGElement.prototype as { getBBox?: () => object }).getBBox = () => ({ x: 0, y: 0, width: 20, height: 12 });
  window.getComputedStyle = ((element: Element, pseudoElement?: null | string) => {
    const style = nativeGetComputedStyle(element, pseudoElement);
    return new Proxy(style, {
      get(target, property) {
        if (property === "getPropertyValue") {
          return (name: string) => resolveCustomProperty(target.getPropertyValue(name));
        }
        const value = Reflect.get(target, property, target);
        if (typeof value === "function") {
          return value.bind(target);
        }
        return typeof value === "string" ? resolveCustomProperty(value) : value;
      },
    });
  }) as typeof window.getComputedStyle;
});

afterAll(() => {
  if (nativeGetBBox) {
    (SVGElement.prototype as { getBBox?: unknown }).getBBox = nativeGetBBox;
  } else {
    delete (SVGElement.prototype as { getBBox?: unknown }).getBBox;
  }
  window.getComputedStyle = nativeGetComputedStyle;
});

afterEach(() => {
  onZoomRangeChange.mockReset();
  document.querySelectorAll("[data-testid='outside']").forEach((element) => element.remove());
});

function getCurrentChart() {
  // Target the most recently rendered chart: highcharts.charts accumulates entries across tests
  // (disposed charts remain as holes), so the last defined entry is the one under test.
  return [...highcharts.charts].reverse().find((c) => c)!;
}

function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

// The zoom affordances are DOM elements laid over the plot, positioned imperatively and hidden with
// `visibility` so their layout box survives. The overlay is the cursor's parent, and its children are
// in a fixed order (see zoom-overlay.tsx).
function getOverlay() {
  const cursor = getChart().findZoomCursor()!.getElement() as HTMLElement;
  const overlay = cursor.parentElement!;
  const [band, startDivider, endDivider] = Array.from(overlay.children) as HTMLElement[];
  return { overlay, band, startDivider, endDivider, cursor };
}

function isVisible(element: HTMLElement) {
  return element.style.visibility === "visible";
}

function enterZoomMode() {
  getChart().findZoomButton()!.click();
}

function pressCursorKey(keyCode: number) {
  getChart().findZoomCursor()!.keydown(keyCode);
}

function pressCursorKeyTimes(keyCode: number, times: number) {
  for (let i = 0; i < times; i++) {
    pressCursorKey(keyCode);
  }
}

function getCursorAttributes() {
  const cursor = getChart().findZoomCursor()!.getElement();
  return {
    min: cursor.getAttribute("aria-valuemin"),
    max: cursor.getAttribute("aria-valuemax"),
    now: cursor.getAttribute("aria-valuenow"),
    text: cursor.getAttribute("aria-valuetext"),
  };
}

// Drives a full keyboard zoom over the visible points, by index: the cursor starts at the first
// visible point, so stepping right N times lands on the N-th visible point.
function keyboardZoomToIndexes(startIndex: number, endIndex: number) {
  enterZoomMode();
  pressCursorKeyTimes(KeyCode.right, startIndex);
  pressCursorKey(KeyCode.enter);
  pressCursorKeyTimes(KeyCode.right, endIndex - startIndex);
  pressCursorKey(KeyCode.enter);
}

// Pointer events are dispatched on the Highcharts container and bubble to the plot wrapper that holds
// the zoom handlers. In jsdom the container has no offset and no scaling, so a chart-relative pixel
// (what Axis.toPixels returns) is also the client coordinate.
function pointerEventAtValue(type: string, value: number, offsetX = 0, init: PointerEventInit = {}) {
  const chart = getCurrentChart();
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    buttons: 1,
    clientX: chart.xAxis[0].toPixels(value, false) + offsetX,
    clientY: chart.plotTop + chart.plotHeight / 2,
    ...init,
  });
}

function dispatchPointer(type: string, value: number, offsetX = 0, init: PointerEventInit = {}) {
  const event = pointerEventAtValue(type, value, offsetX, init);
  act(() => {
    getCurrentChart().container.dispatchEvent(event);
  });
}

function focusOutsideChart() {
  const button = document.createElement("button");
  button.setAttribute("data-testid", "outside");
  document.body.appendChild(button);
  act(() => button.focus());
  return button;
}

describe("CartesianChart: zoom controls", { timeout: TEST_TIMEOUT }, () => {
  test("renders no zoom affordances when zoom is not enabled", () => {
    renderCartesianChart(defaultProps);
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getChart().findZoomCursor()).toBe(null);
  });

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

  test("hides the built-in buttons with hideButtons, keeping the cursor available", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideButtons: true } });
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomCursor()).not.toBe(null);
  });

  // The controls render in the chart's header area, in normal flow, so they precede the plot in the
  // DOM and therefore in the focus order.
  test("renders the zoom controls before the plot in DOM order", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const zoomButton = getChart().findZoomButton()!.getElement();
    const position = zoomButton.compareDocumentPosition(getCurrentChart().container);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("clicking Zoom enters zoom mode and shows the Exit zoom button", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("Exit zoom");
  });

  test("clicking Exit zoom returns to idle state", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
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

  test("ref.resetZoom restores the full range after a zoom", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    onZoomRangeChange.mockReset();
    act(() => ref.current!.resetZoom());
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("ref.resetZoom does not fire an event when the chart is not zoomed", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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

  test("controlled zoomRange is not changed by the interaction, which only fires the event", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      zoomRange: null,
      onZoomRangeChange,
    });
    keyboardZoomToIndexes(1, 3);
    // The consumer owns the range, so the chart still shows the full range, but the selection is over.
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("keeps the Zoom button visible alongside Reset while zoomed", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getChart().findResetZoomButton()).not.toBe(null);
  });

  test("re-entering zoom mode while zoomed keeps the range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);
    // The Reset button steps aside while a new range is being selected.
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
    // The visible window now holds x=1..4, and the cursor starts at its first point (x=1).
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

  // Zooming to two adjacent points leaves no room for another zoom, so the button is disabled rather
  // than doing nothing when pressed.
  test("disables the Zoom button once zoomed to the minimum range", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getXExtremes()).toEqual({ min: 0, max: 1 });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    // Resetting makes zooming available again.
    getChart().findResetZoomButton()!.click();
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
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

  test("leaves zoom mode when the last series is hidden mid-selection", () => {
    // The series visibility stays controlled for the lifetime of the component: switching from
    // uncontrolled to controlled is not supported and the update would be ignored.
    const { rerender } = renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      visibleSeries: ["Requests"],
    });
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);

    rerender({ ...defaultProps, zoom: { enabled: true }, visibleSeries: [] });
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("supports i18n overrides for the zoom controls", () => {
    renderCartesianChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nStrings: {
        enterZoomModeButtonText: "Vergrößern",
        exitZoomModeButtonText: "Abbrechen",
        resetZoomButtonText: "Zurücksetzen",
        zoomControlsAriaLabel: "Zoom-Steuerung",
      },
    });
    expect(getChart().getElement().querySelector('[role="region"]')).toHaveAttribute("aria-label", "Zoom-Steuerung");
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("Vergrößern");

    enterZoomMode();
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("Abbrechen");

    getChart().findExitZoomButton()!.click();
    keyboardZoomToIndexes(1, 3);
    expect(getChart().findResetZoomButton()!.getElement()).toHaveTextContent("Zurücksetzen");
  });

  test("announces the zoom range change, including with hideButtons", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true, hideButtons: true } });
    act(() => ref.current!.enterZoomMode());
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("Zoomed from 1 to 3");
  });
});

describe("CartesianChart: zoom keyboard interaction", { timeout: TEST_TIMEOUT }, () => {
  test("selects a range with arrow keys and Enter", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 3 } } } }),
    );
  });

  test("selects a range with Space", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.space);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.space);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
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

  test("steps the cursor with PageUp and PageDown", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    // With five points a page step is a single point.
    pressCursorKey(KeyCode.pageUp);
    expect(getCursorAttributes().now).toBe("1");
    pressCursorKey(KeyCode.pageDown);
    expect(getCursorAttributes().now).toBe("0");
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

  // A range of a single point has no width, so the chart cannot display it and the user cannot zoom
  // out of it. The start point stays set instead.
  test("rejects a selection of a single point", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
    // Still selecting, and completing the range from here works.
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

    // Once the start point is set, the value text describes the range being selected.
    pressCursorKey(KeyCode.enter);
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes()).toEqual({
      min: "0",
      max: "4",
      now: "2",
      text: "Selecting zoom range from 1 to 2",
    });
  });

  test("moves focus to Reset after zooming, and back to Zoom after resetting", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());

    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the Zoom button when the selection is cancelled", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.escape);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  // Focus leaving the chart abandons the selection, so the chart is never left in an active zoom
  // state the user cannot see the focus for.
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

  // Once zoomed, the cursor may only travel inside the visible window. Highcharts keeps the
  // out-of-range points in the series (below cropThreshold), so the stops are recomputed from the
  // current extremes rather than from the full data.
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

describe("CartesianChart: zoom cursor buttons", { timeout: TEST_TIMEOUT }, () => {
  test("renders the cursor buttons outside the tab order", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const buttons = [
      getChart().findZoomCursorPreviousButton()!,
      getChart().findZoomCursorCommitButton()!,
      getChart().findZoomCursorNextButton()!,
    ];
    for (const button of buttons) {
      expect(button.getElement()).toHaveAttribute("tabindex", "-1");
    }
    expect(buttons.map((button) => button.getElement().getAttribute("aria-label"))).toEqual([
      "Move zoom cursor left",
      "Set zoom point",
      "Move zoom cursor right",
    ]);
  });

  test("selects a full range with the cursor buttons only", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    getChart().findZoomCursorNextButton()!.click();
    getChart().findZoomCursorCommitButton()!.click();
    getChart().findZoomCursorNextButton()!.click();
    getChart().findZoomCursorCommitButton()!.click();
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  test("keeps clicking the cursor buttons out of the focus order", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    getChart().findZoomCursorNextButton()!.click();
    // The cursor keeps the focus, so arrow keys continue to work after using the buttons.
    expect(document.activeElement).toBe(getChart().findZoomCursor()!.getElement());
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes().now).toBe("2");
  });

  test("keeps the cursor buttons enabled at the range edges", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    const previousButton = getChart().findZoomCursorPreviousButton()!.getElement() as HTMLButtonElement;
    expect(previousButton.disabled).toBe(false);
    getChart().findZoomCursorPreviousButton()!.click();
    expect(getCursorAttributes().now).toBe("0");
    expect(previousButton.disabled).toBe(false);
  });
});

describe("CartesianChart: zoom overlay", { timeout: TEST_TIMEOUT }, () => {
  // The overlay must draw nothing while idle: a highlight left on the chart after a zoom looks like a
  // pending selection, and on an empty chart it looks like a rendering artifact.
  test("draws nothing while idle", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    const { band, startDivider, endDivider, cursor } = getOverlay();
    for (const element of [band, startDivider, endDivider, cursor]) {
      expect(isVisible(element)).toBe(false);
    }
  });

  test("draws nothing after a committed zoom", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    const { band, startDivider, endDivider, cursor } = getOverlay();
    for (const element of [band, startDivider, endDivider, cursor]) {
      expect(isVisible(element)).toBe(false);
    }
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

  // A press with a small amount of travel is a click, not a drag: zooming on it would make the chart
  // impossible to click.
  test("does not zoom on a press that does not pass the drag threshold", () => {
    renderCartesianChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 1, 5);
    dispatchPointer("pointerup", 1, 5);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  // A drag that stays within one data point would produce a range with no width.
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

describe("CartesianChart: zoom with other series types", { timeout: TEST_TIMEOUT }, () => {
  // Highcharts computes a minRange of its own (five times the closest data range) when the axis has no
  // explicit bounds, and silently widens any narrower range. Grouped column charts hit this most
  // visibly, because zooming into a couple of categories appeared to do nothing.
  test("zooms into two adjacent points without explicit axis bounds", () => {
    renderCartesianChart({
      highcharts,
      series: [
        {
          type: "column",
          name: "A",
          data: [
            { x: 0, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 4 },
            { x: 4, y: 5 },
          ],
        },
        {
          type: "column",
          name: "B",
          data: [
            { x: 0, y: 2 },
            { x: 1, y: 3 },
            { x: 2, y: 4 },
            { x: 3, y: 5 },
            { x: 4, y: 6 },
          ],
        },
      ],
      xAxis: { title: "X", type: "linear" as const },
      yAxis: { title: "Y", type: "linear" as const },
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    keyboardZoomToIndexes(1, 2);
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  // Error bar data items may omit x, in which case Highcharts assigns index-based x values that have
  // nothing to do with the x values of the series they are linked to. They must not become cursor stops.
  test("ignores error bar series when collecting cursor stops", () => {
    renderCartesianChart({
      highcharts,
      series: [
        {
          type: "line",
          id: "line",
          name: "Line",
          data: [
            { x: 0, y: 10 },
            { x: 10, y: 20 },
            { x: 20, y: 30 },
            { x: 30, y: 25 },
            { x: 40, y: 40 },
          ],
        },
        {
          type: "errorbar",
          linkedTo: "line",
          name: "Error",
          data: [
            { low: 8, high: 12 },
            { low: 18, high: 22 },
            { low: 28, high: 32 },
            { low: 23, high: 27 },
            { low: 38, high: 42 },
          ],
        },
      ],
      xAxis: { title: "X", type: "linear" as const },
      yAxis: { title: "Y", type: "linear" as const },
      zoom: { enabled: true },
      onZoomRangeChange,
    } as any);
    enterZoomMode();
    // The index-based x values of the error bars (0..4) do not add stops of their own.
    expect(getCursorAttributes()).toEqual({ min: "0", max: "40", now: "0", text: "0" });
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes().now).toBe("10");

    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 10, max: 30 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 10, endValue: 30 } } } }),
    );
  });

  test("zooms an inverted chart with the keyboard", () => {
    renderCartesianChart({
      ...defaultProps,
      inverted: true,
      zoom: { enabled: true },
      onZoomRangeChange,
    });
    enterZoomMode();
    const cursor = getChart().findZoomCursor()!.getElement();
    expect(cursor).toHaveAttribute("aria-orientation", "vertical");

    // On an inverted chart the x axis runs vertically, so the vertical arrows drive the cursor, which
    // starts at the visual start of the plot: the top, where the smallest x value is rendered.
    expect(getCursorAttributes().now).toBe("0");
    pressCursorKey(KeyCode.down);
    expect(getCursorAttributes().now).toBe("1");
    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.down, 2);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
});

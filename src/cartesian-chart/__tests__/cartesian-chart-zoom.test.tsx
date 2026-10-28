// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { cleanup } from "@testing-library/react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "@cloudscape-design/components/test-utils/dom";
// The error bar series type is only available with the highcharts-more module.
import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { InternalZoomProps } from "../../../lib/components/core/internal-interfaces";
import { getSeriesData } from "../../../lib/components/internal/utils/highcharts";
import { ExtendedTestWrapper } from "../../core/__tests__/common";
import { stubPlotGeometry } from "../../core/__tests__/plot-geometry";
import { zoomMessages } from "../../core/__tests__/zoom-messages";
import { getChart as getCartesianChart, renderCartesianChart } from "./common";

import coreTestClasses from "../../../lib/components/core/test-classes/styles.selectors.js";

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
  i18nProvider: zoomMessages,
  series,
  xAxis: { title: "X", type: "linear" as const, min: 0, max: 4 },
  yAxis: { title: "Y", type: "linear" as const },
};

const onZoomRangeChange = vi.fn();

// The cartesian chart passes the internal zoom properties through to the core chart, and does not declare them yet.
type ZoomTestProps = Partial<CartesianChartProps> &
  InternalZoomProps & {
    highcharts: typeof highcharts;
    i18nProvider?: Record<string, Record<string, string>>;
  };

function renderZoomChart(props: ZoomTestProps) {
  const { rerender } = renderCartesianChart(props);
  return { rerender: (props: ZoomTestProps) => rerender(props) };
}

function getChart() {
  return new ExtendedTestWrapper(getCartesianChart().getElement());
}

stubPlotGeometry();

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

// The cursor is a DOM element positioned over the plot and hidden with visibility. The selection and the zoomed
// range are drawn on the chart SVG, and lose their class names when hidden.
function findSvg(className: string): null | SVGElement {
  return getChart().getElement().querySelector(`.${coreTestClasses[className]}`);
}

function getOverlay() {
  const cursor = getChart().findZoomCursor()!.getElement() as HTMLElement;
  return {
    band: findSvg("zoom-selection"),
    startDivider: findSvg("zoom-selection-start"),
    cursor,
  };
}

function isVisible(element: null | Element) {
  if (element instanceof HTMLElement) {
    return element.style.visibility === "visible";
  }
  return !!element && element.getAttribute("visibility") !== "hidden";
}

// The zoomed range is marked with a band and a border at each end, read back as x values.
function getZoomRangeAffordance() {
  const xAxis = getCurrentChart().xAxis[0];
  const band = findSvg("zoom-range");
  const borders = findSvg("zoom-range-borders");
  const toValue = (pixel: number) => Math.round(xAxis.toValue(pixel) * 1000) / 1000;
  const from = band ? toValue(Number(band.getAttribute("x"))) : null;
  const to = band ? toValue(Number(band.getAttribute("x")) + Number(band.getAttribute("width"))) : null;
  const boundaries = borders
    ? (borders.getAttribute("d") ?? "")
        .split("M")
        .filter((part) => part.trim())
        .map((part) => toValue(Number(part.trim().split(" ")[0])))
    : null;
  return {
    present: !!band && !!borders,
    band: band && { from, to },
    boundaries,
  };
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
// (what Axis.toPixels returns) is also the client coordinate. The offset is applied along the x axis,
// which runs vertically in inverted charts.
function pointerEventAtValue(type: string, value: number, offset = 0, init: PointerEventInit = {}) {
  const chart = getCurrentChart();
  const pixel = chart.xAxis[0].toPixels(value, false) + offset;
  const horizontal = chart.xAxis[0].horiz !== false;
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    buttons: 1,
    clientX: horizontal ? pixel : chart.plotLeft + chart.plotWidth / 2,
    clientY: horizontal ? chart.plotTop + chart.plotHeight / 2 : pixel,
    ...init,
  });
}

function dispatchPointer(type: string, value: number, offset = 0, init: PointerEventInit = {}) {
  const event = pointerEventAtValue(type, value, offset, init);
  act(() => {
    getCurrentChart().container.dispatchEvent(event);
  });
}

function getCursorLeft() {
  return parseFloat(getOverlay().cursor.style.left);
}

function seriesOfLength(count: number): CartesianChartProps.SeriesOptions[] {
  return [{ type: "line", name: "Requests", data: Array.from({ length: count }, (_, x) => ({ x, y: x })) }];
}

// The page direction is read from the computed style of the chart's root.
function renderInRtl() {
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudoElement) => {
    const style = getComputedStyle(element, pseudoElement);
    return new Proxy(style, {
      get: (target, property) => (property === "direction" ? "rtl" : Reflect.get(target, property, target)),
    });
  });
}

function focusOutsideChart() {
  const button = document.createElement("button");
  button.setAttribute("data-testid", "outside");
  document.body.appendChild(button);
  act(() => button.focus());
  return button;
}

describe("CartesianChart: zoom selection, controls", { timeout: TEST_TIMEOUT }, () => {
  test("renders the Zoom button in idle state when zoom is enabled", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("Zoom");
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findResetZoomButton()).toBe(null);
  });

  test("labels the zoom controls region", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    const region = getChart().getElement().querySelector('[role="region"]')!;
    expect(region).toHaveAttribute("aria-label", "Chart zoom controls");
  });

  test("hides the built-in buttons with hideZoomControls, keeping the cursor available", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true, hideZoomControls: true } });
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomCursor()).not.toBe(null);
  });

  // The controls render in the chart's header area, in normal flow, so they precede the plot in the
  // DOM and therefore in the focus order.
  test("renders the zoom controls before the plot in DOM order", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    const zoomButton = getChart().findZoomButton()!.getElement();
    const position = zoomButton.compareDocumentPosition(getCurrentChart().container);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("clicking Zoom enters zoom mode and shows the Exit zoom button", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findZoomButton()).toBe(null);
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("Exit zoom");
  });

  test("clicking Exit zoom returns to idle state", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("the Reset button fires onZoomRangeChange with a null range", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    keyboardZoomToIndexes(1, 3);

    onZoomRangeChange.mockReset();
    getChart().findResetZoomButton()!.click();
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
  });

  test("controlled zoomRange applies extremes and shows the Reset button", () => {
    const { rerender } = renderZoomChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
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

  // The zoomed range is only as visible as the axis labels make it, so while zoomed the range it covers is
  // marked with a tint and a boundary line at each end.
  test("marks the zoomed range with a band and boundary lines", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    expect(getZoomRangeAffordance().present).toBe(false);

    keyboardZoomToIndexes(1, 3);
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
  });

  test("clears the zoomed range affordance when the zoom is reset", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    getChart().findResetZoomButton()!.click();
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("marks the zoomed range of a controlled zoomRange", () => {
    const { rerender } = renderZoomChart({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);

    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    // The range is normalized, so a reversed one still produces a band from the lower to the higher value.
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });

    rerender({ ...defaultProps, zoom: { enabled: true }, zoomRange: null });
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  // Zoom mode can be entered on top of an existing zoom, and until a new range is applied the chart is still
  // zoomed to the old one, which must stay marked as such.
  test("keeps the zoomed range affordance while zoom mode is re-entered", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    // Zoom mode is entered on top of the existing zoom, which the chart still shows until a new range is
    // applied. The cursor now moves over the zoomed range, whose visible points are 1, 2 and 3.
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

  test("re-entering zoom mode while zoomed keeps the range", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);
    // The Reset button steps aside while a new range is being selected.
    expect(getChart().findResetZoomButton()).toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("exiting a re-zoom returns to the zoomed state with the range intact", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 4);
    enterZoomMode();
    getChart().findExitZoomButton()!.click();
    expect(getChart().findResetZoomButton()).not.toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
    expect(getXExtremes()).toEqual({ min: 1, max: 4 });
  });

  test("re-zooming narrows the range from the visible window", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(0, 1);
    expect(getXExtremes()).toEqual({ min: 0, max: 1 });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    // Resetting makes zooming available again.
    getChart().findResetZoomButton()!.click();
    expect(getChart().findZoomButton()!.isDisabled()).toBe(false);
  });

  test("disables the Zoom button when no series with data points are visible", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, visibleSeries: [] });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
    enterZoomMode();
    expect(getChart().findExitZoomButton()).toBe(null);
  });

  test("disables the Zoom button for threshold-only charts", () => {
    renderZoomChart({
      ...defaultProps,
      series: [{ type: "x-threshold", name: "Peak", value: 2 }],
      zoom: { enabled: true },
    });
    expect(getChart().findZoomButton()!.isDisabled()).toBe(true);
  });

  test("resolves the zoom strings from the I18nProvider", () => {
    renderZoomChart({
      ...defaultProps,
      zoom: { enabled: true },
      i18nProvider: {
        "[charts]": {
          "i18nStrings.enterZoomModeButtonText": "provider: zoom",
          "i18nStrings.exitZoomModeButtonText": "provider: exit",
          "i18nStrings.zoomRangeChangeAnnouncementText": "provider: {startValue} to {endValue}",
        },
      },
    });
    expect(getChart().findZoomButton()!.getElement()).toHaveTextContent("provider: zoom");

    enterZoomMode();
    expect(getChart().findExitZoomButton()!.getElement()).toHaveTextContent("provider: exit");

    pressCursorKey(KeyCode.right);
    pressCursorKey(KeyCode.enter);
    pressCursorKeyTimes(KeyCode.right, 2);
    pressCursorKey(KeyCode.enter);
    expect(getChart().getElement()).toHaveTextContent("provider: 1 to 3");
  });
});

describe("CartesianChart: zoom selection, keyboard interaction", { timeout: TEST_TIMEOUT }, () => {
  test.each([
    { key: "Enter", keyCode: KeyCode.enter },
    { key: "Space", keyCode: KeyCode.space },
  ])("selects a range with the arrow keys and $key", ({ keyCode }) => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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
  ])("steps the cursor a tenth of $count points with PageUp and PageDown", ({ count, step }) => {
    renderZoomChart({
      ...defaultProps,
      series: seriesOfLength(count),
      xAxis: { ...defaultProps.xAxis, max: count - 1 },
      zoom: { enabled: true },
    });
    enterZoomMode();
    pressCursorKey(KeyCode.pageUp);
    expect(getCursorAttributes().now).toBe(String(step));
    pressCursorKey(KeyCode.pageDown);
    expect(getCursorAttributes().now).toBe("0");
  });

  test("ignores vertical arrow keys on a horizontal axis", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.up);
    pressCursorKey(KeyCode.down);
    expect(getCursorAttributes().now).toBe("0");
  });

  test("Escape cancels the selection", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(document.activeElement).toBe(getChart().findZoomCursor()!.getElement());
  });

  test("exposes the cursor position on the slider", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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
      text: "Selecting zoom range from 1 to 2.",
    });
  });

  test("moves focus to Reset after zooming, and back to Zoom after resetting", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    expect(document.activeElement).toBe(getChart().findResetZoomButton()!.getElement());

    getChart().findResetZoomButton()!.click();
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  test("moves focus to the Zoom button when the selection is cancelled", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    pressCursorKey(KeyCode.escape);
    expect(document.activeElement).toBe(getChart().findZoomButton()!.getElement());
  });

  // Focus leaving the chart abandons the selection, so the chart is never left in an active zoom
  // state the user cannot see the focus for.
  test("exits zoom mode when focus leaves the chart", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(getChart().findExitZoomButton()).not.toBe(null);

    focusOutsideChart();
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(getChart().findZoomButton()).not.toBe(null);
  });

  test("keeps zoom mode when focus moves within the chart", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    act(() => (getChart().findExitZoomButton()!.getElement() as HTMLElement).focus());
    expect(getChart().findExitZoomButton()).not.toBe(null);
  });

  // Once zoomed, the cursor may only travel inside the visible window. Highcharts keeps the
  // out-of-range points in the series (below cropThreshold), so the stops are recomputed from the
  // current extremes rather than from the full data.
  test("confines the cursor to the zoomed window", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    keyboardZoomToIndexes(1, 3);
    enterZoomMode();
    expect(getCursorAttributes()).toEqual({ min: "1", max: "3", now: "1", text: "1" });

    pressCursorKeyTimes(KeyCode.right, 5);
    expect(getCursorAttributes().now).toBe("3");
    pressCursorKeyTimes(KeyCode.left, 5);
    expect(getCursorAttributes().now).toBe("1");
  });
});

describe("CartesianChart: zoom selection, cursor buttons", { timeout: TEST_TIMEOUT }, () => {
  test("renders the cursor buttons outside the tab order", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    const buttons = [getChart().findZoomCursorPreviousButton()!, getChart().findZoomCursorNextButton()!];
    for (const button of buttons) {
      expect(button.getElement()).toHaveAttribute("tabindex", "-1");
    }
    expect(buttons.map((button) => button.getElement().getAttribute("aria-label"))).toEqual([
      "Move zoom cursor to previous point",
      "Move zoom cursor to next point",
    ]);
  });

  test("selects a full range with the cursor buttons and Enter", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    getChart().findZoomCursorNextButton()!.click();
    pressCursorKey(KeyCode.enter);
    getChart().findZoomCursorNextButton()!.click();
    pressCursorKey(KeyCode.enter);
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
    expect(onZoomRangeChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { zoomRange: { x: { startValue: 1, endValue: 2 } } } }),
    );
  });

  test("keeps clicking the cursor buttons out of the focus order", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    getChart().findZoomCursorNextButton()!.click();
    // The cursor keeps the focus, so arrow keys continue to work after using the buttons.
    expect(document.activeElement).toBe(getChart().findZoomCursor()!.getElement());
    pressCursorKey(KeyCode.right);
    expect(getCursorAttributes().now).toBe("2");
  });

  test("keeps the cursor buttons enabled at the range edges", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    const previousButton = getChart().findZoomCursorPreviousButton()!.getElement() as HTMLButtonElement;
    expect(previousButton.disabled).toBe(false);
    getChart().findZoomCursorPreviousButton()!.click();
    expect(getCursorAttributes().now).toBe("0");
    expect(previousButton.disabled).toBe(false);
  });
});

describe("CartesianChart: zoom selection, overlay", { timeout: TEST_TIMEOUT }, () => {
  // The overlay must draw nothing while idle: a highlight left on the chart after a zoom looks like a
  // pending selection, and on an empty chart it looks like a rendering artifact.
  test.each([
    { state: "idle", act: () => {} },
    { state: "after a committed zoom", act: () => keyboardZoomToIndexes(1, 3) },
  ])("draws nothing $state", ({ act: run }) => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    run();
    const { band, startDivider, cursor } = getOverlay();
    for (const element of [band, startDivider, cursor]) {
      expect(isVisible(element)).toBe(false);
    }
  });

  test("shows the cursor while selecting, and the band once the start point is set", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    expect(isVisible(getOverlay().cursor)).toBe(true);
    expect(isVisible(getOverlay().band)).toBe(false);

    pressCursorKey(KeyCode.enter);
    expect(isVisible(getOverlay().startDivider)).toBe(true);

    pressCursorKey(KeyCode.right);
    expect(isVisible(getOverlay().band)).toBe(true);
  });
});

describe("CartesianChart: zoom selection, pointer interaction", { timeout: TEST_TIMEOUT }, () => {
  // The tooltip is rendered outside the plot wrapper and sits right next to the pointer, so a click on the plot is often
  // released on it.
  test("sets a boundary for a press that is released outside the plot", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointercancel", 1);
    expect(isVisible(getOverlay().startDivider)).toBe(false);
    expect(getChart().findExitZoomButton()).not.toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("leaves presses outside zoom mode to the chart", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointermove", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getChart().findExitZoomButton()).toBe(null);
    expect(onZoomRangeChange).not.toHaveBeenCalled();
  });

  test("moves the cursor with the pointer hovering the plot in zoom mode", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    const startLeft = getOverlay().cursor.style.left;
    dispatchPointer("pointermove", 3, 0, { buttons: 0 });
    expect(getOverlay().cursor.style.left).not.toBe(startLeft);
    expect(getCursorAttributes().now).toBe(String(3));
  });

  test("previews the band with the pointer hovering the plot after the first click", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    dispatchPointer("pointermove", 3, 0, { buttons: 0 });
    const { band } = getOverlay();
    expect(isVisible(band)).toBe(true);
    expect(Number(band!.getAttribute("width"))).toBeGreaterThan(1);
    expect(getCursorAttributes().text).toBe("Selecting zoom range from 1 to 3.");
  });

  // Highcharts keeps tracking the hovered point while the tooltip is suppressed. Were that point kept
  // highlighted, the tooltip would open on it as soon as the zoom is applied.
  test("does not show the tooltip on the point hovered during a pointer selection once zoomed", async () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    vi.useFakeTimers();
    try {
      enterZoomMode();
      dispatchPointer("pointerdown", 1);
      dispatchPointer("pointerup", 1);
      act(() => getSeriesData(getCurrentChart().series[0])[3].onMouseOver());
      dispatchPointer("pointerdown", 3);
      dispatchPointer("pointerup", 3);
      expect(getXExtremes()).toEqual({ min: 1, max: 3 });

      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(getChart().findTooltip()).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  test("shows no tooltip for a point hovered in zoom mode", async () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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

  test("clicking twice in zoom mode selects the range", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true }, onZoomRangeChange });
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

  // The click that sets the second boundary ends zoom mode, and must not then pin a point in the chart.
  test("keeps the clicks that set the range boundaries away from the chart", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    const onContainerClick = vi.fn();
    getCurrentChart().container.addEventListener("click", onContainerClick);
    const click = (value: number) => {
      dispatchPointer("pointerdown", value);
      dispatchPointer("pointerup", value);
      dispatchPointer("click", value);
    };

    enterZoomMode();
    click(1);
    click(3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(onContainerClick).not.toHaveBeenCalled();

    click(2);
    expect(onContainerClick).toHaveBeenCalledTimes(1);
  });

  test("ignores presses of non-primary mouse buttons", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1, 0, { button: 2, buttons: 2 });
    dispatchPointer("pointerup", 1, 0, { button: 2, buttons: 0 });
    expect(isVisible(getOverlay().startDivider)).toBe(false);
  });
});

describe("CartesianChart: zoom selection, with other series types", { timeout: TEST_TIMEOUT }, () => {
  // Highcharts computes a minRange of its own (five times the closest data range) when the axis has no
  // explicit bounds, and silently widens any narrower range. Grouped column charts hit this most
  // visibly, because zooming into a couple of categories appeared to do nothing.
  test("zooms into two adjacent points without explicit axis bounds", () => {
    renderZoomChart({
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
    renderZoomChart({
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
    });
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
    renderZoomChart({
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

describe("CartesianChart: zoom selection, direction", { timeout: TEST_TIMEOUT }, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // The cursor, the arrow keys, Home and End, and the step buttons follow the plot as it is drawn. In a
  // right-to-left page the x axis runs from right to left, so the values go the other way on screen.
  test.each([
    { name: "left-to-right page", rtl: false, first: "0", last: "4" },
    { name: "right-to-left page", rtl: true, first: "4", last: "0" },
  ])("follows the plot on screen in a $name", ({ rtl, first, last }) => {
    if (rtl) {
      renderInRtl();
    }
    const { rerender } = renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    // The page direction is read from the mounted chart, so it applies from the next render.
    rerender({ ...defaultProps, zoom: { enabled: true } });
    enterZoomMode();

    // The cursor starts at the left edge of the plot, so moving left does nothing.
    expect(getCursorAttributes().now).toBe(first);
    const startLeft = getCursorLeft();
    pressCursorKey(KeyCode.left);
    expect(getCursorLeft()).toBe(startLeft);

    pressCursorKey(KeyCode.right);
    expect(getCursorLeft()).toBeGreaterThan(startLeft);
    getChart().findZoomCursorPreviousButton()!.click();
    expect(getCursorLeft()).toBe(startLeft);
    getChart().findZoomCursorNextButton()!.click();
    expect(getCursorLeft()).toBeGreaterThan(startLeft);

    pressCursorKey(KeyCode.end);
    expect(getCursorAttributes().now).toBe(last);
    pressCursorKey(KeyCode.home);
    expect(getCursorAttributes().now).toBe(first);
  });

  test("zooms an inverted chart with two clicks in zoom mode", () => {
    renderZoomChart({ ...defaultProps, inverted: true, zoom: { enabled: true } });
    enterZoomMode();
    dispatchPointer("pointerdown", 1);
    dispatchPointer("pointerup", 1);
    dispatchPointer("pointerdown", 3);
    dispatchPointer("pointerup", 3);
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });
});

describe("CartesianChart: zoom selection, announcements", { timeout: TEST_TIMEOUT }, () => {
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
    run();
    expect(getChart().getElement()).toHaveTextContent(text);
  });

  test("formats the cursor position and the range with the x-axis value formatter", () => {
    const day = 24 * 60 * 60 * 1000;
    const start = Date.UTC(2025, 0, 1);
    renderZoomChart({
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

describe("CartesianChart: zoom selection, focus and keyboard containment", { timeout: TEST_TIMEOUT }, () => {
  test("keeps the keys the cursor handles from reaching the page", () => {
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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
    renderZoomChart({ ...defaultProps, zoom: { enabled: true } });
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

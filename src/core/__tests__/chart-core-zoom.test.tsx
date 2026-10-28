// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import "highcharts/highcharts-more";
import { ZoomRange } from "../../../lib/components/core/chart-zoom/interfaces";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { CoreChartTestProps, renderChart, renderStatefulChart } from "./common";
import { stubPlotGeometry } from "./plot-geometry";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors.js";

stubPlotGeometry();

const series: CoreChartProps.ChartOptions["series"] = [
  {
    type: "line",
    name: "L1",
    data: [
      { x: 0, y: 10 },
      { x: 1, y: 20 },
      { x: 2, y: 30 },
      { x: 3, y: 25 },
      { x: 4, y: 40 },
    ],
  },
  {
    type: "line",
    name: "L2",
    data: [
      { x: 0, y: 40 },
      { x: 1, y: 25 },
      { x: 2, y: 30 },
      { x: 3, y: 20 },
      { x: 4, y: 10 },
    ],
  },
];

const zoomMessages = {
  "[charts]": {
    "i18nStrings.resetZoomButtonText": "Reset",
    "i18nStrings.resetZoomButtonAriaLabel": "Reset zoom to show full data range",
    "i18nStrings.zoomControlsAriaLabel": "Chart zoom controls",
    "i18nStrings.zoomResetAnnouncementText": "Zoom reset. Showing the full data range.",
  },
};

const defaultProps: CoreChartTestProps = {
  highcharts,
  i18nProvider: zoomMessages,
  ariaLabel: "Chart",
  options: { series, xAxis: { min: 0, max: 4 } },
  zoom: { enabled: true },
};

const zoomedRange: ZoomRange = { x: { startValue: 1, endValue: 3 } };
const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

function getCurrentChart() {
  return [...highcharts.charts].reverse().find((c) => c)!;
}

function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

function findSvg(className: string): null | SVGElement {
  return document.querySelector(`.${testClasses[className]}`);
}

// The zoomed range is marked with a band and a border at each end, drawn on the plot and read back as x values.
function getZoomRangeAffordance() {
  const xAxis = getCurrentChart().xAxis[0];
  const band = findSvg("zoom-range");
  const borders = findSvg("zoom-range-borders");
  const toValue = (pixel: number) => Math.round(xAxis.toValue(pixel) * 1000) / 1000;
  return {
    present: !!band && !!borders,
    band: band && {
      from: toValue(Number(band.getAttribute("x"))),
      to: toValue(Number(band.getAttribute("x")) + Number(band.getAttribute("width"))),
    },
    boundaries:
      borders &&
      (borders.getAttribute("d") ?? "")
        .split("M")
        .filter((part) => part.trim())
        .map((part) => toValue(Number(part.trim().split(" ")[0]))),
  };
}

describe("CoreChart: zoom range", () => {
  test("ignores the zoom range when zoom is not enabled", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoom: undefined, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("applies the zoom range and marks it with a band and boundary lines", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
    expect(wrapper.findResetZoomButton()!.getElement()).toHaveTextContent("Reset");

    rerender({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("normalizes a zoom range given from the higher to the lower value", () => {
    renderChart({ ...defaultProps, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
  });

  test("allows a zoom range of two adjacent points without explicit axis bounds", () => {
    renderChart({
      ...defaultProps,
      options: { series: [{ type: "column", name: "C1", data: [10, 20, 30, 25, 40] }], xAxis: {} },
      zoomRange: { x: { startValue: 1, endValue: 2 } },
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
  });

  test("shows the consumer x-axis range when zoom is disabled", () => {
    const options = { series, xAxis: { min: 0, max: 4, plotLines: [{ id: "line", value: 2 }] } };
    const { wrapper, rerender } = renderChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options, zoom: { enabled: false }, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("ignores the zoom when the chart declares no x-axis", () => {
    const { wrapper } = renderChart({ ...defaultProps, options: { series }, zoomRange: zoomedRange });
    const { min, max } = getXExtremes();
    expect(min).toBeLessThanOrEqual(0);
    expect(max).toBeGreaterThanOrEqual(4);
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("ignores the zoom while the x-axes are removed, and applies it again once they are back", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options: { series, xAxis: [] }, zoomRange: zoomedRange, onZoomRangeChange });
    expect(findSvg("zoom-range")).toBe(null);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(wrapper.findResetZoomButton()).not.toBe(null);
  });

  test("applies the zoom range to an x-axis that replaces the first one", () => {
    const options = {
      series,
      xAxis: [
        { id: "first", min: 0, max: 4 },
        { id: "second", min: 0, max: 4 },
      ],
    };
    const { rerender } = renderChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({
      ...defaultProps,
      options: { series, xAxis: [{ id: "second", min: 0, max: 4 }] },
      zoomRange: zoomedRange,
    });
    expect(getCurrentChart().xAxis[0].options.id).toBe("second");
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("leaves x-axis extremes it did not apply to the consumer", () => {
    renderChart({ ...defaultProps, zoom: undefined });
    act(() => getCurrentChart().xAxis[0].setExtremes(2, 3));
    act(() => getCurrentChart().redraw());
    expect(getXExtremes()).toEqual({ min: 2, max: 3 });
  });

  test("marks the zoomed range when zoom is enabled on an axis already showing that range", () => {
    const { rerender } = renderChart({
      ...defaultProps,
      zoom: undefined,
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    act(() => getCurrentChart().xAxis[0].setExtremes(1, 3));
    rerender({
      ...defaultProps,
      zoom: { enabled: true, hideZoomControls: true },
      zoomRange: { x: { startValue: 1, endValue: 3 } },
    });
    expect(document.querySelector(`.${testClasses["zoom-range"]}`)).not.toBe(null);
  });

  test("keeps the x-axis minRange declared by the consumer", () => {
    renderChart({ ...defaultProps, options: { series, xAxis: { min: 0, max: 4, minRange: 3 } } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(3);
  });
});

describe("CoreChart: zoom controls", () => {
  test("renders the controls before the plot, leaving the navigator slot to the consumer", () => {
    const { wrapper } = renderChart({
      ...defaultProps,
      zoomRange: zoomedRange,
      navigator: <div>Custom navigator</div>,
    });
    const navigator = wrapper.findNavigator()!;
    const controls = wrapper.findResetZoomButton()!.getElement().closest('[role="region"]')!;
    const container = getCurrentChart().container;

    expect(controls).toHaveAttribute("role", "region");
    expect(controls).toHaveAttribute("aria-label", "Chart zoom controls");
    expect(navigator.getElement()).toHaveTextContent("Custom navigator");
    expect(navigator.getElement().contains(controls)).toBe(false);
    expect(controls.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("hides the Reset button with hideZoomControls", () => {
    const { wrapper } = renderChart({
      ...defaultProps,
      zoom: { enabled: true, hideZoomControls: true },
      zoomRange: zoomedRange,
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("the Reset button asks the consumer to show the full range, and leaves the range to the consumer", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    wrapper.findResetZoomButton()!.click();

    expect(onZoomRangeChange).toHaveBeenCalledTimes(1);
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("resets the zoom, announces it, and moves focus to the chart", () => {
    const { wrapper } = renderStatefulChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    wrapper.findResetZoomButton()!.focus();
    wrapper.findResetZoomButton()!.click();

    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
    expect(wrapper.getElement()).toHaveTextContent("Zoom reset. Showing the full data range.");
    expect(document.activeElement).toBe(wrapper.findApplication()!.getElement());
  });

  test("moves focus to the chart as soon as Reset is pressed", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    wrapper.findResetZoomButton()!.focus();
    wrapper.findResetZoomButton()!.click();

    expect(document.activeElement).toBe(wrapper.findApplication()!.getElement());
  });

  test("announces the reset when Reset is pressed, and again on the next reset", () => {
    const { wrapper, rerender } = renderChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    const announcement = "Zoom reset. Showing the full data range.";
    expect(wrapper.getElement()).not.toHaveTextContent(announcement);

    wrapper.findResetZoomButton()!.click();
    expect(wrapper.getElement()).toHaveTextContent(announcement);

    rerender({ ...defaultProps, zoomRange: null, onZoomRangeChange });
    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(wrapper.getElement()).not.toHaveTextContent(announcement);

    wrapper.findResetZoomButton()!.click();
    expect(wrapper.getElement()).toHaveTextContent(announcement);
  });

  test("resolves the zoom strings from the I18nProvider", () => {
    const { wrapper } = renderChart({
      ...defaultProps,
      zoomRange: zoomedRange,
      i18nProvider: {
        "[charts]": {
          "i18nStrings.resetZoomButtonText": "provider: reset",
          "i18nStrings.resetZoomButtonAriaLabel": "provider: reset label",
          "i18nStrings.zoomControlsAriaLabel": "provider: controls",
        },
      },
    });
    const resetButton = wrapper.findResetZoomButton()!.getElement();
    expect(resetButton).toHaveTextContent("provider: reset");
    expect(resetButton).toHaveAttribute("aria-label", "provider: reset label");
    expect(resetButton.closest('[role="region"]')).toHaveAttribute("aria-label", "provider: controls");
  });

  test("falls back to empty strings without I18nProvider messages", () => {
    const { wrapper } = renderChart({ ...defaultProps, zoomRange: zoomedRange, i18nProvider: {} });
    const resetButton = wrapper.findResetZoomButton()!.getElement();
    expect(resetButton.textContent).toBe("");
    expect(resetButton.closest('[role="region"]')!.getAttribute("aria-label") ?? "").toBe("");
  });
});

describe("CoreChart: zoom with error bars", () => {
  function renderErrorBarsOn(parentType: "line" | "column") {
    const data = [0, 10, 20, 30, 40].map((x) => ({ x, y: x + 10 }));
    renderChart({
      ...defaultProps,
      options: {
        xAxis: {},
        series: [
          { type: parentType, id: "parent", name: "Parent", data },
          {
            type: "errorbar",
            linkedTo: "parent",
            name: "Error",
            data: data.map(({ x, y }) => ({ x, low: y - 2, high: y + 2 })),
          },
        ],
      },
      zoomRange: { x: { startValue: 10, endValue: 30 } },
    });
    expect(getXExtremes()).toEqual({ min: 10, max: 30 });
    // Highcharts pads the axis by this offset on each side of the extremes, so that column-like points at the
    // edges are not cut in half.
    return (getCurrentChart().xAxis[0] as unknown as { minPointOffset: number }).minPointOffset;
  }

  test("keeps the error bar padding when zoom is not enabled", () => {
    const data = [0, 10, 20, 30, 40].map((x) => ({ x, y: x + 10 }));
    renderChart({
      ...defaultProps,
      zoom: undefined,
      options: {
        xAxis: {},
        series: [
          { type: "line", id: "parent", name: "Parent", data },
          {
            type: "errorbar",
            linkedTo: "parent",
            name: "Error",
            data: data.map(({ x, y }) => ({ x, low: y - 2, high: y + 2 })),
          },
        ],
      },
    });
    expect((getCurrentChart().xAxis[0] as unknown as { minPointOffset: number }).minPointOffset).toBeGreaterThan(0);
  });

  test("ends the zoomed plot on the zoomed range for error bars on a line", () => {
    expect(renderErrorBarsOn("line")).toBe(0);
  });

  test("keeps the padding that shows the bars in full for error bars on columns", () => {
    expect(renderErrorBarsOn("column")).toBeGreaterThan(0);
  });
});

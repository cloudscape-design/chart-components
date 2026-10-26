// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act, ComponentType, useState } from "react";
import { render } from "@testing-library/react";
import highcharts from "highcharts";
import { afterEach, describe, expect, test, vi } from "vitest";

import "highcharts/highcharts-more";
import { InternalZoomProps, ZoomRange } from "../../../lib/components/core/chart-zoom/interfaces";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import CoreChart from "../../../lib/components/internal-do-not-use/core-chart";
import { createChartWrapper } from "./common";

const TEST_TIMEOUT = 15_000;

const ZoomCoreChart = CoreChart as ComponentType<CoreChartProps & InternalZoomProps>;
type ZoomChartProps = Partial<CoreChartProps> & InternalZoomProps;

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

const defaultProps: ZoomChartProps = {
  highcharts,
  ariaLabel: "Chart",
  options: { series, xAxis: { min: 0, max: 4 } },
  zoom: { enabled: true },
};

const zoomedRange: ZoomRange = { x: { startValue: 1, endValue: 3 } };
const onZoomRangeChange = vi.fn();

afterEach(() => {
  onZoomRangeChange.mockReset();
});

function renderZoomChart(props: ZoomChartProps, i18nProvider?: Record<string, Record<string, string>>) {
  const element = (props: ZoomChartProps) => {
    const chart = <ZoomCoreChart options={{}} {...props} />;
    return i18nProvider ? <TestI18nProvider messages={i18nProvider}>{chart}</TestI18nProvider> : chart;
  };
  const { rerender } = render(element(props));
  return { wrapper: createChartWrapper(), rerender: (props: ZoomChartProps) => rerender(element(props)) };
}

function StatefulZoomChart({ initialRange, ...props }: ZoomChartProps & { initialRange: null | ZoomRange }) {
  const [zoomRange, setZoomRange] = useState(initialRange);
  return (
    <ZoomCoreChart
      options={{}}
      {...props}
      zoomRange={zoomRange}
      onZoomRangeChange={(event) => {
        setZoomRange(event.detail.zoomRange);
        props.onZoomRangeChange?.(event);
      }}
    />
  );
}

function getCurrentChart() {
  return [...highcharts.charts].reverse().find((c) => c)!;
}

function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

function getZoomRangeAffordance() {
  const xAxis = getCurrentChart().xAxis[0] as unknown as {
    plotLinesAndBands: { options: { id?: string; from?: number; to?: number; value?: number } }[];
    userOptions: { plotBands?: { id?: string }[]; plotLines?: { id?: string }[] };
  };
  const findOptions = (id: string) => xAxis.plotLinesAndBands.find((item) => item.options.id === id)?.options ?? null;
  const band = findOptions("awsui-zoom-range");
  const startLine = findOptions("awsui-zoom-range-start");
  const endLine = findOptions("awsui-zoom-range-end");
  return {
    present: !!band && !!startLine && !!endLine,
    band: band && { from: band.from, to: band.to },
    boundaries: startLine && endLine && [startLine.value, endLine.value],
    ids: xAxis.plotLinesAndBands.map((item) => item.options.id),
    declaredIds: [...(xAxis.userOptions.plotBands ?? []), ...(xAxis.userOptions.plotLines ?? [])].map(({ id }) => id),
  };
}

describe("CoreChart: zoom range", { timeout: TEST_TIMEOUT }, () => {
  test("ignores the zoom range when zoom is not enabled", () => {
    const { wrapper } = renderZoomChart({ ...defaultProps, zoom: undefined, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findZoomControls()).toBe(null);
  });

  test("applies the zoom range and marks it with a band and boundary lines", () => {
    const { wrapper, rerender } = renderZoomChart({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);

    rerender({ ...defaultProps, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
    expect(getZoomRangeAffordance().boundaries).toEqual([1, 3]);
    expect(wrapper.findResetZoomButton()!.getElement()).toHaveTextContent("Reset");

    rerender({ ...defaultProps, zoomRange: null });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(getZoomRangeAffordance().declaredIds).toEqual([]);
    expect(wrapper.findResetZoomButton()).toBe(null);
  });

  test("normalizes a zoom range given from the higher to the lower value", () => {
    renderZoomChart({ ...defaultProps, zoomRange: { x: { startValue: 3, endValue: 1 } } });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(getZoomRangeAffordance().band).toEqual({ from: 1, to: 3 });
  });

  test("keeps the consumer x-axis plot lines and bands while zoomed", () => {
    renderZoomChart({
      ...defaultProps,
      options: {
        series,
        xAxis: { min: 0, max: 4, plotLines: [{ id: "line", value: 2 }], plotBands: [{ id: "band", from: 0, to: 1 }] },
      },
      zoomRange: zoomedRange,
    });
    expect(getZoomRangeAffordance().ids).toEqual(
      expect.arrayContaining(["line", "band", "awsui-zoom-range", "awsui-zoom-range-start", "awsui-zoom-range-end"]),
    );
  });

  test("does not dim the zoomed range affordance when a series is highlighted", () => {
    let chartApi: CoreChartProps.ChartAPI | null = null;
    renderZoomChart({
      ...defaultProps,
      options: { series, xAxis: { min: 0, max: 4, plotLines: [{ id: "L2", value: 2 }] } },
      zoomRange: zoomedRange,
      callback: (api) => (chartApi = api),
    });

    act(() => chartApi!.highlightItems(["L1"]));
    const xAxis = getCurrentChart().xAxis[0] as unknown as {
      plotLinesAndBands: { options: { id?: string }; svgElem?: { opacity?: number } }[];
    };
    const opacityById = Object.fromEntries(
      xAxis.plotLinesAndBands.map((line) => [line.options.id, line.svgElem?.opacity ?? 1]),
    );
    expect(opacityById).toEqual({
      L2: 0.4,
      "awsui-zoom-range": 1,
      "awsui-zoom-range-start": 1,
      "awsui-zoom-range-end": 1,
    });
  });

  test("allows a zoom range of two adjacent points without explicit axis bounds", () => {
    renderZoomChart({
      ...defaultProps,
      options: { series: series.map((s) => ({ ...s, type: "column" as const })) },
      zoomRange: { x: { startValue: 1, endValue: 2 } },
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 2 });
  });

  test("restores the consumer x-axis options when zoom is disabled", () => {
    const options = { series, xAxis: { min: 0, max: 4, plotLines: [{ id: "line", value: 2 }] } };
    const { wrapper, rerender } = renderZoomChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options, zoom: { enabled: false }, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().ids).toEqual(["line"]);
    expect(getCurrentChart().xAxis[0].options.minRange).toBeUndefined();
    expect(wrapper.findZoomControls()).toBe(null);
  });

  test("restores the x-axis when zoom is disabled on a chart that declares none", () => {
    const options = { series };
    const { rerender } = renderZoomChart({ ...defaultProps, options, zoomRange: zoomedRange });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });

    rerender({ ...defaultProps, options, zoom: undefined, zoomRange: zoomedRange });
    const { min, max } = getXExtremes();
    expect(min).toBeLessThanOrEqual(0);
    expect(max).toBeGreaterThanOrEqual(4);
    expect(getZoomRangeAffordance().present).toBe(false);
  });

  test("keeps the x-axis minRange declared by the consumer", () => {
    renderZoomChart({ ...defaultProps, options: { series, xAxis: { min: 0, max: 4, minRange: 3 } } });
    expect(getCurrentChart().xAxis[0].options.minRange).toBe(3);
  });

  test("turns off the Highcharts drag-to-zoom while zoom is enabled", () => {
    renderZoomChart({ ...defaultProps, options: { ...defaultProps.options, chart: { zooming: { type: "x" } } } });
    expect(getCurrentChart().options.chart?.zooming?.type).toBeUndefined();
  });

  test("keeps the Highcharts drag-to-zoom of the consumer when zoom is not enabled", () => {
    renderZoomChart({
      ...defaultProps,
      zoom: undefined,
      options: { ...defaultProps.options, chart: { zooming: { type: "x" } } },
    });
    expect(getCurrentChart().options.chart?.zooming?.type).toBe("x");
  });
});

describe("CoreChart: zoom controls", { timeout: TEST_TIMEOUT }, () => {
  test("renders the controls before the plot, leaving the navigator slot to the consumer", () => {
    const { wrapper } = renderZoomChart({
      ...defaultProps,
      zoomRange: zoomedRange,
      navigator: <div>Custom navigator</div>,
    });
    const navigator = wrapper.findNavigator()!;
    const controls = wrapper.findZoomControls()!.getElement();
    const container = getCurrentChart().container;

    expect(controls).toHaveAttribute("role", "region");
    expect(controls).toHaveAttribute("aria-label", "Chart zoom controls");
    expect(navigator.getElement()).toHaveTextContent("Custom navigator");
    expect(navigator.getElement().contains(controls)).toBe(false);
    expect(controls.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("hides the Reset button with hideButtons", () => {
    const { wrapper } = renderZoomChart({
      ...defaultProps,
      zoom: { enabled: true, hideButtons: true },
      zoomRange: zoomedRange,
    });
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
    expect(wrapper.findZoomControls()).toBe(null);
  });

  test("the Reset button asks the consumer to show the full range, and leaves the range to the consumer", () => {
    const { wrapper } = renderZoomChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    wrapper.findResetZoomButton()!.click();

    expect(onZoomRangeChange).toHaveBeenCalledTimes(1);
    expect(onZoomRangeChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { zoomRange: null } }));
    expect(getXExtremes()).toEqual({ min: 1, max: 3 });
  });

  test("resets the zoom, announces it, and moves focus to the chart", () => {
    render(<StatefulZoomChart {...defaultProps} initialRange={zoomedRange} onZoomRangeChange={onZoomRangeChange} />);
    const wrapper = createChartWrapper();
    wrapper.findResetZoomButton()!.focus();
    wrapper.findResetZoomButton()!.click();

    expect(getXExtremes()).toEqual({ min: 0, max: 4 });
    expect(getZoomRangeAffordance().present).toBe(false);
    expect(wrapper.findResetZoomButton()).toBe(null);
    expect(wrapper.getElement()).toHaveTextContent("Zoom reset. Showing the full data range.");
    expect(document.activeElement).toBe(wrapper.findApplication()!.getElement());
  });

  test("announces the reset only once the consumer applies it, and again on the next reset", () => {
    const { wrapper, rerender } = renderZoomChart({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    const announcement = "Zoom reset. Showing the full data range.";

    wrapper.findResetZoomButton()!.click();
    expect(onZoomRangeChange).toHaveBeenCalledTimes(1);
    expect(wrapper.getElement()).not.toHaveTextContent(announcement);

    wrapper.findResetZoomButton()!.click();
    rerender({ ...defaultProps, zoomRange: null, onZoomRangeChange });
    expect(wrapper.getElement()).toHaveTextContent(announcement);

    rerender({ ...defaultProps, zoomRange: zoomedRange, onZoomRangeChange });
    expect(wrapper.getElement()).not.toHaveTextContent(announcement);

    wrapper.findResetZoomButton()!.click();
    rerender({ ...defaultProps, zoomRange: null, onZoomRangeChange });
    expect(wrapper.getElement()).toHaveTextContent(announcement);
  });

  test("resolves the zoom strings from the I18nProvider", () => {
    const { wrapper } = renderZoomChart(
      { ...defaultProps, zoomRange: zoomedRange },
      {
        "[charts]": {
          "i18nStrings.resetZoomButtonText": "provider: reset",
          "i18nStrings.resetZoomButtonAriaLabel": "provider: reset label",
          "i18nStrings.zoomControlsAriaLabel": "provider: controls",
        },
      },
    );
    const resetButton = wrapper.findResetZoomButton()!.getElement();
    expect(resetButton).toHaveTextContent("provider: reset");
    expect(resetButton).toHaveAttribute("aria-label", "provider: reset label");
    expect(wrapper.findZoomControls()!.getElement()).toHaveAttribute("aria-label", "provider: controls");
  });
});

describe("CoreChart: zoom with error bars", { timeout: TEST_TIMEOUT }, () => {
  function renderErrorBarsOn(parentType: "line" | "column") {
    const data = [0, 10, 20, 30, 40].map((x) => ({ x, y: x + 10 }));
    renderZoomChart({
      ...defaultProps,
      options: {
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

  test("gives the error bars their padding back when zoom is disabled", () => {
    const data = [0, 10, 20, 30, 40].map((x) => ({ x, y: x + 10 }));
    const options: CoreChartProps.ChartOptions = {
      series: [
        { type: "line", id: "parent", name: "Parent", data },
        {
          type: "errorbar",
          linkedTo: "parent",
          name: "Error",
          data: data.map(({ x, y }) => ({ x, low: y - 2, high: y + 2 })),
        },
      ],
    };
    const getOffset = () => (getCurrentChart().xAxis[0] as unknown as { minPointOffset: number }).minPointOffset;
    const { rerender } = renderZoomChart({ ...defaultProps, options });
    expect(getOffset()).toBe(0);

    rerender({ ...defaultProps, options, zoom: undefined });
    expect(getOffset()).toBeGreaterThan(0);
  });

  test("ends the zoomed plot on the zoomed range for error bars on a line", () => {
    expect(renderErrorBarsOn("line")).toBe(0);
  });

  test("keeps the padding that shows the bars in full for error bars on columns", () => {
    expect(renderErrorBarsOn("column")).toBeGreaterThan(0);
  });
});

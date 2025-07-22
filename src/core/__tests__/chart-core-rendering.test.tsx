// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import { renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

describe("CoreChart: rendering", () => {
  test("renders default fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null });
    expect(wrapper.findFallback()).not.toBe(null);
    expect(wrapper.findFallback()!.findSpinner()).not.toBe(null);
  });

  test("renders custom fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null, fallback: "Custom fallback" });
    expect(wrapper.findFallback()).not.toBe(null);
    expect(wrapper.findFallback()!.getElement()).toHaveTextContent("Custom fallback");
  });

  test("renders chart with highcharts=Highcharts", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { title: { text: "Chart title" } },
    });
    expect(wrapper.getElement()).toHaveTextContent("Chart title");
    expect(wrapper.findFallback()).toBe(null);
  });

  test("exposes chart api via callback prop", () => {
    const callback = vi.fn();
    renderChart({ highcharts, callback });

    expect(callback).toHaveBeenCalledWith({
      chart: hc.getChart(),
      highcharts,
      highlightItems: expect.any(Function),
      setItemsVisible: expect.any(Function),
      highlightChartPoint: expect.any(Function),
      highlightChartGroup: expect.any(Function),
      clearChartHighlight: expect.any(Function),
    });
  });

  // To hide the axes we pass them as empty arrays instead of undefined.
  // See: https://github.com/highcharts/highcharts/issues/23337.
  test("hides cartesian axes after re-rendering", () => {
    const { wrapper, rerender } = renderChart({
      highcharts,
      options: {
        title: { text: "Chart title" },
        series: [{ type: "line", name: "Site 1", data: [1, 2, 3] }],
        xAxis: [{ title: { text: "X" } }],
        yAxis: [{ title: { text: "Y" } }],
      },
    });
    expect(wrapper.findXAxisTitle()!.getElement()).toHaveTextContent("X");
    expect(wrapper.findYAxisTitle()!.getElement()).toHaveTextContent("Y");

    rerender({
      highcharts,
      options: {
        title: { text: "Chart title" },
        series: [{ type: "line", name: "Site 1", data: [1, 2, 3] }],
        xAxis: [],
        yAxis: [],
      },
    });
    expect(wrapper.findXAxisTitle()).toBe(null);
    expect(wrapper.findYAxisTitle()).toBe(null);
  });
});

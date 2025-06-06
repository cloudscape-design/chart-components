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
      setItemsVisible: expect.any(Function),
      highlightChartPoint: expect.any(Function),
      highlightChartGroup: expect.any(Function),
      clearChartHighlight: expect.any(Function),
    });
  });
});

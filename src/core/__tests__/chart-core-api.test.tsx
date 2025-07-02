// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CoreChartAPI } from "../../../lib/components/core/interfaces";
import { renderChart, selectLegendItem } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 100));

const hc = new HighchartsTestHelper(highcharts);

const series: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
];

describe("CoreChart: API tests", () => {
  test("passes isApiCall=false to onHighlight when triggered by an user interaction", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, onHighlight });

    act(() => hc.highlightChartPoint(0, 0));

    expect(onHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ point: hc.getChartPoint(0, 0), isApiCall: false }),
    );
  });

  test("passes isApiCall=true to onHighlight when triggered programmatically through API", () => {
    const onHighlight = vi.fn();
    let chartApi: CoreChartAPI | null = null;

    renderChart({ highcharts, onHighlight, options: { series }, callback: (api) => (chartApi = api) });

    const point = hc.getChartPoint(0, 0);

    act(() => chartApi!.highlightChartPoint(point));
    expect(onHighlight).toHaveBeenCalledWith(expect.objectContaining({ point, isApiCall: true }));
  });

  test("passes isApiCall=false to onClearHighlight when triggered by user interaction", async () => {
    const onClearHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, onClearHighlight });

    act(() => hc.highlightChartPoint(0, 0));
    act(() => hc.leaveChartPoint(0, 0));
    await clearHighlightPause();

    expect(onClearHighlight).toHaveBeenCalledWith({ isApiCall: false });
  });

  test("passes isApiCall=true to onClearHighlight when triggered programmatically through API", () => {
    const onClearHighlight = vi.fn();
    let chartApi: CoreChartAPI | null = null;

    renderChart({ highcharts, onClearHighlight, options: { series }, callback: (api) => (chartApi = api) });

    act(() => chartApi!.clearChartHighlight());
    expect(onClearHighlight).toHaveBeenCalledWith({ isApiCall: true });
  });

  test("passes isApiCall=false to onVisibleItemsChange when triggered by user interaction", () => {
    const onVisibleItemsChange = vi.fn();
    const { wrapper } = renderChart({ highcharts, options: { series }, onVisibleItemsChange });

    selectLegendItem(0, wrapper);

    expect(onVisibleItemsChange).toHaveBeenCalledWith({ items: expect.any(Array), isApiCall: false });
  });

  test("passes isApiCall=true to onVisibleItemsChange when triggered programmatically through API", () => {
    const onVisibleItemsChange = vi.fn();
    let chartApi: CoreChartAPI | null = null;

    renderChart({ highcharts, options: { series }, onVisibleItemsChange, callback: (api) => (chartApi = api) });

    act(() => chartApi!.setItemsVisible(["Line 1"]));
    expect(onVisibleItemsChange).toHaveBeenCalledWith({ items: expect.any(Array), isApiCall: true });
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { renderChart, selectLegendItem } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 100));

const hc = new HighchartsTestHelper(highcharts);

const series: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
];

const threeSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Data",
    data: [
      { name: "Segment 1", y: 33.3 },
      { name: "Segment 2", y: 33.3 },
      { name: "Segment 3", y: 33.4 },
    ],
  },
];

describe("CoreChart: API tests", () => {
  test("passes isApiCall=false to onHighlight when triggered by an user interaction", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, onHighlight, options: { series } });

    act(() => hc.highlightChartPoint(0, 0));

    expect(onHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ point: hc.getChartPoint(0, 0), isApiCall: false }),
    );
  });

  test("passes isApiCall=true to onHighlight when triggered programmatically through API", () => {
    const onHighlight = vi.fn();
    let chartApi: CoreChartProps.ChartAPI | null = null;

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
    let chartApi: CoreChartProps.ChartAPI | null = null;

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
    let chartApi: CoreChartProps.ChartAPI | null = null;

    renderChart({ highcharts, options: { series }, onVisibleItemsChange, callback: (api) => (chartApi = api) });

    act(() => chartApi!.setItemsVisible(["Line 1"]));
    expect(onVisibleItemsChange).toHaveBeenCalledWith({ items: expect.any(Array), isApiCall: true });
  });

  test("highlightItems should only highlight the specified series in a line chart", () => {
    let chartApi: CoreChartProps.ChartAPI | null = null;
    renderChart({ highcharts, options: { series: threeSeries }, callback: (api) => (chartApi = api) });

    act(() => chartApi!.highlightItems([hc.getChartSeries(1).name]));

    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("inactive");

    act(() => chartApi!.clearChartHighlight());
    act(() => chartApi!.highlightItems([hc.getChartSeries(0).name, hc.getChartSeries(2).name]));

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(hc.getChartSeries(2).state).toBe("");
  });

  test("highlightItems should only highlight the specified point in a pie chart", () => {
    let chartApi: CoreChartProps.ChartAPI | null = null;
    renderChart({ highcharts, options: { series: pieSeries }, callback: (api) => (chartApi = api) });

    const series = hc.getChartSeries(0);

    act(() => chartApi!.highlightItems([series.points[1].name]));

    expect(hc.getChartPoint(0, 0).state).toBe(undefined);
    expect(hc.getChartPoint(0, 1).state).toBe("hover");
    expect(hc.getChartPoint(0, 2).state).toBe(undefined);

    act(() => chartApi!.clearChartHighlight());
    act(() => chartApi!.highlightItems([series.points[0].name, series.points[2].name]));

    expect(hc.getChartPoint(0, 0).state).toBe("hover");
    expect(hc.getChartPoint(0, 1).state).toBe("");
    expect(hc.getChartPoint(0, 2).state).toBe("hover");
  });
});

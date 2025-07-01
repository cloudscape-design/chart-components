// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { getChartSeries } from "../../internal/utils/chart-series";
import { createChartWrapper, renderChart, renderStatefulChart, selectLegendItem, toggleLegendItem } from "./common";

const onVisibleItemsChange = vi.fn();

afterEach(() => {
  onVisibleItemsChange.mockReset();
});

const defaultProps = { highcharts, onVisibleItemsChange };

const lineSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "L1",
    data: [
      { name: "A", y: 1 },
      { name: "B", y: 2 },
    ],
  },
  {
    type: "line",
    name: "L2",
    data: [
      { name: "C", y: 3 },
      { name: "D", y: 4 },
    ],
  },
  {
    type: "line",
    name: "L3",
    data: [
      { name: "E", y: 5 },
      { name: "F", y: 6 },
    ],
  },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "A", y: 10 },
      { name: "B", y: 20 },
      { name: "C", y: 70 },
    ],
    showInLegend: true,
  },
];

function getVisibilityState() {
  const legend = createChartWrapper().findLegend();
  const chart = highcharts.charts.find((c) => c)!;
  const series = getChartSeries(chart.series);
  const hiddenSeries = series.filter((s) => !s.visible);
  const points = getChartSeries(chart.series).flatMap((s) => s.data);
  const hiddenPoints = points.filter((p) => !p.visible);
  return {
    allLegendItems: legend?.findItems().map((w) => w.getElement().textContent) ?? [],
    hiddenLegendItems: legend?.findItems({ active: false }).map((w) => w.getElement().textContent) ?? [],
    allSeries: series.map((s) => s.options.id ?? s.name),
    hiddenSeries: hiddenSeries.map((s) => s.options.id ?? s.name),
    allPoints: points.map((p) => p.options.id ?? p.name),
    hiddenPoints: hiddenPoints.map((p) => p.options.id ?? p.name),
  };
}

function expectedLineItems(visible: string[]) {
  const allLegendItems = ["L1", "L2", "L3"];
  const hiddenItems = allLegendItems.filter((itemId) => !visible.includes(itemId));
  return {
    allLegendItems: allLegendItems,
    hiddenLegendItems: hiddenItems,
    allSeries: allLegendItems,
    hiddenSeries: hiddenItems,
    allPoints: ["A", "B", "C", "D", "E", "F"],
    hiddenPoints: [],
  };
}

function expectedPieItems(visible: string[]) {
  const allLegendItems = ["A", "B", "C"];
  const hiddenItems = allLegendItems.filter((itemId) => !visible.includes(itemId));
  return {
    allLegendItems: allLegendItems,
    hiddenLegendItems: hiddenItems,
    allSeries: ["Pie series"],
    hiddenSeries: [],
    allPoints: allLegendItems,
    hiddenPoints: hiddenItems,
  };
}

describe("CoreChart: visibility", () => {
  test.each([false, true])("hides series on the first render, legend=%s", (legend) => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: lineSeries },
      legend: { enabled: legend },
      visibleItems: ["L2"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: legend ? ["L1", "L2", "L3"] : [],
      hiddenLegendItems: legend ? ["L1", "L3"] : [],
      allSeries: ["L1", "L2", "L3"],
      hiddenSeries: ["L1", "L3"],
      allPoints: ["A", "B", "C", "D", "E", "F"],
      hiddenPoints: [],
    });
  });

  test("toggles series visibility by clicking on legend", () => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: lineSeries },
      visibleItems: ["L1", "L2", "L3"],
    });

    expect(getVisibilityState()).toEqual(expectedLineItems(["L1", "L2", "L3"]));

    toggleLegendItem(0);

    expect(getVisibilityState()).toEqual(expectedLineItems(["L2", "L3"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "L1", name: "L1", marker: expect.anything(), visible: false, highlighted: false },
      { id: "L2", name: "L2", marker: expect.anything(), visible: true, highlighted: false },
      { id: "L3", name: "L3", marker: expect.anything(), visible: true, highlighted: false },
    ]);

    selectLegendItem(1);

    expect(getVisibilityState()).toEqual(expectedLineItems(["L2"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "L1", name: "L1", marker: expect.anything(), visible: false, highlighted: false },
      { id: "L2", name: "L2", marker: expect.anything(), visible: true, highlighted: false },
      { id: "L3", name: "L3", marker: expect.anything(), visible: false, highlighted: false },
    ]);

    selectLegendItem(1);

    expect(getVisibilityState()).toEqual(expectedLineItems(["L1", "L2", "L3"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "L1", name: "L1", marker: expect.anything(), visible: true, highlighted: false },
      { id: "L2", name: "L2", marker: expect.anything(), visible: true, highlighted: false },
      { id: "L3", name: "L3", marker: expect.anything(), visible: true, highlighted: false },
    ]);
  });

  test("changes series visibility from the outside", () => {
    const { rerender } = renderChart({
      ...defaultProps,
      options: { series: lineSeries },
      visibleItems: ["L1", "L2", "L3"],
    });

    expect(getVisibilityState()).toEqual(expectedLineItems(["L1", "L2", "L3"]));

    rerender({ ...defaultProps, options: { series: lineSeries }, visibleItems: ["L1"] });

    expect(getVisibilityState()).toEqual(expectedLineItems(["L1"]));

    rerender({ ...defaultProps, options: { series: lineSeries }, visibleItems: [] });

    expect(getVisibilityState()).toEqual(expectedLineItems([]));
  });

  test("prefers series id over series name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", id: "1", name: "Line", data: [1, 2, 3] },
      { type: "line", id: "2", name: "Line", data: [1, 2, 3] },
    ];
    const { rerender } = renderChart({
      ...defaultProps,
      options: { series },
      visibleItems: ["Line"],
    });

    expect(getVisibilityState()).toEqual(
      expect.objectContaining({
        allLegendItems: ["Line", "Line"],
        hiddenLegendItems: ["Line", "Line"],
        allSeries: ["1", "2"],
        hiddenSeries: ["1", "2"],
      }),
    );

    rerender({ ...defaultProps, options: { series }, visibleItems: ["2"] });

    expect(getVisibilityState()).toEqual(
      expect.objectContaining({
        allLegendItems: ["Line", "Line"],
        hiddenLegendItems: ["Line"],
        allSeries: ["1", "2"],
        hiddenSeries: ["1"],
      }),
    );

    toggleLegendItem(0);

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "1", name: "Line", marker: expect.anything(), visible: true, highlighted: false },
      { id: "2", name: "Line", marker: expect.anything(), visible: true, highlighted: false },
    ]);

    toggleLegendItem(1);

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "1", name: "Line", marker: expect.anything(), visible: false, highlighted: false },
      { id: "2", name: "Line", marker: expect.anything(), visible: false, highlighted: false },
    ]);
  });

  test.each([false, true])("hides items on the first render, legend=%s", (legend) => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: pieSeries },
      legend: { enabled: legend },
      visibleItems: [],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: legend ? ["A", "B", "C"] : [],
      hiddenLegendItems: legend ? ["A", "B", "C"] : [],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B", "C"],
      hiddenPoints: ["A", "B", "C"],
    });
  });

  test("toggles items visibility by clicking on legend", () => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: pieSeries },
      visibleItems: ["A", "B", "C"],
    });

    expect(getVisibilityState()).toEqual(expectedPieItems(["A", "B", "C"]));

    toggleLegendItem(1);

    expect(getVisibilityState()).toEqual(expectedPieItems(["A", "C"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "A", name: "A", marker: expect.anything(), visible: true, highlighted: false },
      { id: "B", name: "B", marker: expect.anything(), visible: false, highlighted: false },
      { id: "C", name: "C", marker: expect.anything(), visible: true, highlighted: false },
    ]);

    selectLegendItem(0);

    expect(getVisibilityState()).toEqual(expectedPieItems(["A"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "A", name: "A", marker: expect.anything(), visible: true, highlighted: false },
      { id: "B", name: "B", marker: expect.anything(), visible: false, highlighted: false },
      { id: "C", name: "C", marker: expect.anything(), visible: false, highlighted: false },
    ]);

    selectLegendItem(0);

    expect(getVisibilityState()).toEqual(expectedPieItems(["A", "B", "C"]));

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "A", name: "A", marker: expect.anything(), visible: true, highlighted: false },
      { id: "B", name: "B", marker: expect.anything(), visible: true, highlighted: false },
      { id: "C", name: "C", marker: expect.anything(), visible: true, highlighted: false },
    ]);
  });

  test("changes items visibility from the outside", () => {
    const { rerender } = renderChart({
      ...defaultProps,
      options: { series: pieSeries },
      visibleItems: ["A", "B", "C"],
    });

    expect(getVisibilityState()).toEqual(expectedPieItems(["A", "B", "C"]));

    rerender({ ...defaultProps, options: { series: pieSeries }, visibleItems: ["B"] });

    expect(getVisibilityState()).toEqual(expectedPieItems(["B"]));

    rerender({ ...defaultProps, options: { series: pieSeries }, visibleItems: [] });

    expect(getVisibilityState()).toEqual(expectedPieItems([]));
  });

  test("prefers item id over item name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "pie",
        name: "Pie series",
        data: [
          { id: "1", name: "Segment", y: 20 },
          { id: "2", name: "Segment", y: 80 },
        ],
        showInLegend: true,
      },
    ];
    const { rerender } = renderChart({
      ...defaultProps,
      options: { series },
      visibleItems: ["Segment"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["Segment", "Segment"],
      hiddenLegendItems: ["Segment", "Segment"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["1", "2"],
      hiddenPoints: ["1", "2"],
    });

    rerender({ ...defaultProps, options: { series }, visibleItems: ["2"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["Segment", "Segment"],
      hiddenLegendItems: ["Segment"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["1", "2"],
      hiddenPoints: ["1"],
    });

    toggleLegendItem(0);

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "1", name: "Segment", marker: expect.anything(), visible: true, highlighted: false },
      { id: "2", name: "Segment", marker: expect.anything(), visible: true, highlighted: false },
    ]);

    toggleLegendItem(1);

    expect(onVisibleItemsChange).toHaveBeenCalledWith([
      { id: "1", name: "Segment", marker: expect.anything(), visible: false, highlighted: false },
      { id: "2", name: "Segment", marker: expect.anything(), visible: false, highlighted: false },
    ]);
  });
});

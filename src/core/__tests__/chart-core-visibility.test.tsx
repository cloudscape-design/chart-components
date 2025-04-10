// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { createChartWrapper, renderChart, renderStatefulChart } from "./common";

function getVisibilityState() {
  const legend = createChartWrapper().findLegend();
  const chart = highcharts.charts.find((c) => c)!;
  const series = chart.series;
  const hiddenSeries = series.filter((s) => !s.visible);
  const points = chart.series.flatMap((s) => s.data);
  const hiddenPoints = points.filter((p) => !p.visible);
  return {
    allLegendItems: legend?.findItems().map((w) => w.getElement().textContent) ?? [],
    hiddenLegendItems: legend?.findItems({ hidden: true }).map((w) => w.getElement().textContent) ?? [],
    allSeries: series.map((s) => s.options.id ?? s.name),
    hiddenSeries: hiddenSeries.map((s) => s.options.id ?? s.name),
    allPoints: points.map((p) => p.options.id ?? p.name),
    hiddenPoints: hiddenPoints.map((p) => p.options.id ?? p.name),
  };
}

const onItemVisibilityChange = vi.fn();

afterEach(() => {
  onItemVisibilityChange.mockReset();
});

const defaultProps = { highcharts, onItemVisibilityChange };

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
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "A", y: 20 },
      { name: "B", y: 80 },
    ],
    showInLegend: true,
  },
];

describe("CloudscapeHighcharts: visibility", () => {
  test.each([false, true])("hides series on the first render, legend=%s", (legend) => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: lineSeries },
      legend: { enabled: legend },
      hiddenItems: ["L1"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: legend ? ["L1", "L2"] : [],
      hiddenLegendItems: legend ? ["L1"] : [],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L1"],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });
  });

  test("toggles series visibility by clicking on legend", () => {
    renderStatefulChart({ ...defaultProps, options: { series: lineSeries }, hiddenItems: [] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: [],
      allSeries: ["L1", "L2"],
      hiddenSeries: [],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });

    createChartWrapper().findLegend()!.findItems()[0].click();

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: ["L1"],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L1"],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });

    expect(onItemVisibilityChange).toHaveBeenCalledWith(["L1"]);
  });

  test("changes series visibility from the outside", () => {
    const { rerender } = renderChart({ ...defaultProps, options: { series: lineSeries }, hiddenItems: [] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: [],
      allSeries: ["L1", "L2"],
      hiddenSeries: [],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });

    rerender({ ...defaultProps, options: { series: lineSeries }, hiddenItems: ["L2"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: ["L2"],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L2"],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });

    rerender({ ...defaultProps, options: { series: lineSeries }, hiddenItems: ["L1", "L2"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: ["L1", "L2"],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L1", "L2"],
      allPoints: ["A", "B", "C", "D"],
      hiddenPoints: [],
    });
  });

  test("prefers series id over series name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", id: "1", name: "Line", data: [1, 2, 3] },
      { type: "line", id: "2", name: "Line", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({
      ...defaultProps,
      options: { series },

      hiddenItems: ["Line"],
    });

    expect(getVisibilityState()).toEqual(
      expect.objectContaining({
        allLegendItems: ["Line", "Line"],
        hiddenLegendItems: [],
        allSeries: ["1", "2"],
        hiddenSeries: [],
      }),
    );

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["1"] });

    expect(getVisibilityState()).toEqual(
      expect.objectContaining({
        allLegendItems: ["Line", "Line"],
        hiddenLegendItems: ["Line"],
        allSeries: ["1", "2"],
        hiddenSeries: ["1"],
      }),
    );

    wrapper.findLegend()!.findItems()[0].click();

    expect(onItemVisibilityChange).toHaveBeenCalledWith([]);

    wrapper.findLegend()!.findItems()[1].click();

    expect(onItemVisibilityChange).toHaveBeenCalledWith(["1", "2"]);
  });

  test.each([false, true])("hides items on the first render, legend=%s", (legend) => {
    renderStatefulChart({
      ...defaultProps,
      options: { series: pieSeries },
      legend: { enabled: legend },
      hiddenItems: ["A", "B"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: legend ? ["A", "B"] : [],
      hiddenLegendItems: legend ? ["A", "B"] : [],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: ["A", "B"],
    });
  });

  test("toggles items visibility by clicking on legend", () => {
    const { wrapper } = renderStatefulChart({ ...defaultProps, options: { series: pieSeries }, hiddenItems: [] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["A", "B"],
      hiddenLegendItems: [],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: [],
    });

    wrapper.findLegend()!.findItems()[1].click();

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["A", "B"],
      hiddenLegendItems: ["B"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: ["B"],
    });

    expect(onItemVisibilityChange).toHaveBeenCalledWith(["B"]);
  });

  test("changes items visibility from the outside", () => {
    const { rerender } = renderChart({ ...defaultProps, options: { series: pieSeries }, hiddenItems: [] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["A", "B"],
      hiddenLegendItems: [],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: [],
    });

    rerender({ ...defaultProps, options: { series: pieSeries }, hiddenItems: ["A"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["A", "B"],
      hiddenLegendItems: ["A"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: ["A"],
    });

    rerender({ ...defaultProps, options: { series: pieSeries }, hiddenItems: ["A", "B"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["A", "B"],
      hiddenLegendItems: ["A", "B"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["A", "B"],
      hiddenPoints: ["A", "B"],
    });
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
    const { wrapper, rerender } = renderChart({
      ...defaultProps,
      options: { series },

      hiddenItems: ["Segment"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["Segment", "Segment"],
      hiddenLegendItems: [],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["1", "2"],
      hiddenPoints: [],
    });

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["1"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["Segment", "Segment"],
      hiddenLegendItems: ["Segment"],
      allSeries: ["Pie series"],
      hiddenSeries: [],
      allPoints: ["1", "2"],
      hiddenPoints: ["1"],
    });

    wrapper.findLegend()!.findItems()[0].click();

    expect(onItemVisibilityChange).toHaveBeenCalledWith([]);

    wrapper.findLegend()!.findItems()[1].click();

    expect(onItemVisibilityChange).toHaveBeenCalledWith(["1", "2"]);
  });
});

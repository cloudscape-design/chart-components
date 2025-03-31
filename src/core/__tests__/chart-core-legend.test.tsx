// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import { createChartWrapper, renderChart } from "./common";

function getLegendItems() {
  const legend = createChartWrapper().findLegend()!;
  return {
    normal: legend.findItems({ status: "normal" }).map((w) => w.getElement().textContent),
    warning: legend.findItems({ status: "warning" }).map((w) => w.getElement().textContent),
  };
}

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "L1", data: [1, 2, 3] },
  { type: "line", name: "L2", data: [4, 5, 6], id: "testid" },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 30 },
      { name: "P3", y: 60, id: "testid" },
    ],
    showInLegend: true,
  },
];

describe("CloudscapeHighcharts: legend", () => {
  test("renders legend warning for line series", () => {
    const { rerender } = renderChart({
      highcharts,
      options: { series: lineSeries },
      legend: { getItemStatus: (id) => (id === "L1" ? "warning" : "normal") },
    });

    expect(getLegendItems()).toEqual({
      normal: ["L2"],
      warning: ["L1"],
    });

    rerender({
      highcharts,
      options: { series: lineSeries },
      legend: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    expect(getLegendItems()).toEqual({
      normal: ["L1"],
      warning: ["L2"],
    });
  });

  test("renders legend warning for pie segments", () => {
    const { rerender } = renderChart({
      highcharts,
      options: { series: pieSeries },
      legend: { getItemStatus: (id) => (id === "P2" ? "warning" : "normal") },
    });

    expect(getLegendItems()).toEqual({
      normal: ["P1", "P3"],
      warning: ["P2"],
    });

    rerender({
      highcharts,
      options: { series: pieSeries },
      legend: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    expect(getLegendItems()).toEqual({
      normal: ["P1", "P2"],
      warning: ["P3"],
    });
  });
});

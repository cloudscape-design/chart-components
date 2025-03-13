// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import { CloudscapeHighchartsWrapper, renderChart } from "./common";

function getLegendItemsContent(wrapper: CloudscapeHighchartsWrapper) {
  return wrapper.findLegendItems().map((w) => w.getElement().textContent);
}
function getWarningLegendItemsContent(wrapper: CloudscapeHighchartsWrapper) {
  return wrapper.findLegendItemsWithWarning().map((w) => w.getElement().textContent);
}

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line series 1", data: [1, 2, 3] },
  { type: "line", name: "Line series 2", data: [4, 5, 6], id: "testid" },
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

describe("CloudscapeHighcharts: legend markers", () => {
  test("renders legend warning for line series", async () => {
    const { wrapper, rerender } = renderChart({
      highcharts,
      options: { series: lineSeries },
      legendMarkers: { getItemStatus: (id) => (id === "Line series 1" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["Line series 1"]);
    });

    rerender({
      highcharts,
      options: { series: lineSeries },
      legendMarkers: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["Line series 2"]);
    });
  });

  test("renders legend warning for pie segments", async () => {
    const { wrapper, rerender } = renderChart({
      highcharts,
      options: { series: pieSeries },
      legendMarkers: { getItemStatus: (id) => (id === "P2" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["P1", "P2", "P3"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["P2"]);
    });

    rerender({
      highcharts,
      options: { series: pieSeries },
      legendMarkers: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["P1", "P2", "P3"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["P3"]);
    });
  });
});

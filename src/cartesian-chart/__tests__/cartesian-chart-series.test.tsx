// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { getChart, renderCartesianChart } from "./common";

const hc = new HighchartsTestHelper(highcharts);

const allSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "area", name: "Area", data: [{ x: 1, y: 1 }], color: "1" },
  { type: "areaspline", name: "Area spline", data: [{ x: 1, y: 2 }], color: "2" },
  { type: "column", name: "Column", data: [{ x: 1, y: 3 }], color: "3", id: "column" },
  { type: "errorbar", name: "Error bar", data: [{ x: 1, low: 4, high: 5 }], color: "4", linkedTo: "column" },
  { type: "line", name: "Line", data: [{ x: 1, y: 6 }], color: "5" },
  { type: "scatter", name: "Scatter", data: [{ x: 1, y: 7 }], color: "6" },
  { type: "spline", name: "Spline", data: [{ x: 1, y: 8 }], color: "7" },
  { type: "x-threshold", name: "X threshold", value: 1, color: "8" },
  { type: "y-threshold", name: "Y threshold", value: 9, color: "9" },
];

describe("CartesianChart: series", () => {
  test("renders all supported series types", () => {
    renderCartesianChart({ highcharts, series: allSeries });
    expect(getChart().findSeries()).toHaveLength(9);
  });

  test("series color is assigned", () => {
    renderCartesianChart({ highcharts, series: allSeries });
    for (let i = 0; i < allSeries.length; i++) {
      expect(hc.getChartSeries(i).color).toBe(`${i + 1}`);
    }
  });

  test("renders threshold series only", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "x-threshold", name: "X threshold", value: 1 },
        { type: "y-threshold", name: "Y threshold", value: 2 },
      ],
    });
    expect(getChart().findSeries()).toHaveLength(2);
    expect(hc.getChartSeries(0).data).toHaveLength(0);
    expect(hc.getChartSeries(1).data).toHaveLength(0);
  });

  test("renders threshold series along empty series", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", name: "Empty line", data: [] },
        { type: "x-threshold", name: "X threshold", value: 1 },
        { type: "y-threshold", name: "Y threshold", value: 2 },
      ],
    });
    expect(getChart().findSeries()).toHaveLength(3);
    expect(hc.getChartSeries(0).data).toHaveLength(0);
    expect(hc.getChartSeries(1).data).toHaveLength(0);
    expect(hc.getChartSeries(2).data).toHaveLength(0);
  });

  test("renders x-threshold series along series with y=null", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", name: "Empty line", data: [{ x: 5, y: null }] },
        { type: "x-threshold", name: "X threshold", value: 1 },
      ],
    });
    expect(getChart().findSeries()).toHaveLength(2);
    expect(hc.getChartSeries(0).data.map((d) => [d.x, d.y])).toEqual([[5, null]]);
    expect(hc.getChartSeries(1).data).toHaveLength(0);
  });

  test("renders threshold series along non-empty series", () => {
    renderCartesianChart({
      highcharts,
      series: [
        {
          type: "line",
          name: "Line",
          data: [
            { x: 1, y: 2 },
            { x: 3, y: 4 },
          ],
        },
        { type: "x-threshold", name: "X threshold", value: 5 },
        { type: "y-threshold", name: "Y threshold", value: 6 },
      ],
    });
    expect(getChart().findSeries()).toHaveLength(3);
    expect(hc.getChartSeries(0).data.map((d) => [d.x, d.y])).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(hc.getChartSeries(1).data.map((d) => [d.x, d.y])).toEqual([[5, 2]]);
    expect(hc.getChartSeries(2).data.map((d) => [d.x, d.y])).toEqual([
      [1, 6],
      [3, 6],
    ]);
  });

  test("updates thresholds when extremes change", () => {
    const { rerender } = renderCartesianChart({
      highcharts,
      series: [
        { type: "line", name: "Line", data: [] },
        { type: "x-threshold", name: "X threshold", value: 1 },
        { type: "y-threshold", name: "Y threshold", value: 1 },
      ],
    });
    expect(hc.getChartSeries(1).data).toHaveLength(0);
    expect(hc.getChartSeries(2).data).toHaveLength(0);

    function getFirstPoint(array: Highcharts.Point[]) {
      return [array[0].x, array[0].y];
    }
    function getLastPoint(array: Highcharts.Point[]) {
      return [array[array.length - 1].x, array[array.length - 1].y];
    }

    for (let x = 1; x <= 2; x++) {
      for (let y = 1; y <= 2; y++) {
        rerender({
          highcharts,
          series: [
            { type: "line", name: "Line", data: [{ x, y }] },
            { type: "x-threshold", name: "X threshold", value: 1 },
            { type: "y-threshold", name: "Y threshold", value: 1 },
          ],
        });

        expect(getFirstPoint(hc.getChartSeries(1).data)).toEqual([1, y]);
        expect(getLastPoint(hc.getChartSeries(1).data)).toEqual([1, y]);
        expect(getFirstPoint(hc.getChartSeries(2).data)).toEqual([x, 1]);
        expect(getLastPoint(hc.getChartSeries(2).data)).toEqual([x, 1]);
      }
    }
  });
});

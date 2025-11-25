// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import {
  getChartLegendItems,
  getPointColor,
  getSeriesColor,
  getSeriesMarkerType,
  shouldShowSecondaryLegend,
} from "../../../lib/components/core/utils";
import { renderChart } from "./common";

describe("CoreChart: utils", () => {
  test.each([
    ["large-square", undefined],
    ["large-square", { type: "column", options: {} }],
    ["large-square", { type: "pie", options: {} }],
    ["large-square", { type: "errorbar", options: {} }],
    ["large-square", { type: "unknown", options: {} }],
    ["hollow-square", { type: "area", options: {} }],
    ["hollow-square", { type: "areaspline", options: {} }],
    ["line", { type: "line", options: {} }],
    ["line", { type: "line", options: { dashStyle: "Solid" } }],
    ["hollow-square", { type: "area", options: { dashStyle: "Solid" } }],
    ["dashed", { type: "line", options: { dashStyle: "Dash" } }],
    ["dashed", { type: "line", options: { dashStyle: "Dot" } }],
    ["line", { type: "spline", options: {} }],
    ["dashed", { type: "unknown", options: { dashStyle: true } }],
    ["square", { type: "scatter", symbol: "square", options: {} }],
    ["diamond", { type: "scatter", symbol: "diamond", options: {} }],
    ["triangle", { type: "scatter", symbol: "triangle", options: {} }],
    ["triangle-down", { type: "scatter", symbol: "triangle-down", options: {} }],
    ["circle", { type: "scatter", symbol: "circle", options: {} }],
    ["circle", { type: "scatter", symbol: "unknown", options: {} }],
  ])('getSeriesMarkerType returns "%s" for series %j', (markerType, series) => {
    expect(getSeriesMarkerType(series as any)).toBe(markerType);
  });

  test.each([getSeriesColor, getPointColor].map((fn) => [fn.name, fn] as const))(
    "%s returns color if string or black if not",
    (_, method: (seriesOrPoint: any) => unknown) => {
      expect(method({ color: "red" })).toBe("red");
      expect(method({ color: "#unknown" })).toBe("#unknown");
      expect(method(undefined)).toBe("black");
      expect(method({ color: {} })).toBe("black");
      expect(method({ color: 12345 })).toBe("black");
    },
  );

  describe("getChartLegendItems", () => {
    test("sets isSecondary to false for series on primary y-axis", () => {
      let chartApi: CoreChartProps.ChartAPI | null = null;
      renderChart({
        highcharts,
        options: {
          yAxis: {
            opposite: false,
          },
          series: [
            {
              data: [],
              type: "line",
              visible: true,
              name: "Series 1",
            },
          ],
        },
        callback: (api) => (chartApi = api),
      });

      const items = getChartLegendItems(chartApi!.chart);
      expect(items[0].isSecondary).toBe(false);
    });

    test("sets isSecondary to true for series on secondary y-axis", () => {
      let chartApi: CoreChartProps.ChartAPI | null = null;
      renderChart({
        highcharts,
        options: {
          yAxis: {
            opposite: true,
          },
          series: [
            {
              type: "line",
              visible: true,
              name: "Series 1",
            },
          ],
        },
        callback: (api) => (chartApi = api),
      });

      const items = getChartLegendItems(chartApi!.chart);
      expect(items[0].isSecondary).toBe(true);
    });

    test.each(["pie", "gauge"] as const)("sets isSecondary to false for %s", (type) => {
      let chartApi: CoreChartProps.ChartAPI | null = null;
      renderChart({
        highcharts,
        options: {
          yAxis: { opposite: false },
          series: [
            {
              type,
              visible: true,
              showInLegend: true,
              name: "Series",
              data: [
                { name: "Segment 1", color: "red", value: 30 },
                { name: "Segment 2", color: "blue", value: 70 },
              ],
            },
          ],
        },
        callback: (api) => (chartApi = api),
      });

      const items = getChartLegendItems(chartApi!.chart);

      if (type === "gauge") {
        expect(items).toHaveLength(1);
        expect(items[0].isSecondary).toBe(false);
      } else {
        expect(items).toHaveLength(2);
        expect(items[0].isSecondary).toBe(false);
        expect(items[1].isSecondary).toBe(false);
      }
    });
  });

  describe("shouldShowSecondaryLegend", () => {
    describe("non-inverted charts", () => {
      test("returns false when only primary y-axis series exist", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: false }, { opposite: false }],
          series: [
            { type: "line", name: "Series 1", yAxis: 0 },
            { type: "line", name: "Series 2", yAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });

      test("returns true when only secondary y-axis series exist", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: true }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", yAxis: 0 },
            { type: "line", name: "Series 2", yAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("returns true when both primary and secondary y-axis series exist", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", yAxis: 0 },
            { type: "line", name: "Series 2", yAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("returns false when no series exist", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: false }, { opposite: true }],
          series: [],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });

      test("ignores series with showInLegend=false", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", yAxis: 0 },
            { type: "line", name: "Series 2", yAxis: 1, showInLegend: false },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });

      test("handles series referencing axes by id", () => {
        const options: highcharts.Options = {
          yAxis: [
            { id: "primary", opposite: false },
            { id: "secondary", opposite: true },
          ],
          series: [
            { type: "line", name: "Series 1", yAxis: "primary" },
            { type: "line", name: "Series 2", yAxis: "secondary" },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("handles default yAxis (defaults to 0)", () => {
        const options: highcharts.Options = {
          yAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1" },
            { type: "line", name: "Series 2", yAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });
    });

    describe("inverted charts", () => {
      test("returns false when only primary x-axis series exist", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [{ opposite: false }, { opposite: false }],
          series: [
            { type: "line", name: "Series 1", xAxis: 0 },
            { type: "line", name: "Series 2", xAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });

      test("returns true when only secondary x-axis series exist", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [{ opposite: true }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", xAxis: 0 },
            { type: "line", name: "Series 2", xAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("returns true when both primary and secondary x-axis series exist", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", xAxis: 0 },
            { type: "line", name: "Series 2", xAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("ignores series with showInLegend=false in inverted charts", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", xAxis: 0 },
            { type: "line", name: "Series 2", xAxis: 1, showInLegend: false },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });

      test("handles series referencing x-axes by id in inverted charts", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [
            { id: "primary", opposite: false },
            { id: "secondary", opposite: true },
          ],
          series: [
            { type: "line", name: "Series 1", xAxis: "primary" },
            { type: "line", name: "Series 2", xAxis: "secondary" },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("handles default xAxis in inverted charts (defaults to 0)", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          xAxis: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1" },
            { type: "line", name: "Series 2", xAxis: 1 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(true);
      });

      test("ignores y-axis in inverted charts and checks x-axis instead", () => {
        const options: highcharts.Options = {
          chart: { inverted: true },
          yAxis: [{ opposite: false }, { opposite: true }],
          xAxis: [{ opposite: false }],
          series: [
            { type: "line", name: "Series 1", yAxis: 0, xAxis: 0 },
            { type: "line", name: "Series 2", yAxis: 1, xAxis: 0 },
          ],
        };
        expect(shouldShowSecondaryLegend(options)).toBe(false);
      });
    });
  });
});

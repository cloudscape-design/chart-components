// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import {
  getChartLegendItems,
  getLegendsProps,
  getPointColor,
  getSeriesColor,
  getSeriesMarkerType,
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
    describe.each([{ inverted: true }, { inverted: false }])("charts, chartOptions = %s", (chartOptions) => {
      const axisKey = chartOptions.inverted ? "xAxis" : "yAxis";
      const oppositeAxisKey = chartOptions.inverted ? "yAxis" : "xAxis";

      test.each([{ opposite: true }, { opposite: false }])(
        "axisOptions = %s, sets isSecondary for series on default axis",
        (axisOptions) => {
          let chartApi: CoreChartProps.ChartAPI | null = null;
          renderChart({
            highcharts,
            options: {
              chart: chartOptions,
              [axisKey]: axisOptions,
              [oppositeAxisKey]: { opposite: !axisOptions.opposite },
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

          const items = getChartLegendItems({ chart: chartApi!.chart });
          expect(items[0].isSecondary).toBe(axisOptions.opposite);
        },
      );

      test("handles multiple axes", () => {
        let chartApi: CoreChartProps.ChartAPI | null = null;
        renderChart({
          highcharts,
          options: {
            chart: chartOptions,
            [axisKey]: [{ opposite: false }, { opposite: true }],
            series: [
              {
                type: "line",
                visible: true,
                name: "Primary Series",
                [axisKey]: 0,
              },
              {
                type: "line",
                visible: true,
                name: "Secondary Series",
                [axisKey]: 1,
              },
            ],
          },
          callback: (api) => (chartApi = api),
        });

        const items = getChartLegendItems({ chart: chartApi!.chart });
        expect(items).toHaveLength(2);
        expect(items[0].isSecondary).toBe(false);
        expect(items[1].isSecondary).toBe(true);
      });
    });

    test.each(["pie", "gauge", "solidgauge"] as const)("sets isSecondary to false for %s", (type) => {
      let chartApi: CoreChartProps.ChartAPI | null = null;
      renderChart({
        highcharts,
        options: {
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

      const items = getChartLegendItems({ chart: chartApi!.chart });

      if (type === "gauge" || type === "solidgauge") {
        expect(items).toHaveLength(1);
        expect(items[0].isSecondary).toBe(false);
      } else {
        expect(items).toHaveLength(2);
        expect(items[0].isSecondary).toBe(false);
        expect(items[1].isSecondary).toBe(false);
      }
    });
  });

  describe("getLegendsProps", () => {
    describe.each([{ inverted: true }, { inverted: false }])("charts, chartOptions = %s", (chartOptions) => {
      const axisKey = chartOptions.inverted ? "xAxis" : "yAxis";
      const oppositeAxisKey = chartOptions.inverted ? "yAxis" : "xAxis";

      test("returns primary legend but no secondary legend when only primary series exist", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }, { opposite: false }],
          series: [
            { type: "line", name: "Series 1", [axisKey]: 0 },
            { type: "line", name: "Series 2", [axisKey]: 1 },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeUndefined();
      });

      test("returns both primary and secondary legends when both axis types have series", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", [axisKey]: 0 },
            { type: "line", name: "Series 2", [axisKey]: 1 },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeDefined();
      });

      test("returns no legends when no series exist", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }, { opposite: true }],
          series: [],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeUndefined();
        expect(result.secondary).toBeUndefined();
      });

      test("returns only primary legend when secondary series has showInLegend=false", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", [axisKey]: 0 },
            { type: "line", name: "Series 2", [axisKey]: 1, showInLegend: false },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeUndefined();
      });

      test("returns both legends when series reference axes by id", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [
            { id: "primary", opposite: false },
            { id: "secondary", opposite: true },
          ],
          series: [
            { type: "line", name: "Series 1", [axisKey]: "primary" },
            { type: "line", name: "Series 2", [axisKey]: "secondary" },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeDefined();
      });

      test("returns both legends when series use default axis (defaults to 0)", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1" },
            { type: "line", name: "Series 2", [axisKey]: 1 },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeDefined();
      });

      test("returns only primary legend when ignoring the opposite axis key", () => {
        const options: highcharts.Options = {
          chart: chartOptions,
          [axisKey]: [{ opposite: false }],
          [oppositeAxisKey]: [{ opposite: false }, { opposite: true }],
          series: [
            { type: "line", name: "Series 1", [oppositeAxisKey]: 0, [axisKey]: 0 },
            { type: "line", name: "Series 2", [oppositeAxisKey]: 1, [axisKey]: 0 },
          ],
        };
        const result = getLegendsProps(options, undefined);
        expect(result.primary).toBeDefined();
        expect(result.secondary).toBeUndefined();
      });
    });
  });
});

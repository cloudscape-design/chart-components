// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  getChartLegendItems,
  getPointColor,
  getSeriesColor,
  getSeriesMarkerType,
} from "../../../lib/components/core/utils";

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
      const chart = {
        series: [
          {
            type: "line",
            name: "Series 1",
            visible: true,
            options: {},
            yAxis: { options: { opposite: false } },
            data: [],
          },
        ],
      } as any;

      const items = getChartLegendItems(chart);
      expect(items[0].isSecondary).toBe(false);
    });

    test("sets isSecondary to true for series on secondary y-axis", () => {
      const chart = {
        series: [
          {
            type: "line",
            name: "Series 1",
            visible: true,
            options: {},
            yAxis: { options: { opposite: true } },
            data: [],
          },
        ],
      } as any;

      const items = getChartLegendItems(chart);
      expect(items[0].isSecondary).toBe(true);
    });

    test("sets isSecondary to false when yAxis is undefined", () => {
      const chart = {
        series: [
          {
            type: "line",
            name: "Series 1",
            visible: true,
            options: {},
            data: [],
          },
        ],
      } as any;

      const items = getChartLegendItems(chart);
      expect(items[0].isSecondary).toBe(false);
    });

    test("sets isSecondary for pie chart points based on series yAxis", () => {
      const chart = {
        series: [
          {
            type: "pie",
            name: "Pie Series",
            visible: true,
            options: {},
            yAxis: { options: { opposite: true } },
            data: [
              { name: "Segment 1", visible: true, color: "red", series: { type: "pie", options: {} }, options: {} },
              { name: "Segment 2", visible: true, color: "blue", series: { type: "pie", options: {} }, options: {} },
            ],
          },
        ],
      } as any;

      const items = getChartLegendItems(chart);
      expect(items).toHaveLength(2);
      expect(items[0].isSecondary).toBe(true);
      expect(items[1].isSecondary).toBe(true);
    });
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  getColor,
  getPointColor,
  getSeriesColor,
  getSeriesMarkerType,
  getSolidGaugeColor,
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

  describe("getSolidGaugeColor", () => {
    test("returns color from yAxis.options stops if available", () => {
      const yAxis = {
        options: {
          stops: [
            ["0%", "#ff0000"],
            ["100%", "#00ff00"],
          ],
        },
      } as any;
      expect(getSolidGaugeColor(yAxis)).toBe("#ff0000");
    });

    test("returns color from yAxis.userOptions stops if available", () => {
      const yAxis = {
        userOptions: {
          stops: [
            ["0%", "#ff0000"],
            ["100%", "#00ff00"],
          ],
        },
      } as any;
      expect(getSolidGaugeColor(yAxis)).toBe("#ff0000");
    });

    test("returns black if no stops available", () => {
      expect(getSolidGaugeColor(undefined)).toBe("black");
      expect(getSolidGaugeColor({} as any)).toBe("black");
      expect(getSolidGaugeColor({ stops: [] } as any)).toBe("black");
      expect(getSolidGaugeColor({ stops: [[]] } as any)).toBe("black");
    });

    test("returns black if stop color is not a string", () => {
      const yAxis = {
        stops: [["0%", 123]],
      } as any;
      expect(getSolidGaugeColor(yAxis)).toBe("black");
    });

    test("handles malformed stops arrays", () => {
      // Non-array stops
      expect(getSolidGaugeColor({ stops: "invalid" } as any)).toBe("black");

      // Empty first stop
      expect(getSolidGaugeColor({ stops: [[]] } as any)).toBe("black");

      // First stop with only one element
      expect(getSolidGaugeColor({ stops: [["0%"]] } as any)).toBe("black");

      // Non-array first stop
      expect(getSolidGaugeColor({ stops: ["invalid"] } as any)).toBe("black");
    });
  });

  describe("getColor", () => {
    test("calls getSolidGaugeColor for solidgauge series", () => {
      const chart = {
        series: [{ type: "solidgauge" }],
        yAxis: [{ options: { stops: [["0%", "#ff0000"]] } }],
      } as any;

      const result = getColor(chart, 0);
      expect(result).toBe("#ff0000");
    });

    test("calls getSeriesColor for non-solidgauge series", () => {
      const chart = {
        series: [{ type: "line", color: "#00ff00" }],
        yAxis: [{}],
      } as any;

      const result = getColor(chart, 0);
      expect(result).toBe("#00ff00");
    });

    test("correctly identifies solidgauge vs other series types", () => {
      const chart = {
        series: [
          { type: "line", color: "#blue" },
          { type: "solidgauge" },
          { type: "column", color: "#green" },
          { type: "solidgauge" },
        ],
        yAxis: [{}, { options: { stops: [["0%", "#red"]] } }, {}, { options: { stops: [["0%", "#yellow"]] } }],
      } as any;

      // Line series should use getSeriesColor
      expect(getColor(chart, 0)).toBe("#blue");

      // First solidgauge should use getSolidGaugeColor
      expect(getColor(chart, 1)).toBe("#red");

      // Column series should use getSeriesColor
      expect(getColor(chart, 2)).toBe("#green");

      // Second solidgauge should use getSolidGaugeColor
      expect(getColor(chart, 3)).toBe("#yellow");
    });

    test("handles edge cases gracefully", () => {
      // Missing series
      const emptyChart = { series: [], yAxis: [] } as any;
      expect(getColor(emptyChart, 0)).toBe("black");

      // Out of bounds index
      const chart = {
        series: [{ type: "line", color: "#blue" }],
        yAxis: [{}],
      } as any;
      expect(getColor(chart, 5)).toBe("black");

      // Solidgauge with missing yAxis
      const chartMissingYAxis = {
        series: [{ type: "solidgauge" }],
        yAxis: [],
      } as any;
      expect(getColor(chartMissingYAxis, 0)).toBe("black");

      // Null/undefined series
      expect(getColor({ series: [null], yAxis: [] } as any, 0)).toBe("black");
    });

    test("case sensitivity of series type", () => {
      const chart = {
        series: [
          { type: "solidgauge" },
          { type: "SOLIDGAUGE" }, // Different case
          { type: "SolidGauge" }, // Mixed case
        ],
        yAxis: [
          { options: { stops: [["0%", "#red"]] } },
          { options: { stops: [["0%", "#blue"]] } },
          { options: { stops: [["0%", "#green"]] } },
        ],
      } as any;

      // Only exact match "solidgauge" should use getSolidGaugeColor
      expect(getColor(chart, 0)).toBe("#red");
      expect(getColor(chart, 1)).toBe("black"); // Should fall back to getSeriesColor -> black
      expect(getColor(chart, 2)).toBe("black"); // Should fall back to getSeriesColor -> black
    });
  });
});

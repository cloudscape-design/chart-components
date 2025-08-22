// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getPointColor, getSeriesMarkerType } from "../../../lib/components/core/utils";
import { getColor } from "../color-strategy";

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
    expect(getSeriesMarkerType(series as Highcharts.Series | undefined)).toBe(markerType);
  });

  test.each([getPointColor].map((fn) => [fn.name, fn] as const))(
    "%s returns color if string or black if not",
    (_, method: (seriesOrPoint: unknown) => unknown) => {
      expect(method({ color: "red" })).toBe("red");
      expect(method({ color: "#unknown" })).toBe("#unknown");
      expect(method(undefined)).toBe("black");
      expect(method({ color: {} })).toBe("black");
      expect(method({ color: 12345 })).toBe("black");
    },
  );

  describe("getColor", () => {
    test("extracts colors from stops for solidgauge series with data values", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: 10 }],
        yAxis: {
          min: 0,
          max: 100,
          options: {
            stops: [
              [0.1, "#FF0000"], // 10% - red
              [0.5, "#FFFF00"], // 50% - yellow
              [0.9, "#00FF00"], // 90% - green
            ],
          },
        },
      };

      // Data value 10 is 10% of range (0-100), should get first stop color
      const result = getColor(series);
      expect(result).toBe("#FF0000");
    });

    test("extracts colors from stops with multiple data points", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: 70 }], // 75% of range
        yAxis: {
          min: 0,
          max: 100,
          options: {
            stops: [
              [0.3, "#FF0000"],
              [0.7, "#FFFF00"],
              [0.9, "#00FF00"],
            ],
          },
        },
      };

      // Data value 75 is 75% of range, should get second stop color
      const result = getColor(series);
      expect(result).toBe("#FFFF00");
    });

    test("handles solidgauge with empty stops array", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: 50 }],
        yAxis: {
          min: 0,
          max: 100,
          options: { stops: [] },
        },
      };

      const result = getColor(series);
      expect(result).toBe("black"); // Should fallback to default
    });

    test("handles solidgauge with missing stops", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: 50 }],
        yAxis: {
          min: 0,
          max: 100,
          options: {},
        },
      };

      const result = getColor(series);
      expect(result).toBe("black"); // Should fallback to default
    });

    test("handles solidgauge with malformed stops", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: 50 }],
        yAxis: {
          min: 0,
          max: 100,
          options: {
            stops: [
              [null, "#red"], // Invalid stop
              ["invalid", "#blue"], // Invalid stop
              [0.5, null], // Invalid color
            ],
          },
        },
      };

      const result = getColor(series);
      expect(result).toBe("black"); // Should fallback to default for malformed data
    });

    test("handles solidgauge with no data", () => {
      const series = {
        type: "solidgauge",
        data: [],
        yAxis: {
          min: 0,
          max: 100,
          options: {
            stops: [[0.5, "#blue"]],
          },
        },
      };

      const result = getColor(series);
      expect(result).toBe("black"); // Should fallback to default when no data
    });

    test("handles solidgauge with undefined data values", () => {
      const series = {
        type: "solidgauge",
        data: [{ y: undefined }],
        yAxis: {
          min: 0,
          max: 100,
          options: {
            stops: [[0.5, "#purple"]],
          },
        },
      };

      const result = getColor(series);
      expect(result).toBe("black"); // Should fallback to default for undefined values
    });

    test.each([
      [{ color: "red" }, "red"],
      [{ color: "#unknown" }, "#unknown"],
      [{ color: undefined }, "black"],
      [{ color: {} }, "black"],
      [{ color: 12345 }, "black"],
    ])(
      "extracts colors for non-solidgauge series",
      (colorProp: { color?: string | number | object }, expected: string) => {
        const series = { type: "line", color: colorProp.color };

        const result = getColor(series);
        expect(result).toBe(expected);
      },
    );

    test("extracts colors for non-solidgauge series", () => {
      const series = { type: "line", color: "#00ff00" };

      const result = getColor(series);
      expect(result).toBe("#00ff00");
    });

    test("correctly identifies solidgauge vs other series types", () => {
      const lineSeries = { type: "line", color: "#blue" };
      const solidgaugeSeries1 = {
        type: "solidgauge",
        data: [{ y: 60 }],
        yAxis: {
          min: 0,
          max: 100,
          options: { stops: [[0.5, "#red"]] },
        },
      };
      const columnSeries = { type: "column", color: "#green" };
      const solidgaugeSeries2 = {
        type: "solidgauge",
        data: [{ y: 90 }],
        yAxis: {
          min: 0,
          max: 100,
          options: { stops: [[0.8, "#yellow"]] },
        },
      };

      expect(getColor(lineSeries)).toBe("#blue");
      expect(getColor(solidgaugeSeries1)).toBe("#red");
      expect(getColor(columnSeries)).toBe("#green");
      expect(getColor(solidgaugeSeries2)).toBe("#yellow");
    });

    test("handles edge cases gracefully", () => {
      // Undefined series
      expect(getColor(undefined)).toBe("black");

      // Null series
      expect(getColor(null)).toBe("black");

      // Solidgauge with missing yAxis
      const solidgaugeWithoutYAxis = { type: "solidgauge" };
      expect(getColor(solidgaugeWithoutYAxis)).toBe("black");

      // Series with invalid color
      const seriesWithInvalidColor = { type: "line", color: null };
      expect(getColor(seriesWithInvalidColor)).toBe("black");
    });

    test("case sensitivity of series type", () => {
      const solidgaugeSeries = {
        type: "solidgauge",
        data: [{ y: 50 }],
        yAxis: { options: { stops: [[0.5, "#red"]] } },
      };
      const upperCaseSeries = { type: "SOLIDGAUGE" }; // Different case
      const mixedCaseSeries = { type: "SolidGauge" }; // Mixed case

      // Only exact match "solidgauge"
      expect(getColor(solidgaugeSeries)).toBe("#red");
      expect(getColor(upperCaseSeries)).toBe("black"); // Falls back to default
      expect(getColor(mixedCaseSeries)).toBe("black"); // Falls back to default
    });
  });
});

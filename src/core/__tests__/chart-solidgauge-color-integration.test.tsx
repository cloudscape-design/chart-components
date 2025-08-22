// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import { getChartLegendItems } from "../utils";
import { renderStatefulChart } from "./common";
// Mock the solid-gauge module to prevent constructor errors in tests
vi.mock("highcharts/modules/solid-gauge", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    default: vi.fn(() => {}), // Mock the default export as a function
  };
});

// Import and initialize the solid-gauge module properly for testing
beforeAll(async () => {
  // Import highcharts-more first (required dependency for solid-gauge)
  const highchartsMore = await import("highcharts/highcharts-more");
  if (typeof highchartsMore.default === "function") {
    highchartsMore.default(highcharts);
  }

  // Then import solid-gauge module
  const solidGaugeModule = await import("highcharts/modules/solid-gauge");
  // Initialize the module with highcharts instance
  if (typeof solidGaugeModule.default === "function") {
    solidGaugeModule.default(highcharts);
  }
});

describe("SolidGauge Chart Color Integration", () => {
  test("renders solid gauge chart with correct colors based on data values", () => {
    const chartOptions: Highcharts.Options = {
      chart: {
        type: "solidgauge",
      },
      series: [
        {
          name: "Low Usage",
          type: "solidgauge",
          data: [10], // Should get green color (0.1 stop)
          showInLegend: true,
        },
        {
          name: "Medium Usage",
          type: "solidgauge",
          data: [50], // Should get yellow color (0.5 stop)
          showInLegend: true,
        },
        {
          name: "High Usage",
          type: "solidgauge",
          data: [85], // Should get red color (0.8 stop)
          showInLegend: true,
        },
      ],
      yAxis: {
        min: 0,
        max: 100,
        stops: [
          [0.1, "#55BF3B"], // Green at 10%
          [0.5, "#DDDF0D"], // Yellow at 50%
          [0.8, "#DF5353"], // Red at 80%
        ],
      },
    };

    renderStatefulChart({
      highcharts,
      options: chartOptions,
    });

    const chartInstance = highcharts.charts.find((c) => c)!;
    expect(chartInstance).toBeDefined();
    // Test that legend items have correct colors based on data values
    const legendItems = getChartLegendItems(chartInstance);

    expect(legendItems).toHaveLength(3);

    // Low usage (15) should get green color
    const lowUsageItem = legendItems.find((item) => item.name === "Low Usage");
    expect(lowUsageItem?.color).toBe("#55BF3B");

    // Medium usage (60) should get yellow color
    const mediumUsageItem = legendItems.find((item) => item.name === "Medium Usage");
    expect(mediumUsageItem?.color).toBe("#DDDF0D");

    // High usage (85) should get red color
    const highUsageItem = legendItems.find((item) => item.name === "High Usage");
    expect(highUsageItem?.color).toBe("#DF5353");
  });

  test("handles edge case values correctly", () => {
    const chartOptions: Highcharts.Options = {
      chart: {
        type: "solidgauge",
      },
      series: [
        {
          name: "Edge Low",
          type: "solidgauge",
          data: [5], // Below first stop, should get first stop color
          showInLegend: true,
        },
        {
          name: "Edge Boundary",
          type: "solidgauge",
          data: [50], // Exactly at 0.5 stop
          showInLegend: true,
        },
      ],
      yAxis: {
        min: 0,
        max: 100,
        stops: [
          [0.1, "#55BF3B"],
          [0.5, "#DDDF0D"],
          [0.8, "#DF5353"],
        ],
      },
    };

    renderStatefulChart({
      highcharts,
      options: chartOptions,
    });

    const chartInstance = highcharts.charts.find((c) => c)!;
    const legendItems = getChartLegendItems(chartInstance);

    // Value below first stop should still get first stop color
    const edgeLowItem = legendItems.find((item) => item.name === "Edge Low");
    expect(edgeLowItem?.color).toBe("#55BF3B");

    // Value exactly at boundary should get that stop's color
    const edgeBoundaryItem = legendItems.find((item) => item.name === "Edge Boundary");
    expect(edgeBoundaryItem?.color).toBe("#DDDF0D");
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";

import "highcharts/highcharts-more";
import { createChartWrapper, renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 100));

describe("CoreChart: highlight", () => {
  test("highlights linked errorbar when target series is highlighted", async () => {
    renderChart({
      highcharts,
      options: {
        series: [
          { type: "line", id: "l1", name: "L1", data: [1, 2] },
          { type: "line", id: "l2", name: "L2", data: [3, 4] },
          {
            type: "errorbar",
            name: "E1",
            linkedTo: "l1",
            data: [
              { low: 0.9, high: 1.1 },
              { low: 1.9, high: 2.1 },
            ],
          },
          {
            type: "errorbar",
            name: "E2",
            linkedTo: "l2",
            data: [
              { low: 2.9, high: 3.1 },
              { low: 3.9, high: 4.1 },
            ],
          },
        ],
      },
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
    expect(hc.getChartSeries(3).state).toBe("");

    act(() => hc.highlightChartPoint(1, 0));

    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("hover");
    expect(hc.getChartSeries(2).state).toBe("inactive");
    expect(hc.getChartSeries(3).state).toBe("hover");

    act(() => hc.leaveChartPoint(1, 0));
    await clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
    expect(hc.getChartSeries(3).state).toBe("");
  });
});

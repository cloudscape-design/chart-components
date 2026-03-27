// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import "highcharts/highcharts-more";
import { colors } from "../../../lib/components/internal/chart-styles";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { renderCartesianChart } from "./common";

const hc = new HighchartsTestHelper(highcharts);

const [color1, color2, color3] = colors;

describe("CartesianChart: linked series color assignment", () => {
  test("linked series inherits color from master series (auto-assigned)", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l1", name: "L1", data: [1] },
        { type: "line", id: "l2", name: "L2", data: [2], linkedTo: "l1" },
        { type: "line", id: "l3", name: "L3", data: [3] },
      ],
    });
    // l1 → color[0], l2 (linked) → color[0], l3 → color[1] (not color[2])
    expect(hc.getChartSeries(0).color).toBe(color1);
    expect(hc.getChartSeries(1).color).toBe(color1);
    expect(hc.getChartSeries(2).color).toBe(color2);
  });

  test("linked series inherits color from master series (explicit color)", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l1", name: "L1", data: [1], color: "red" },
        { type: "line", id: "l2", name: "L2", data: [2], linkedTo: "l1" },
      ],
    });
    expect(hc.getChartSeries(0).color).toBe("red");
    expect(hc.getChartSeries(1).color).toBe("red");
  });

  test("explicit color on linked series overrides master color", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l1", name: "L1", data: [1], color: "red" },
        { type: "line", id: "l2", name: "L2", data: [2], linkedTo: "l1", color: "blue" },
      ],
    });
    expect(hc.getChartSeries(0).color).toBe("red");
    expect(hc.getChartSeries(1).color).toBe("blue");
  });

  test("linked series before master still inherits master color", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l2", name: "L2", data: [2], linkedTo: "l1" },
        { type: "line", id: "l1", name: "L1", data: [1] },
        { type: "line", id: "l3", name: "L3", data: [3] },
      ],
    });
    // l1 and l2 both get color[0]; l3 gets color[1]
    expect(hc.getChartSeries(0).color).toBe(color1); // l2 (linked, before master)
    expect(hc.getChartSeries(1).color).toBe(color1); // l1 (master)
    expect(hc.getChartSeries(2).color).toBe(color2); // l3
  });

  test("linked series using :previous inherits master color", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l1", name: "L1", data: [1] },
        { type: "line", id: "l2", name: "L2", data: [2], linkedTo: ":previous" },
        { type: "line", id: "l3", name: "L3", data: [3] },
      ],
    });
    expect(hc.getChartSeries(0).color).toBe(color1);
    expect(hc.getChartSeries(1).color).toBe(color1);
    expect(hc.getChartSeries(2).color).toBe(color2);
  });

  test("multiple linked series do not consume color slots", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", id: "l1", name: "L1", data: [1] },
        { type: "line", id: "l1a", name: "L1a", data: [2], linkedTo: "l1" },
        { type: "line", id: "l1b", name: "L1b", data: [3], linkedTo: "l1" },
        { type: "line", id: "l2", name: "L2", data: [4] },
        { type: "line", id: "l3", name: "L3", data: [5] },
      ],
    });
    expect(hc.getChartSeries(0).color).toBe(color1); // l1
    expect(hc.getChartSeries(1).color).toBe(color1); // l1a
    expect(hc.getChartSeries(2).color).toBe(color1); // l1b
    expect(hc.getChartSeries(3).color).toBe(color2); // l2
    expect(hc.getChartSeries(4).color).toBe(color3); // l3
  });
});

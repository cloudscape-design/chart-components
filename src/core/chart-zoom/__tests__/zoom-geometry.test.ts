// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import { describe, expect, test } from "vitest";

import { getClusterRect } from "../zoom-geometry";

// A chart with a 40px gutter on each side of the plot, and an x axis mapping a value directly to a pixel.
const chart = {
  chartWidth: 600,
  chartHeight: 400,
  plotLeft: 40,
  plotTop: 40,
  plotWidth: 520,
  plotHeight: 320,
} as Highcharts.Chart;
const clusterSize = { width: 52, height: 24 };

function axis(horiz: boolean) {
  return { horiz, toPixels: (value: number) => value } as unknown as Highcharts.Axis;
}

describe("getClusterRect", () => {
  test.each([
    ["the first point", 40],
    ["a middle point", 300],
    ["the last point", 560],
  ])("centers the cluster on a cursor at %s of a horizontal axis", (_, pixel) => {
    const rect = getClusterRect(chart, axis(true), pixel, clusterSize);
    expect(rect.left + rect.width / 2).toBe(pixel);
    expect(rect.top).toBe(40 + 320 - 24 - 8);
  });

  test.each([
    ["the first point", 40],
    ["the last point", 360],
  ])("centers the cluster on a cursor at %s of a vertical axis", (_, pixel) => {
    const rect = getClusterRect(chart, axis(false), pixel, clusterSize);
    expect(rect.top + rect.height / 2).toBe(pixel);
    expect(rect.left).toBe(40 + 8);
  });

  test("keeps the cluster centered when the gutter beside the plot is narrower than the cluster", () => {
    const narrowGutters = { ...chart, plotLeft: 10, plotWidth: 580 } as Highcharts.Chart;
    expect(getClusterRect(narrowGutters, axis(true), 10, clusterSize).left).toBe(10 - 26);
    expect(getClusterRect(narrowGutters, axis(true), 590, clusterSize).left).toBe(590 - 26);
  });
});

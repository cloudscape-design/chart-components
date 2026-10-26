// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import { describe, expect, test } from "vitest";

import {
  getBandRect,
  getClusterRect,
  getDividerRect,
  isInsidePlot,
  isPixelForward,
  pixelToValue,
} from "../zoom-geometry";

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

function axis(horiz: boolean, reversed = false) {
  const toPixels = (value: number) => (reversed ? 600 - value : value);
  return { horiz, toPixels, toValue: toPixels } as unknown as Highcharts.Axis;
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

describe("getDividerRect", () => {
  test("draws a one pixel line across the plot at the value of a horizontal axis", () => {
    expect(getDividerRect(chart, axis(true), 100)).toEqual({ left: 99.5, top: 40, width: 1, height: 320 });
  });

  test("draws a one pixel line across the plot at the value of a vertical axis", () => {
    expect(getDividerRect(chart, axis(false), 100)).toEqual({ left: 40, top: 99.5, width: 520, height: 1 });
  });
});

describe("getBandRect", () => {
  test.each([
    { name: "in value order", from: 100, to: 200 },
    { name: "in reverse value order", from: 200, to: 100 },
  ])("spans the range between two values given $name", ({ from, to }) => {
    expect(getBandRect(chart, axis(true), from, to)).toEqual({ left: 100, top: 40, width: 100, height: 320 });
    expect(getBandRect(chart, axis(false), from, to)).toEqual({ left: 40, top: 100, width: 520, height: 100 });
  });

  test("keeps a range of a single value visible", () => {
    expect(getBandRect(chart, axis(true), 100, 100).width).toBe(1);
  });
});

describe("isPixelForward", () => {
  test.each([
    { name: "a left-to-right axis", reversed: false, forward: true },
    { name: "a reversed or right-to-left axis", reversed: true, forward: false },
  ])("tells whether increasing values move right on $name", ({ reversed, forward }) => {
    expect(isPixelForward(axis(true, reversed), [100, 200, 300])).toBe(forward);
  });

  test("treats fewer than two values as forward", () => {
    expect(isPixelForward(axis(true, true), [100])).toBe(true);
  });
});

describe("pixelToValue", () => {
  test("reads the pointer position along the axis", () => {
    expect(pixelToValue(axis(true), 120, 300)).toBe(120);
    expect(pixelToValue(axis(false), 120, 300)).toBe(300);
  });
});

describe("isInsidePlot", () => {
  test.each([
    { x: 40, y: 40, inside: true },
    { x: 560, y: 360, inside: true },
    { x: 39, y: 200, inside: false },
    { x: 300, y: 361, inside: false },
  ])("tells whether ($x, $y) is inside the plot", ({ x, y, inside }) => {
    expect(isInsidePlot(chart, x, y)).toBe(inside);
  });
});

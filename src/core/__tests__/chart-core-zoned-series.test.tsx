// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import markerStyles from "../../../lib/components/internal/components/series-marker/styles.selectors";
import { createChartWrapper, renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

function getTooltipMarker(itemIndex: number) {
  const wrapper = createChartWrapper();
  const body = wrapper.findTooltip()!.findBody()!.getElement();
  const markers = body.querySelectorAll(`.${markerStyles.marker}`);
  return markers[itemIndex] as HTMLElement;
}

function getMarkerFillColor(marker: HTMLElement): string {
  const svg = marker.querySelector("svg")!;
  const filled = svg.querySelector("rect[fill]:not([fill='white']):not([fill='black'])") as SVGElement;
  return filled?.getAttribute("fill") ?? "";
}

function isDashedMarker(marker: HTMLElement): boolean {
  const svg = marker.querySelector("svg")!;
  // Dashed marker has two rects (excluding mask rects)
  const rects = svg.querySelectorAll("rect:not([fill='white']):not([fill='black'])");
  return rects.length === 2;
}

describe("CoreChart: zoned series — tooltip marker", () => {
  const seriesWithZones: Highcharts.SeriesOptionsType[] = [
    {
      type: "line",
      id: "s1",
      name: "Series 1",
      color: "blue",
      dashStyle: "Solid",
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ],
      zoneAxis: "x",
      zones: [
        { value: 2, color: "red", dashStyle: "Dash" },
        { color: "green" }, // no dashStyle — should fallback to series dashStyle (Solid)
      ],
    },
  ];

  test("tooltip marker uses zone color when point is in a zone", () => {
    renderChart({ highcharts, options: { series: seriesWithZones } });

    // Point at x=1 is in the first zone (value < 2), zone color is red
    act(() => hc.highlightChartPoint(0, 0));

    const marker = getTooltipMarker(0);
    expect(getMarkerFillColor(marker)).toBe("red");
  });

  test("tooltip marker uses zone dashStyle when zone defines dashStyle", () => {
    renderChart({ highcharts, options: { series: seriesWithZones } });

    // Point at x=1 is in the first zone which has dashStyle: "Dash"
    act(() => hc.highlightChartPoint(0, 0));

    const marker = getTooltipMarker(0);
    expect(isDashedMarker(marker)).toBe(true);
  });

  test("tooltip marker falls back to series color when zone has no color", () => {
    const seriesNoZoneColor: Highcharts.SeriesOptionsType[] = [
      {
        type: "line",
        id: "s1",
        name: "Series 1",
        color: "blue",
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        zoneAxis: "x",
        zones: [{ value: 2 }], // no color, no dashStyle
      },
    ];

    renderChart({ highcharts, options: { series: seriesNoZoneColor } });

    act(() => hc.highlightChartPoint(0, 0));

    const marker = getTooltipMarker(0);
    expect(getMarkerFillColor(marker)).toBe("blue");
  });

  test("tooltip marker falls back to series dashStyle when zone has no dashStyle", () => {
    renderChart({ highcharts, options: { series: seriesWithZones } });

    // Point at x=3 is in the second zone which has no dashStyle — series dashStyle is "Solid"
    act(() => hc.highlightChartPoint(0, 2));

    const marker = getTooltipMarker(0);
    expect(isDashedMarker(marker)).toBe(false);
  });

  test("tooltip marker uses zone color for second zone", () => {
    renderChart({ highcharts, options: { series: seriesWithZones } });

    // Point at x=3 is in the second zone, zone color is green
    act(() => hc.highlightChartPoint(0, 2));

    const marker = getTooltipMarker(0);
    expect(getMarkerFillColor(marker)).toBe("green");
  });
});

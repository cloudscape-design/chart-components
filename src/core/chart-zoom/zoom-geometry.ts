// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { Rect } from "../interfaces";

// The rectangles are in physical pixels relative to the chart, matching chart.plotLeft, plotTop, and toPixels.

// Thickness of the boundary lines drawn over the plot, matching the chart's own cursor line.
const DIVIDER_THICKNESS = 1;

// In an inverted chart the x axis runs vertically, so every pixel computation swaps the two dimensions
// and Axis.toValue / toPixels operate on chart y coordinates instead of x ones.
function isXAxisHorizontal(xAxis: Pick<Highcharts.Axis, "horiz">): boolean {
  return xAxis.horiz !== false;
}

// Converts an x-axis value into a chart-relative pixel along the axis.
function valueToPixel(xAxis: Highcharts.Axis, value: number): number {
  return xAxis.toPixels(value, false);
}

// A line across the plot at the given x value.
export function getDividerRect(chart: Highcharts.Chart, xAxis: Highcharts.Axis, value: number): Rect {
  const pixel = valueToPixel(xAxis, value);
  return isXAxisHorizontal(xAxis)
    ? {
        x: pixel - DIVIDER_THICKNESS / 2,
        y: chart.plotTop,
        width: DIVIDER_THICKNESS,
        height: chart.plotHeight,
      }
    : {
        x: chart.plotLeft,
        y: pixel - DIVIDER_THICKNESS / 2,
        width: chart.plotWidth,
        height: DIVIDER_THICKNESS,
      };
}

// The band covering the range between two x values, spanning the plot across the other dimension.
export function getBandRect(chart: Highcharts.Chart, xAxis: Highcharts.Axis, fromValue: number, toValue: number): Rect {
  const fromPixel = valueToPixel(xAxis, fromValue);
  const toPixel = valueToPixel(xAxis, toValue);
  const start = Math.min(fromPixel, toPixel);
  // A range of a single value still needs a visible band, hence the minimum of one pixel.
  const size = Math.max(1, Math.abs(toPixel - fromPixel));
  return isXAxisHorizontal(xAxis)
    ? { x: start, y: chart.plotTop, width: size, height: chart.plotHeight }
    : { x: chart.plotLeft, y: start, width: chart.plotWidth, height: size };
}

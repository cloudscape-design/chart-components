// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

// Rectangles are expressed in physical pixels relative to the Highcharts container's top-left corner,
// matching chart.plotLeft / plotTop / toPixels. Highcharts renders its SVG left-to-right regardless of
// page direction, so the overlays are positioned with physical left/top rather than logical properties.
export interface OverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Thickness of the cursor and boundary lines drawn over the plot, matching the chart's own cursor line.
const DIVIDER_THICKNESS = 1;
// Distance between the cursor button cluster and the plot edge it is anchored to.
const CLUSTER_OFFSET = 8;

// In an inverted chart the x axis runs vertically, so every pixel computation swaps the two dimensions
// and Axis.toValue / toPixels operate on chart y coordinates instead of x ones.
export function isXAxisHorizontal(xAxis: Pick<Highcharts.Axis, "horiz">): boolean {
  return xAxis.horiz !== false;
}

// Converts a pointer position over the chart into an x-axis value.
export function pixelToValue(xAxis: Highcharts.Axis, chartX: number, chartY: number): number {
  return xAxis.toValue(isXAxisHorizontal(xAxis) ? chartX : chartY, false);
}

// Converts an x-axis value into a chart-relative pixel along the axis.
export function valueToPixel(xAxis: Highcharts.Axis, value: number): number {
  return xAxis.toPixels(value, false);
}

// True when increasing x values map to increasing pixel coordinates. Derived from the rendered pixels
// rather than from the reversed / inverted options, so it holds for right-to-left pages, consumer-set
// `reversed` axes, and inverted charts alike, including combinations of the three.
export function isPixelForward(xAxis: Highcharts.Axis, values: readonly number[]): boolean {
  if (values.length < 2) {
    return true;
  }
  return valueToPixel(xAxis, values[values.length - 1]) >= valueToPixel(xAxis, values[0]);
}

// A line across the plot at the given x value.
export function getDividerRect(chart: Highcharts.Chart, xAxis: Highcharts.Axis, value: number): OverlayRect {
  const pixel = valueToPixel(xAxis, value);
  return isXAxisHorizontal(xAxis)
    ? {
        left: pixel - DIVIDER_THICKNESS / 2,
        top: chart.plotTop,
        width: DIVIDER_THICKNESS,
        height: chart.plotHeight,
      }
    : {
        left: chart.plotLeft,
        top: pixel - DIVIDER_THICKNESS / 2,
        width: chart.plotWidth,
        height: DIVIDER_THICKNESS,
      };
}

// The band covering the range between two x values, spanning the plot across the other dimension.
export function getBandRect(
  chart: Highcharts.Chart,
  xAxis: Highcharts.Axis,
  fromValue: number,
  toValue: number,
): OverlayRect {
  const fromPixel = valueToPixel(xAxis, fromValue);
  const toPixel = valueToPixel(xAxis, toValue);
  const start = Math.min(fromPixel, toPixel);
  // A range of a single value still needs a visible band, hence the minimum of one pixel.
  const size = Math.max(1, Math.abs(toPixel - fromPixel));
  return isXAxisHorizontal(xAxis)
    ? { left: start, top: chart.plotTop, width: size, height: chart.plotHeight }
    : { left: chart.plotLeft, top: start, width: chart.plotWidth, height: size };
}

// The cursor button cluster, centered on the cursor and pinned to a plot edge: the bottom edge when the
// x axis is horizontal, the inline start edge when it is vertical. It is never shifted along the axis, so
// it stays aligned with a cursor at the first or the last point by extending past the plot edge.
export function getClusterRect(
  chart: Highcharts.Chart,
  xAxis: Highcharts.Axis,
  value: number,
  clusterSize: { width: number; height: number },
): OverlayRect {
  const pixel = valueToPixel(xAxis, value);
  const { width, height } = clusterSize;
  if (isXAxisHorizontal(xAxis)) {
    return {
      left: pixel - width / 2,
      top: chart.plotTop + Math.max(0, chart.plotHeight - height - CLUSTER_OFFSET),
      width,
      height,
    };
  }
  return {
    left: chart.plotLeft + CLUSTER_OFFSET,
    top: pixel - height / 2,
    width,
    height,
  };
}

// True when the given chart coordinates fall inside the plot area.
export function isInsidePlot(chart: Highcharts.Chart, chartX: number, chartY: number): boolean {
  return (
    chartX >= chart.plotLeft &&
    chartX <= chart.plotLeft + chart.plotWidth &&
    chartY >= chart.plotTop &&
    chartY <= chart.plotTop + chart.plotHeight
  );
}

// Writes a rectangle onto an overlay element and makes it visible. Applied imperatively: the cursor and
// the drag preview move with every pointer event, and re-rendering the chart component for each of those
// would re-initialize the Highcharts axes.
//
// Visibility is used rather than display so the elements keep their layout box while hidden: the cursor
// button cluster is a flex container whose own display must survive, and its size has to be measurable
// before it is first shown. Hidden elements are neither focusable nor exposed to assistive technology,
// and do not receive pointer events.
export function applyRect(element: null | HTMLElement, rect: null | OverlayRect) {
  if (!element) {
    return;
  }
  if (!rect) {
    element.style.visibility = "hidden";
    return;
  }
  element.style.visibility = "visible";
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

// Positions an element without constraining its size, used for the cursor button cluster: its size comes
// from its contents, and writing the measured size back onto it would freeze that measurement.
export function applyPosition(element: null | HTMLElement, rect: null | OverlayRect) {
  if (!element) {
    return;
  }
  if (!rect) {
    element.style.visibility = "hidden";
    return;
  }
  element.style.visibility = "visible";
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
}

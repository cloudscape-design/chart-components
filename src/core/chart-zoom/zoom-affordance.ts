// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorBackgroundItemSelected, colorBorderItemSelected } from "@cloudscape-design/design-tokens";

// The persistent affordance marking the range the chart is zoomed to: a boundary line at each end of the range
// plus a subtle tint between them, so a zoomed chart reads as zoomed even when the zoom controls are out of
// sight. It is declared as axis options rather than drawn with Axis.addPlotBand, because Highcharts
// re-initializes the axes on every React re-render and discards anything added imperatively.
//
// The ids share a prefix so the affordance can be told apart from the consumer's own plot lines, which the
// highlight logic dims by id (see isZoomAffordanceId).
const ZOOM_AFFORDANCE_ID_PREFIX = "awsui-zoom-range";
const ZOOM_RANGE_BAND_ID = ZOOM_AFFORDANCE_ID_PREFIX;
const ZOOM_RANGE_START_LINE_ID = `${ZOOM_AFFORDANCE_ID_PREFIX}-start`;
const ZOOM_RANGE_END_LINE_ID = `${ZOOM_AFFORDANCE_ID_PREFIX}-end`;

// The band sits below the plot content, so the tint goes under the series instead of washing them out, and the
// boundary lines above it, matching the z index of the cartesian thresholds' plot lines.
const BAND_Z_INDEX = 0;
const LINE_Z_INDEX = 3;
// Matches the thickness of the zoom cursor and the selection dividers, see DIVIDER_THICKNESS.
const LINE_WIDTH = 1;

// True for the ids of the zoom affordance's own band and lines. Used to leave them out of the by-id plot line
// handling that applies to the lines a consumer declared: the affordance marks the zoomed range rather than a
// series, so it must not dim when a series is highlighted.
export function isZoomAffordanceId(id: string): boolean {
  return id.startsWith(ZOOM_AFFORDANCE_ID_PREFIX);
}

// The axis bands and lines to render while the chart is zoomed to `extremes`, or just the ones the consumer
// declared when it is not: the affordance is appended to those, rather than replacing them, so that for example
// the cartesian thresholds survive.
//
// Both collections are always returned, even when there is nothing to add to them. Axis.update merges the new
// options over the ones the axis already has, and a collection left out of them keeps its previous value, so
// omitting `plotBands` while not zoomed would leave the band of the range just reset behind.
export function getZoomAffordanceOptions(
  xAxisOptions: Highcharts.XAxisOptions,
  extremes: null | { min: number; max: number },
): Pick<Highcharts.XAxisOptions, "plotBands" | "plotLines"> {
  const plotBands = [...(xAxisOptions.plotBands ?? [])];
  const plotLines = [...(xAxisOptions.plotLines ?? [])];
  if (!extremes) {
    return { plotBands, plotLines };
  }
  return {
    plotBands: [
      ...plotBands,
      {
        id: ZOOM_RANGE_BAND_ID,
        from: extremes.min,
        to: extremes.max,
        color: colorBackgroundItemSelected,
        zIndex: BAND_Z_INDEX,
      },
    ],
    plotLines: [
      ...plotLines,
      ...[
        { id: ZOOM_RANGE_START_LINE_ID, value: extremes.min },
        { id: ZOOM_RANGE_END_LINE_ID, value: extremes.max },
      ].map(({ id, value }) => ({
        id,
        value,
        color: colorBorderItemSelected,
        width: LINE_WIDTH,
        zIndex: LINE_Z_INDEX,
      })),
    ],
  };
}

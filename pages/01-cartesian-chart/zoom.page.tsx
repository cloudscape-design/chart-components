// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import { range } from "lodash";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// A fixed start date keeps the rendered chart, and the visual regression snapshots, stable.
const seriesStart = new Date("2025-01-01T00:00:00Z");

const zoomSeriesData = range(0, 100).map((i) => ({
  x: addDays(seriesStart, i).getTime(),
  y: Math.floor((pseudoRandom() + i / 50) * 100),
}));

const zoomSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "area", name: "Requests", data: zoomSeriesData },
  {
    type: "spline",
    name: "Avg latency",
    data: zoomSeriesData.map((d) => ({ x: d.x, y: d.y * 0.6 + Math.floor(pseudoRandom() * 20) })),
  },
  { type: "y-threshold", name: "SLA limit", value: 150 },
];

export default function () {
  return (
    <Page title="Zoom" subtitle="This page demonstrates zooming into a range of the x-axis.">
      <PageSection
        title="Uncontrolled zoom"
        docs={{
          behavior: {
            bullets: [
              "Drag across the plot to zoom into a range.",
              `Or use the "Zoom" button to enter zoom mode, where a vertical cursor follows the pointer and the
              Left/Right arrow keys. A click, Enter, or Space sets the start of the range, and a second one sets the
              end, applying the zoom. This is a single-pointer, no-modifier interaction, satisfying WCAG 2.5.7
              (Dragging movements).`,
              `In zoom mode the tooltip is suppressed, and buttons next to the cursor offer a pointer alternative to
              the arrow keys. Escape or "Exit zoom" cancels the selection.`,
              `While zoomed, a boundary line at each edge and a band tint between them mark the active range. The
              "Zoom" button stays available next to "Reset", so a narrower range can be selected without resetting
              first.`,
              "The cursor position and the selected range are announced to screen readers as they change.",
            ],
          },
        }}
      >
        <UncontrolledZoom />
      </PageSection>

      <PageSection
        title="Controlled zoom"
        docs={{
          behavior: {
            bullets: [
              `The zoomed range is owned by the page: the chart reports the ranges selected in it, and only zooms when
              the zoomRange property changes. Selecting a range by dragging therefore does nothing until the page
              applies it.`,
              `The built-in buttons are hidden with zoom.hideButtons, and zoom mode is entered with the component's
              ref instead.`,
            ],
          },
        }}
      >
        <ControlledZoom />
      </PageSection>
    </Page>
  );
}

function UncontrolledZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={400}
      zoom={{ enabled: true }}
      series={zoomSeries}
      xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
      yAxis={{ title: "Count", type: "linear" }}
    />
  );
}

function ControlledZoom() {
  const { chartProps } = useChartSettings();
  const ref = useRef<CartesianChartProps.Ref>(null);
  const [zoomRange, setZoomRange] = useState<CartesianChartProps.ZoomRange | null>(null);
  const [lastReported, setLastReported] = useState<null | CartesianChartProps.ZoomRange>(null);
  const middleRange = { x: { startValue: zoomSeriesData[20].x, endValue: zoomSeriesData[60].x } };
  const formatRange = (range: null | CartesianChartProps.ZoomRange) =>
    range?.x ? `${dateFormatter(range.x.startValue)} — ${dateFormatter(range.x.endValue)}` : "full range";
  return (
    <SpaceBetween size="s">
      <SpaceBetween size="xs" direction="horizontal">
        <Button onClick={() => ref.current?.enterZoomMode()}>Enter zoom mode</Button>
        <Button onClick={() => setZoomRange(middleRange)}>Zoom to {formatRange(middleRange)}</Button>
        <Button onClick={() => setZoomRange(null)} disabled={!zoomRange}>
          Reset zoom
        </Button>
      </SpaceBetween>

      <Box variant="small">
        Applied: {formatRange(zoomRange)}. Last reported by the chart: {formatRange(lastReported)}.
      </Box>

      <CartesianChart
        {...chartProps.cartesian}
        ref={ref}
        chartHeight={400}
        zoom={{ enabled: true, hideButtons: true }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setLastReported(detail.zoomRange)}
        series={zoomSeries}
        xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
        yAxis={{ title: "Count", type: "linear" }}
      />
    </SpaceBetween>
  );
}

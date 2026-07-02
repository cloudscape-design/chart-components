// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { range } from "lodash";

import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subYears = (date: Date, years: number) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
};

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

export default function () {
  return (
    <Page
      title="Axes and thresholds"
      subtitle="This pages demonstrates different axes types, tick formatters, and thresholds."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        <PageSection title="Linear X, linear Y">
          <LinearLinear />
        </PageSection>
        <PageSection title="Linear X, log Y">
          <LinearLog />
        </PageSection>
        <PageSection title="Log X, linear Y">
          <LogLinear />
        </PageSection>
        <PageSection title="Log X, log Y">
          <LogLog />
        </PageSection>
        <PageSection title="Categorical X, linear Y">
          <CategoryLinear />
        </PageSection>
        <PageSection title="Linear X, categorical Y">
          <LinearCategory />
        </PageSection>
        <PageSection title="Categorical X, categorical Y">
          <CategoryCategory />
        </PageSection>
        <PageSection title="Datetime X, linear Y">
          <DatetimeLinear />
        </PageSection>
        <PageSection title="Linear X, datetime Y">
          <LinearDatetime />
        </PageSection>
        <PageSection title="Datetime X, datetime Y">
          <DatetimeDatetime />
        </PageSection>
        <PageSection title="Log X, categorical Y">
          <LogCategory />
        </PageSection>
        <PageSection title="Categorical X, log Y">
          <CategoryLog />
        </PageSection>
        <PageSection title="Datetime X, log Y">
          <DatetimeLog />
        </PageSection>
        <PageSection title="Log X, datetime Y">
          <LogDatetime />
        </PageSection>
        <PageSection title="Categorical X, datetime Y">
          <DatetimeCategory />
        </PageSection>
        <PageSection title="Datetime X, categorical Y">
          <CategoryDatetime />
        </PageSection>
      </div>
      <PageSection title="Datetime X, linear Y — Zoom (uncontrolled)">
        <DatetimeLinearWithZoom />
      </PageSection>
      <PageSection title="Datetime X, linear Y — Zoom (controlled)">
        <DatetimeLinearWithControlledZoom />
      </PageSection>
    </Page>
  );
}

const defaultSettings = {
  height: 400,
  legend: { enabled: false },
};

function LinearLinear() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 50) })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 250,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 75,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 500,
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 150,
      }}
    />
  );
}

function LinearLog() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * 10, y: i * i })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 100,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 500,
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function LogLinear() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * i, y: i * 20 })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 500,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 1000,
      }}
    />
  );
}

function LogLog() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * i, y: Math.pow(2, i / 2) })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 5000,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function CategoryLinear() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "column",
          name: "Demo",
          data: range(0, 10).map((i) => Math.floor((pseudoRandom() + i / 25) * 50)),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 4,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 50,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "category",
        categories: range(0, 10).map((i) => "ABCDEFGHIJ"[i]),
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 100,
      }}
    />
  );
}

function LinearCategory() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * 2, y: Math.floor(pseudoRandom() * 10) })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 50,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 4,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 100,
      }}
      yAxis={{
        title: "Y values",
        type: "category",
        categories: range(0, 10).map((i) => "ABCDEFGHIJ"[i]),
      }}
    />
  );
}

function CategoryCategory() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        ...range(0, 5).map((seriesIndex) => ({
          type: "scatter" as const,
          name: `Demo ${seriesIndex + 1}`,
          data: range(0, 15).map((i) => ({ x: i, y: Math.floor(pseudoRandom() * 15) })),
        })),
        {
          type: "x-threshold",
          name: "X threshold",
          value: 8,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 8,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        categories: range(0, 15).map((i) => "ABCDEFGHIJKLMNO"[i]),
      }}
      yAxis={{
        title: "Y values",
        type: "category",
        categories: range(0, 15).map((i) => "ABCDEFGHIJKLMNO"[i]),
      }}
    />
  );
}

function DatetimeLinear() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({
            x: addDays(new Date(), i).getTime(),
            y: Math.floor((pseudoRandom() + i / 25) * 50),
          })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 25).getTime(),
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 75,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 150,
      }}
    />
  );
}

function LinearDatetime() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => ({
            x: Math.floor((pseudoRandom() + i / 25) * 50),
            y: addDays(new Date(), i).getTime(),
          })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 75,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 25).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 150,
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

function DatetimeDatetime() {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 10)
            .filter((i) => i % 2)
            .flatMap((x) =>
              range(0, 10)
                .filter((i) => !(i % 2))
                .map((y) => ({
                  x: addDays(new Date(), x).getTime(),
                  y: subYears(addDays(new Date(), y), 1).getTime(),
                })),
            ),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 5).getTime(),
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: subYears(addDays(new Date(), 5), 1).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
        valueFormatter: dateFormatter,
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
        valueFormatter: dateFormatter,
      }}
    />
  );
}

function LogCategory() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({ x: i * 5, y: (i - i * 0.2) % 5 })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 3,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        categories: ["A", "B", "C", "D", "E"],
      }}
    />
  );
}

function CategoryLog() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "column",
          name: "Demo",
          data: range(0, 5).map((i) => ({ x: i, y: 13 + i * 2 * (i + i) })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 3,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 50,
        },
      ]}
      xAxis={{
        title: "X values",
        categories: ["A", "B", "C", "D", "E"],
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function DatetimeLog() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => ({
            x: addDays(new Date(), i).getTime(),
            y: Math.floor((pseudoRandom() + i / 25) * 50),
          })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 25).getTime(),
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 45,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function LogDatetime() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => ({
            x: Math.floor((pseudoRandom() + i / 25) * 50),
            y: addDays(new Date(), i).getTime(),
          })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 45,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 25).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

function DatetimeCategory() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "line",
          name: "Demo",
          data: range(0, 10).map((i) => ({ x: addDays(new Date(), i).getTime(), y: Math.abs(i - 5) })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 5).getTime(),
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: 3,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        categories: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      }}
    />
  );
}

function CategoryDatetime() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 10).map((i) => ({ x: Math.abs(i - 5), y: addDays(new Date(), i).getTime() })),
        },
        {
          type: "x-threshold",
          name: "X threshold",
          value: 3,
        },
        {
          type: "y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 5).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        categories: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

const zoomSeriesData = range(0, 100).map((i) => ({
  x: addDays(new Date(), i).getTime(),
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

// Uncontrolled zoom: two accessible interaction methods are available out of the box —
// (1) drag-to-zoom with the mouse, and (2) the "Zoom" button that enters a unified zoom mode.
// In zoom mode a vertical cursor is moved with the mouse OR the Left/Right arrow keys (and UAP
// direction buttons for touch); a single click / Enter / Space sets the start point, and a second
// click / Enter / Space sets the end point to zoom — a single-pointer, no-modifier interaction that
// satisfies WCAG 2.5.7 (Dragging Movements). Escape or "Exit zoom" cancels. The cursor position is
// announced to screen readers as it moves. Zoom state is managed internally; a "Reset" button
// appears once zoomed. While zoomed, a persistent affordance marks the active range: a vertical
// boundary line at each edge with a subtle band tint between them.
function DatetimeLinearWithZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={400}
      legend={{ enabled: true }}
      zoom={{ enabled: true }}
      series={zoomSeries}
      xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
      yAxis={{ title: "Count", type: "linear" }}
    />
  );
}

// Controlled zoom: the consumer owns the zoom range via `zoomRange` + `onZoomRangeChange`.
// Here we hide the built-in buttons and drive zoom entirely through custom UI and ref methods.
function DatetimeLinearWithControlledZoom() {
  const { chartProps } = useChartSettings();
  const [zoomRange, setZoomRange] = useState<CartesianChartProps.ZoomRange | null>(null);
  const start = zoomSeriesData[20].x;
  const end = zoomSeriesData[60].x;
  return (
    <SpaceBetween size="s">
      <SpaceBetween size="xs" direction="horizontal">
        <Button onClick={() => setZoomRange({ x: { startValue: start, endValue: end } })}>Zoom to middle range</Button>
        <Button onClick={() => setZoomRange(null)} disabled={!zoomRange}>
          Reset zoom
        </Button>
      </SpaceBetween>
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={400}
        legend={{ enabled: true }}
        zoom={{ enabled: true, hideButtons: true }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
        series={zoomSeries}
        xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
        yAxis={{ title: "Count", type: "linear" }}
      />
    </SpaceBetween>
  );
}

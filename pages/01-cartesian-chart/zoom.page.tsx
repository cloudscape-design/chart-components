// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import { range } from "lodash";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const DAY = 24 * 60 * 60 * 1000;
// A fixed start date keeps the rendered charts, and the visual regression snapshots, stable.
const seriesStart = new Date("2025-01-01T00:00:00Z").getTime();

const dailyData = range(0, 60).map((i) => ({
  x: seriesStart + i * DAY,
  y: Math.floor((pseudoRandom() + i / 30) * 100),
}));

// Pinned to the data range, as on the other cartesian pages, so the plot starts and ends on the data.
const xAxis = {
  title: "Time",
  type: "datetime",
  valueFormatter: dateFormatter,
  min: dailyData[0].x,
  max: dailyData[dailyData.length - 1].x,
} as const;

const yAxis = { title: "Count" } as const;

const categories = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];
const categoryXAxis = { type: "category", title: "Quarter", categories } as const;
const categoryYAxis = { title: "Costs (USD)", valueFormatter: numberFormatter } as const;
const columnData = ["Compute", "Storage", "Network"].map((name, index) => ({
  name,
  data: categories.map(() => Math.floor(1000 + pseudoRandom() * 5000 * (index + 1))),
}));
const columnSeries: CartesianChartProps.SeriesOptions[] = columnData.map(({ name, data }) => ({
  type: "column",
  name,
  data,
}));

const largeSeriesData = range(0, 5000).map((i) => ({
  x: seriesStart + i * 5 * 60 * 1000,
  y: Math.floor((pseudoRandom() + i / 2500) * 100),
}));

const fixedZoomRange: CartesianChartProps.ZoomRange = {
  x: { startValue: dailyData[20].x, endValue: dailyData[40].x },
};

interface ThisPageSettings extends PageSettings {
  hideZoomControls?: boolean;
}

type ZoomChartProps = Partial<CartesianChartProps> &
  Pick<CartesianChartProps, "series" | "ariaLabel"> & { chartRef?: React.Ref<CartesianChartProps.Ref> };

// Every chart on this page has zoom enabled over the same axes, and only declares what makes it different.
function ZoomChart({ chartRef, ...props }: ZoomChartProps) {
  const { settings, chartProps } = useChartSettings<ThisPageSettings>({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      ref={chartRef ?? chartProps.cartesian.ref}
      chartHeight={300}
      zoom={{ enabled: true, hideZoomControls: settings.hideZoomControls }}
      xAxis={xAxis}
      yAxis={yAxis}
      {...props}
    />
  );
}

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  return (
    <Page
      title="Zoom"
      subtitle="Zooming into a range of the x-axis, shown for each supported chart type."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            {
              content: (
                <Checkbox
                  checked={settings.hideZoomControls ?? false}
                  onChange={({ detail }) => setSettings({ hideZoomControls: detail.checked })}
                >
                  Hide zoom controls
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <PageSection
        title="Line chart"
        docs={{
          behavior: {
            bullets: [
              "Drag across the plot to zoom into a range. The range snaps to the data points it covers.",
              `Or select "Zoom" to enter zoom mode. The cursor follows the pointer and the arrow keys, Home and End
              jump to the ends, and Page Up and Page Down move in larger steps. A click, Enter, or Space sets the
              start of the range, and a second one sets the end. Escape or pressing "Zoom" again cancels.`,
              `While zoomed, "Reset" restores the full range, and "Zoom" selects a narrower one.`,
              "The cursor position and the selected range are announced to screen readers.",
            ],
          },
        }}
      >
        <ZoomChart
          data-testid="zoom-chart"
          chartHeight={400}
          ariaLabel="Line chart"
          series={[
            { type: "line", name: "Requests", data: dailyData },
            { type: "y-threshold", name: "SLA limit", value: 150 },
            { type: "x-threshold", name: "Deployment", value: dailyData[30].x },
          ]}
        />
      </PageSection>

      <PageSection title="Area chart" subtitle="Stacked areas.">
        <ZoomChart
          ariaLabel="Area chart"
          stacking="normal"
          series={["us-east-1", "eu-west-1"].map((name, index) => ({
            type: index === 0 ? "area" : "areaspline",
            name,
            data: dailyData.map(({ x, y }) => ({ x, y: Math.floor(y * (index + 1) * 0.6) })),
          }))}
        />
      </PageSection>

      <PageSection title="Spline chart">
        <ZoomChart ariaLabel="Spline chart" series={[{ type: "spline", name: "Avg latency", data: dailyData }]} />
      </PageSection>

      <PageSection title="Scatter chart">
        <ZoomChart
          ariaLabel="Scatter chart"
          series={[
            {
              type: "scatter",
              name: "Errors",
              data: dailyData.map(({ x, y }) => ({ x, y: y + Math.floor(pseudoRandom() * 40) })),
            },
          ]}
        />
      </PageSection>

      <PageSection title="Bubble chart">
        <ZoomChart
          ariaLabel="Bubble chart"
          sizeAxis={[{ id: "impact", title: "Impact" }]}
          series={[
            {
              type: "bubble",
              name: "Incidents",
              sizeAxis: "impact",
              data: dailyData.filter((_, i) => i % 3 === 0).map(({ x, y }) => ({ x, y, size: (y % 7) + 1 })),
            },
          ]}
        />
      </PageSection>

      <PageSection title="Column chart" subtitle="Grouped and stacked columns over a category axis.">
        <SpaceBetween size="l">
          <ZoomChart
            ariaLabel="Grouped column chart"
            series={columnSeries}
            xAxis={categoryXAxis}
            yAxis={categoryYAxis}
          />
          <ZoomChart
            ariaLabel="Stacked column chart"
            stacking="normal"
            series={columnSeries}
            xAxis={categoryXAxis}
            yAxis={categoryYAxis}
          />
        </SpaceBetween>
      </PageSection>

      <PageSection title="Bar chart" subtitle="Inverted columns: the x-axis runs vertically, and so does the cursor.">
        <ZoomChart
          ariaLabel="Bar chart"
          inverted={true}
          chartHeight={400}
          series={columnSeries}
          xAxis={categoryXAxis}
          yAxis={categoryYAxis}
        />
      </PageSection>

      <PageSection title="Error bars" subtitle="Error bars on a line, and on columns.">
        <SpaceBetween size="l">
          <ZoomChart
            ariaLabel="Line chart with error bars"
            series={[
              { type: "line", id: "requests", name: "Requests", data: dailyData.slice(0, 20) },
              {
                type: "errorbar",
                name: "Requests error",
                linkedTo: "requests",
                data: dailyData.slice(0, 20).map(({ x, y }) => ({ x, low: y * 0.8, high: y * 1.2 })),
              },
            ]}
            xAxis={{ ...xAxis, max: dailyData[19].x }}
          />
          <ZoomChart
            ariaLabel="Column chart with error bars"
            series={[
              { type: "column", id: "compute", name: columnData[0].name, data: columnData[0].data },
              {
                type: "errorbar",
                name: "Compute error",
                linkedTo: "compute",
                data: columnData[0].data.map((y) => ({ low: y * 0.9, high: y * 1.1 })),
              },
            ]}
            xAxis={categoryXAxis}
            yAxis={categoryYAxis}
          />
        </SpaceBetween>
      </PageSection>

      <PageSection title="Dual axis">
        <ZoomChart
          ariaLabel="Dual-axis chart"
          series={[
            { type: "line", name: "Requests", yAxis: "count", data: dailyData },
            {
              type: "line",
              name: "Error rate",
              yAxis: "percentage",
              dashStyle: "Dash",
              data: dailyData.map(({ x, y }) => ({ x, y: y / 20 })),
            },
          ]}
          yAxis={[
            { id: "count", title: "Count" },
            { id: "percentage", title: "Error rate (%)" },
          ]}
        />
      </PageSection>

      <PageSection
        title="Large series"
        subtitle="5,000 points. Page Up, Page Down, Home, and End move the cursor in large steps."
      >
        <ZoomChart
          ariaLabel="Chart with a large series"
          series={[{ type: "line", name: "Requests", data: largeSeriesData }]}
          xAxis={{ ...xAxis, min: largeSeriesData[0].x, max: largeSeriesData[largeSeriesData.length - 1].x }}
        />
      </PageSection>

      <PageSection
        title="Custom controls and a controlled range"
        subtitle={`The built-in buttons are hidden with "hideZoomControls", and the buttons below use the chart's ref.`}
      >
        <ControlledZoom />
      </PageSection>
    </Page>
  );
}

function ControlledZoom() {
  const chartRef = useRef<CartesianChartProps.Ref>(null);
  // Starts zoomed, so that the visual regression tests cover the zoomed range.
  const [zoomRange, setZoomRange] = useState<null | CartesianChartProps.ZoomRange>(fixedZoomRange);
  return (
    <SpaceBetween size="s">
      <ZoomChart
        chartRef={chartRef}
        zoom={{ enabled: true, hideZoomControls: true }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
        ariaLabel="Chart with custom zoom controls"
        series={[{ type: "line", name: "Requests", data: dailyData }]}
      />

      <SpaceBetween size="xs" direction="horizontal">
        <Button onClick={() => chartRef.current?.enterZoomMode()}>Enter zoom mode</Button>
        <Button onClick={() => chartRef.current?.exitZoomMode()}>Exit zoom mode</Button>
        <Button onClick={() => chartRef.current?.resetZoom()}>Reset zoom</Button>
        <Button onClick={() => setZoomRange(fixedZoomRange)}>Show a fixed range</Button>
      </SpaceBetween>

      <Box color="text-body-secondary">
        {zoomRange?.x
          ? `Zoomed from ${dateFormatter(zoomRange.x.startValue)} to ${dateFormatter(zoomRange.x.endValue)}`
          : "Showing the full data range"}
      </Box>
    </SpaceBetween>
  );
}

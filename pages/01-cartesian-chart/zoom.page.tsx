// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentType, useState } from "react";
import { range } from "lodash";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { InternalZoomProps, ZoomRange } from "../../lib/components/core/chart-zoom/interfaces";
import { CoreChartProps } from "../../lib/components/core/interfaces";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const ZoomCartesianChart = CartesianChart as ComponentType<CartesianChartProps & InternalZoomProps>;
const ZoomCoreChart = CoreChart as ComponentType<CoreChartProps & InternalZoomProps>;

const DAY = 24 * 60 * 60 * 1000;
const seriesStart = new Date("2025-01-01T00:00:00Z").getTime();

const dailyData = range(0, 60).map((i) => ({
  x: seriesStart + i * DAY,
  y: Math.floor((pseudoRandom() + i / 30) * 100),
}));

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

const dateRange: ZoomRange = { x: { startValue: dailyData[20].x, endValue: dailyData[40].x } };
const categoryRange: ZoomRange = { x: { startValue: 2, endValue: 5 } };

function describeRange(zoomRange: null | ZoomRange, format: (value: number) => string) {
  return zoomRange?.x
    ? `Zoomed from ${format(zoomRange.x.startValue)} to ${format(zoomRange.x.endValue)}`
    : "Showing the full data range";
}

type ZoomChartProps = Partial<CartesianChartProps> &
  Pick<CartesianChartProps, "series" | "ariaLabel"> & {
    presetRange?: ZoomRange;
    hideButtons?: boolean;
    format?: (value: number) => string;
  };

function ZoomChart({ presetRange = dateRange, hideButtons, format = dateFormatter, ...props }: ZoomChartProps) {
  const { chartProps } = useChartSettings({ more: true });
  const [zoomRange, setZoomRange] = useState<null | ZoomRange>(null);
  return (
    <SpaceBetween size="s">
      <ZoomCartesianChart
        {...chartProps.cartesian}
        chartHeight={300}
        xAxis={xAxis}
        yAxis={yAxis}
        {...props}
        zoom={{ enabled: true, hideButtons }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
      />
      <SpaceBetween size="xs" direction="horizontal" alignItems="center">
        <Button onClick={() => setZoomRange(presetRange)}>Apply range</Button>
        <Button onClick={() => setZoomRange(null)}>Clear range</Button>
        <Box color="text-body-secondary">{describeRange(zoomRange, format)}</Box>
      </SpaceBetween>
    </SpaceBetween>
  );
}

const formatCategory = (value: number) => categories[value];

export default function () {
  return (
    <Page title="Zoom range" subtitle="A zoomed x-axis range, applied with the buttons below each chart.">
      <PageSection
        title="Line chart"
        docs={{
          behavior: {
            bullets: [
              `"Apply range" zooms the chart to a fixed range, which is marked with a band and a boundary line at each end.`,
              `While zoomed, the chart shows a "Reset" button. It asks the page to show the full range, and focus moves to the chart.`,
              `"Clear range" shows the full range from outside the chart.`,
            ],
          },
        }}
      >
        <ZoomChart
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

      <PageSection title="Column chart" subtitle="Grouped columns over a category axis.">
        <ZoomChart
          ariaLabel="Grouped column chart"
          series={columnSeries}
          xAxis={categoryXAxis}
          yAxis={categoryYAxis}
          presetRange={categoryRange}
          format={formatCategory}
        />
      </PageSection>

      <PageSection title="Bar chart" subtitle="Inverted columns: the x-axis runs vertically.">
        <ZoomChart
          ariaLabel="Bar chart"
          inverted={true}
          chartHeight={400}
          series={columnSeries}
          xAxis={categoryXAxis}
          yAxis={categoryYAxis}
          presetRange={categoryRange}
          format={formatCategory}
        />
      </PageSection>

      <PageSection
        title="Error bars"
        subtitle="On a line the zoomed plot ends on the range, on columns the bars keep their padding."
      >
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
            presetRange={{ x: { startValue: dailyData[5].x, endValue: dailyData[14].x } }}
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
            presetRange={categoryRange}
            format={formatCategory}
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

      <PageSection title="Hidden buttons" subtitle={`With "hideButtons" the chart shows no Reset button.`}>
        <ZoomChart
          ariaLabel="Chart without zoom buttons"
          hideButtons={true}
          series={[{ type: "line", name: "Requests", data: dailyData }]}
        />
      </PageSection>

      <PageSection title="Core chart">
        <CoreChartZoom />
      </PageSection>
    </Page>
  );
}

function CoreChartZoom() {
  const { chartProps } = useChartSettings();
  const [zoomRange, setZoomRange] = useState<null | ZoomRange>(null);
  return (
    <SpaceBetween size="s">
      <ZoomCoreChart
        {...chartProps.core}
        chartHeight={300}
        zoom={{ enabled: true }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
        options={{
          lang: { accessibility: { chartContainerLabel: "Core chart with zoom" } },
          series: [{ type: "line", name: "Requests", data: dailyData }],
          xAxis: [{ type: "datetime", title: { text: "Time" }, valueFormatter: dateFormatter }],
          yAxis: [{ title: { text: "Count" } }],
        }}
      />
      <SpaceBetween size="xs" direction="horizontal" alignItems="center">
        <Button onClick={() => setZoomRange(dateRange)}>Apply range</Button>
        <Button onClick={() => setZoomRange(null)}>Clear range</Button>
        <Box color="text-body-secondary">{describeRange(zoomRange, dateFormatter)}</Box>
      </SpaceBetween>
    </SpaceBetween>
  );
}

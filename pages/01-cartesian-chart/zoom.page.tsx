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

interface ThisPageSettings extends PageSettings {
  hideZoomControls?: boolean;
  errorBars?: boolean;
  inverted?: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
const seriesStart = new Date("2025-01-01T00:00:00Z").getTime();
const dailyData = range(0, 30).map((i) => ({
  x: seriesStart + i * DAY,
  y: Math.floor((pseudoRandom() + i / 15) * 100),
}));
const initialRange: CartesianChartProps.ZoomRange = { x: { startValue: dailyData[10].x, endValue: dailyData[20].x } };

const categories = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];
const costsData = categories.map(() => Math.floor(1000 + pseudoRandom() * 5000));
const formatCategory = (value: number) => categories[value];

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const errorBars = settings.errorBars ?? false;
  return (
    <Page
      title="Zoom"
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
            {
              content: (
                <Checkbox checked={errorBars} onChange={({ detail }) => setSettings({ errorBars: detail.checked })}>
                  Error bars
                </Checkbox>
              ),
            },
            {
              content: (
                <Checkbox
                  checked={settings.inverted ?? false}
                  onChange={({ detail }) => setSettings({ inverted: detail.checked })}
                >
                  Invert chart
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <SpaceBetween size="xl">
        <PageSection title="Line chart, controlled range">
          <ZoomChart
            ariaLabel="Line chart"
            controlledRange={initialRange}
            format={dateFormatter}
            xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
            yAxis={{ title: "Count" }}
            series={[
              { type: "line", id: "requests", name: "Requests", data: dailyData },
              ...(errorBars
                ? [
                    {
                      type: "errorbar",
                      name: "Requests error",
                      linkedTo: "requests",
                      data: dailyData.map(({ x, y }) => ({ x, low: y * 0.8, high: y * 1.2 })),
                    } as const,
                  ]
                : []),
              { type: "y-threshold", name: "SLA limit", value: 150 },
            ]}
          />
        </PageSection>
        <PageSection title="Column chart, uncontrolled range">
          <div data-testid="zoom-chart">
            <ZoomChart
              ariaLabel="Column chart"
              format={formatCategory}
              xAxis={{ type: "category", title: "Quarter", categories }}
              yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
              series={[
                { type: "column", id: "costs", name: "Costs", data: costsData },
                ...(errorBars
                  ? [
                      {
                        type: "errorbar",
                        name: "Costs error",
                        linkedTo: "costs",
                        data: costsData.map((y) => ({ low: y * 0.9, high: y * 1.1 })),
                      } as const,
                    ]
                  : []),
              ]}
            />
          </div>
        </PageSection>
      </SpaceBetween>
    </Page>
  );
}

function ZoomChart({
  controlledRange,
  format,
  ...props
}: Pick<CartesianChartProps, "ariaLabel" | "series" | "xAxis" | "yAxis"> & {
  controlledRange?: CartesianChartProps.ZoomRange;
  format: (value: number) => string;
}) {
  const { settings, chartProps } = useChartSettings<ThisPageSettings>({ more: true });
  const chartRef = useRef<CartesianChartProps.Ref>(null);
  const [zoomRange, setZoomRange] = useState<null | CartesianChartProps.ZoomRange>(controlledRange ?? null);
  const [lastRange, setLastRange] = useState<null | CartesianChartProps.ZoomRange>(controlledRange ?? null);
  const shownRange = controlledRange ? zoomRange : lastRange;
  return (
    <SpaceBetween size="s">
      <CartesianChart
        {...chartProps.cartesian}
        {...props}
        ref={chartRef}
        chartHeight={300}
        inverted={settings.inverted}
        zoom={{ enabled: true, hideZoomControls: settings.hideZoomControls }}
        zoomRange={controlledRange ? zoomRange : undefined}
        onZoomRangeChange={({ detail }) => (controlledRange ? setZoomRange : setLastRange)(detail.zoomRange)}
      />
      <SpaceBetween size="xs" direction="horizontal" alignItems="center">
        {settings.hideZoomControls && (
          <>
            <Button onClick={() => chartRef.current?.enterZoomMode()}>Custom zoom</Button>
            <Button onClick={() => chartRef.current?.resetZoom()}>Custom reset</Button>
          </>
        )}
        <Box color="text-body-secondary">
          {shownRange?.x
            ? `Zoomed from ${format(shownRange.x.startValue)} to ${format(shownRange.x.endValue)}`
            : "Showing the full data range"}
        </Box>
      </SpaceBetween>
    </SpaceBetween>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentType, useState } from "react";
import { range } from "lodash";

import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { InternalZoomProps, ZoomRange } from "../../lib/components/core/internal-interfaces";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

interface ThisPageSettings extends PageSettings {
  hideZoomControls?: boolean;
  errorBars?: boolean;
  inverted?: boolean;
}

const ZoomCartesianChart = CartesianChart as ComponentType<CartesianChartProps & InternalZoomProps>;

const DAY = 24 * 60 * 60 * 1000;
const seriesStart = new Date("2025-01-01T00:00:00Z").getTime();
const dailyData = range(0, 30).map((i) => ({
  x: seriesStart + i * DAY,
  y: Math.floor((pseudoRandom() + i / 15) * 100),
}));
const dateRange: ZoomRange = { x: { startValue: dailyData[10].x, endValue: dailyData[20].x } };

const categories = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];
const costsData = categories.map(() => Math.floor(1000 + pseudoRandom() * 5000));

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const hideZoomControls = settings.hideZoomControls ?? false;
  const errorBars = settings.errorBars ?? false;
  const inverted = settings.inverted ?? false;
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
                  checked={hideZoomControls}
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
                <Checkbox checked={inverted} onChange={({ detail }) => setSettings({ inverted: detail.checked })}>
                  Invert chart
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <SpaceBetween size="xl">
        <PageSection title="Line chart">
          <ZoomChart
            ariaLabel="Line chart"
            initialRange={dateRange}
            xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
            yAxis={{ title: "Count" }}
            series={[
              { type: "line", id: "requests", name: "Requests", data: dailyData },
              { type: "y-threshold", name: "SLA limit", value: 150 },
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
            ]}
          />
        </PageSection>
        <PageSection title="Column chart">
          <ZoomChart
            ariaLabel="Column chart"
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
        </PageSection>
        <PageSection title="Uncontrolled line chart">
          <UncontrolledZoomChart />
        </PageSection>
      </SpaceBetween>
    </Page>
  );
}

function ZoomChart({
  initialRange = null,
  ...props
}: Pick<CartesianChartProps, "ariaLabel" | "series" | "xAxis" | "yAxis"> & {
  initialRange?: null | ZoomRange;
}) {
  const { settings, chartProps } = useChartSettings<ThisPageSettings>({ more: true });
  const [zoomRange, setZoomRange] = useState<null | ZoomRange>(initialRange);
  return (
    <ZoomCartesianChart
      {...chartProps.cartesian}
      {...props}
      chartHeight={300}
      inverted={settings.inverted}
      zoom={{ enabled: true, hideZoomControls: settings.hideZoomControls }}
      zoomRange={zoomRange}
      onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
    />
  );
}

function UncontrolledZoomChart() {
  const { settings, chartProps } = useChartSettings<ThisPageSettings>({ more: true });
  return (
    <ZoomCartesianChart
      {...chartProps.cartesian}
      ariaLabel="Uncontrolled line chart"
      chartHeight={300}
      inverted={settings.inverted}
      xAxis={{ title: "Time", type: "datetime", valueFormatter: dateFormatter }}
      yAxis={{ title: "Count" }}
      series={[{ type: "line", name: "Requests", data: dailyData }]}
      zoom={{ enabled: true, hideZoomControls: settings.hideZoomControls }}
    />
  );
}

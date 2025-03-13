// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { usePageSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: PieChartProps.Series = {
  name: "Resource count",
  type: "pie",
  data: [
    {
      name: "Running",
      y: 60,
    },
    {
      name: "Failed",
      y: 30,
    },
    {
      name: "In-progress",
      y: 10,
    },
    {
      name: "Pending",
      y: null,
    },
  ],
};

const lastUpdatesMap = new Map([
  ["Running", "Dec 7, 2020"],
  ["Failed", "Dec 6, 2020"],
  ["In-progress", "Dec 6, 2020"],
  ["Pending", "Dec 7, 2020"],
]);

export function ExamplePieChartPieChart() {
  const { highcharts, settings, chartStateProps } = usePageSettings();
  const hideSeries = settings.applyLoadingState || settings.applyEmptyState || settings.applyErrorState;
  return (
    <PageSection
      title="Pie and donut charts: Pie chart"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/pie-chart?tabId=playground&example=pie-chart">
          compare with the website playground example
        </Link>
      }
    >
      <PieChart
        highcharts={highcharts}
        {...chartStateProps}
        height={379}
        legend={{
          enabled: settings.showLegend,
          title: settings.showLegendTitle ? "Legend title" : undefined,
        }}
        ariaLabel="Pie chart"
        ariaDescription="Pie chart showing how many resources are currently in which state."
        series={hideSeries ? null : series}
        tooltip={{
          body(details) {
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Resource count</Box>
                  <Box variant="span">{details.segmentValue}</Box>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Percentage</Box>
                  <Box variant="span">{`${((details.segmentValue / details.totalValue) * 100).toFixed(0)}%`}</Box>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Last update on</Box>
                  <Box variant="span">{lastUpdatesMap.get(details.segmentName) ?? "???"}</Box>
                </div>
              </div>
            );
          },
        }}
        segment={{
          description: ({ segmentValue, totalValue }) =>
            `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
        }}
      />
    </PageSection>
  );
}

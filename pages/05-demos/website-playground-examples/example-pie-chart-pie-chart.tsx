// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: PieChartProps.SeriesOptions = {
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
  const { chartProps, isEmpty } = useChartSettings();
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
        {...chartProps.pie}
        chartHeight={379}
        ariaLabel="Pie chart"
        ariaDescription="Pie chart showing how many resources are currently in which state."
        series={isEmpty ? null : series}
        tooltip={{
          ...chartProps.pie.tooltip,
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
        segmentDescription={({ segmentValue, totalValue }) =>
          `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`
        }
      />
    </PageSection>
  );
}

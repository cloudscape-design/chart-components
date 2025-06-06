// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
          details({ segmentValue, segmentName, totalValue }) {
            return [
              { key: "Resource count", value: segmentValue },
              { key: "Percentage", value: `${((segmentValue / totalValue) * 100).toFixed(0)}%` },
              { key: "Last update on", value: lastUpdatesMap.get(segmentName) ?? "???" },
            ];
          },
        }}
        segmentDescription={({ segmentValue, totalValue }) =>
          `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`
        }
      />
    </PageSection>
  );
}

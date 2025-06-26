// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: PieChartProps.SeriesOptions = {
  name: "Value",
  type: "donut",
  data: [
    { name: "Item A", y: 40 },
    { name: "Item B", y: 25 },
    { name: "Item C", y: 20 },
    { name: "Item D", y: 10 },
    { name: "Item E", y: 5 },
  ],
};

export function ExamplePieChartDonutChart() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Pie and donut charts: Donut chart"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/pie-chart/?tabId=playground&example=donut-chart">
          compare with the website playground example
        </Link>
      }
    >
      <PieChart
        {...chartProps.pie}
        chartHeight={500}
        ariaLabel="Donut chart"
        ariaDescription="Donut chart showing generic example data."
        series={isEmpty ? null : series}
        tooltip={{
          ...chartProps.pie.tooltip,
          details: ({ segmentValue, totalValue }) => [
            { key: "Value", value: segmentValue },
            { key: "Percentage", value: `${((segmentValue / totalValue) * 100).toFixed(0)}%` },
          ],
        }}
        segmentDescription={({ totalValue, segmentValue }) =>
          `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`
        }
        innerAreaTitle="100"
        innerAreaDescription="total units"
      />
    </PageSection>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: PieChartProps.SeriesOptions = {
  name: "Units",
  type: "donut",
  data: [
    { name: "Complete", y: 160 },
    { name: "Incomplete", y: 40 },
  ],
};

export function ExamplePieChartSmallDonutChart() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Pie and donut charts: Small donut chart"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/pie-chart/?tabId=playground&example=small-donut-chart">
          compare with the website playground example
        </Link>
      }
    >
      <PieChart
        {...chartProps.pie}
        chartHeight={200}
        ariaLabel="Small donut chart"
        ariaDescription="Donut chart showing generic progress."
        series={isEmpty ? null : series}
        tooltip={{
          ...chartProps.pie.tooltip,
          details({ segmentValue, totalValue }) {
            return [
              { key: "Units", value: segmentValue },
              { key: "Percentage", value: `${((segmentValue / totalValue) * 100).toFixed(0)}%` },
            ];
          },
        }}
        innerAreaTitle="80%"
      />
    </PageSection>
  );
}

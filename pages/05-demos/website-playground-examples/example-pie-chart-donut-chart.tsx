// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { usePageSettings } from "../../common/page-settings";
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
  const { chartProps, isEmpty } = usePageSettings();
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
        {...chartProps}
        chartHeight={500}
        ariaLabel="Donut chart"
        ariaDescription="Donut chart showing generic example data."
        series={isEmpty ? null : series}
        tooltip={{
          ...chartProps.tooltip,
          body(details) {
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Value</Box>
                  <Box variant="span">{details.segmentValue}</Box>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Percentage</Box>
                  <Box variant="span">{`${((details.segmentValue / details.totalValue) * 100).toFixed(0)}%`}</Box>
                </div>
              </div>
            );
          },
        }}
        segmentOptions={{
          description: ({ totalValue, segmentValue }) =>
            `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
        }}
        innerValue="100"
        innerDescription="total units"
      />
    </PageSection>
  );
}

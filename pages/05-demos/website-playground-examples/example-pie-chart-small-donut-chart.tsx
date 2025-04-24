// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { PieChart, PieChartProps } from "../../../lib/components";
import { usePageSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: PieChartProps.Series = {
  name: "Units",
  type: "donut",
  data: [
    { name: "Complete", y: 160 },
    { name: "Incomplete", y: 40 },
  ],
};

export function ExamplePieChartSmallDonutChart() {
  const { chartProps, isEmpty } = usePageSettings();
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
        {...chartProps}
        chartHeight={200}
        ariaLabel="Small donut chart"
        ariaDescription="Donut chart showing generic progress."
        series={isEmpty ? null : series}
        tooltip={{
          ...chartProps.tooltip,
          body(details) {
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                  <Box variant="span">Units</Box>
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
        innerValue="80%"
      />
    </PageSection>
  );
}

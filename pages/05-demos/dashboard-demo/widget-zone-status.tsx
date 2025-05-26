// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import { colorChartsStatusHigh, colorChartsStatusPositive } from "@cloudscape-design/design-tokens";

import { PieChart, PieChartProps } from "../../../lib/components";
import { percentageFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

const series: PieChartProps.SeriesOptions = {
  type: "pie",
  name: "Zone status",
  data: [
    { name: "Operating normally", y: 18, color: colorChartsStatusPositive },
    { name: "Disrupted", y: 2, color: colorChartsStatusHigh },
  ],
};

export function ZoneStatusWidget() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PieChart
      {...chartProps.pie}
      fitHeight={true}
      chartMinHeight={200}
      series={isEmpty ? null : series}
      ariaLabel="Zone status chart"
      ariaDescription="Pie chart summarizing the status of all zones."
      segmentOptions={{
        description({ segmentValue, totalValue }) {
          return `${segmentValue} zones, ${percentageFormatter(segmentValue / totalValue)}`;
        },
      }}
      tooltip={{
        ...chartProps.pie.tooltip,
        body(details) {
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                <Box variant="span">Zone count</Box>
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
    />
  );
}

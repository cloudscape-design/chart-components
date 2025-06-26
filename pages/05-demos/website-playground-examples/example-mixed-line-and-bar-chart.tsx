// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { moneyFormatter, numberFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
  },
  {
    name: "Costs last year",
    type: "line",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
  },
  {
    type: "x-threshold",
    name: "Peak cost",
    value: 3,
  },
  {
    type: "y-threshold",
    name: "Budget",
    value: 12000,
  },
];

export function ExampleMixedLineAndBarChart() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Mixed line and bar chart: Mixed bar chart"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/mixed-line-bar-chart?tabId=playground&example=mixed-bar-chart">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={379}
        ariaLabel="Mixed bar chart"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point: ({ item }) => {
            return {
              key: item.series.name,
              value:
                item.y !== null ? (
                  <Link external={true} href="#" ariaLabel={`See details for ${item.series.name} (opens in a new tab)`}>
                    {moneyFormatter(item.y)}
                  </Link>
                ) : null,
            };
          },
        }}
        xAxis={{
          type: "category",
          title: "Budget month",
          categories: ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"],
          min: 0,
          max: 6,
        }}
        yAxis={{
          title: "Costs (USD)",
          min: 0,
          max: 20000,
          valueFormatter: numberFormatter,
        }}
      />
    </PageSection>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

function errorRange(value: number, delta: number) {
  return { low: value - delta, high: value + delta };
}

const series: CartesianChartProps.SeriesOptions[] = [
  {
    id: "c",
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
  },
  {
    id: "c-1",
    name: "Costs last year",
    type: "spline",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
  },
  {
    name: "Costs error",
    type: "errorbar",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876].map((value) => errorRange(value, 250)),
    linkedTo: "c",
  },
  {
    name: "Costs last year error",
    type: "errorbar",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505].map((value) => errorRange(value, 250)),
    linkedTo: "c-1",
  },
];

export default function () {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <Page title="Error bars" subtitle="This pages demonstrates the use of error bars for columns and line series.">
      <PageSection title="Mixed bar chart with error bars">
        <CartesianChart
          {...chartProps.cartesian}
          chartHeight={379}
          ariaLabel="Mixed bar chart"
          series={series}
          tooltip={{
            // TODO: embedded error bars as detail type
            series: ({ item }) => {
              return {
                key: item.series.name,
                value: (
                  <Link external={true} href="#" ariaLabel={`See details for ${item.series.name} (opens in a new tab)`}>
                    {item.y !== null ? moneyFormatter(item.y) : null}
                  </Link>
                ),
                error: item.error.map((error) => ({
                  key: (
                    <Box fontSize="body-s" color="text-body-secondary">
                      {error.series.name}
                    </Box>
                  ),
                  value: (
                    <Box fontSize="body-s" color="text-body-secondary">
                      {moneyFormatter(error.low)} - {moneyFormatter(error.high)}
                    </Box>
                  ),
                })),
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
    </Page>
  );
}

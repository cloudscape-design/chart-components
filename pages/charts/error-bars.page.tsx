// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { usePageSettings } from "../common/page-settings";

function errorRange(value: number, delta: number) {
  return { low: value - delta, high: value + delta };
}

const series: CartesianChartProps.Series[] = [
  {
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
  },
  {
    name: "Costs error",
    type: "errorbar",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876].map((value) => errorRange(value, 250)),
  },
  {
    name: "Costs last year",
    type: "spline",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
  },
  {
    name: "Costs last year error",
    type: "errorbar",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505].map((value) => errorRange(value, 250)),
  },
];

export default function () {
  const { highcharts, chartStateProps, settings } = usePageSettings({ more: true });
  return (
    <Box margin="m">
      <h1>Error bar: Mixed bar chart</h1>
      <Box variant="p">This pages demonstrates the use of error bars for columns and line series.</Box>

      <Box padding={{ vertical: "xl" }}>
        <CartesianChart
          highcharts={highcharts}
          {...chartStateProps}
          height={379}
          ariaLabel="Mixed bar chart"
          series={series}
          tooltip={{
            // TODO: embedded error bars as detail type
            series: (detail) => {
              if (detail.series.type === "errorbar") {
                return {
                  key: detail.series.name,
                  value: "[-$250, +$250]",
                };
              }
              if (detail.type !== "point") {
                return { key: "?", value: "?" };
              }
              return {
                key: detail.series.name,
                value: (
                  <Link
                    external={true}
                    href="#"
                    ariaLabel={`See details for ${moneyFormatter(detail.y)} on ${detail.series.name} (opens in a new tab)`}
                  >
                    {moneyFormatter(detail.y)}
                  </Link>
                ),
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
          emphasizeBaselineAxis={settings.emphasizeBaselineAxis}
        />
      </Box>
    </Box>
  );
}

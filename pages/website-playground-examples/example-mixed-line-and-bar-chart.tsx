// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { usePageSettings } from "../common/page-settings";
import { PageSection } from "../common/templates";

const series: CartesianChartProps.Series[] = [
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
    type: "awsui-x-threshold",
    name: "Peak cost",
    value: 3,
  },
  {
    type: "awsui-y-threshold",
    name: "Budget",
    value: 12000,
  },
];

export function ExampleMixedLineAndBarChart() {
  const { highcharts, settings, chartStateProps } = usePageSettings();
  const hideSeries = settings.applyLoadingState || settings.applyEmptyState || settings.applyErrorState;
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
        highcharts={highcharts}
        {...chartStateProps}
        height={379}
        legend={{
          enabled: settings.showLegend,
          title: settings.showLegendTitle ? "Legend title" : undefined,
        }}
        ariaLabel="Mixed bar chart"
        series={hideSeries ? [] : series}
        tooltip={{
          series: (detail) => {
            switch (detail.type) {
              case "point":
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
              case "threshold":
                return { key: detail.series.name, value: "" };
              default:
                return { key: "?", value: "?" };
            }
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
    </PageSection>
  );
}

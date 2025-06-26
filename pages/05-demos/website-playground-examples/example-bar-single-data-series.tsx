// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter, numberFormatter, priceFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Site 1",
    type: "column",
    data: [34503, 25832, 4012, -5602, 17839],
  },
  {
    type: "y-threshold",
    name: "Average revenue",
    value: 19104,
  },
];

export function ExampleBarChartSingleDataSeries() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Bar chart: Single data series"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/bar-chart?tabId=playground&example=single-data-series">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={423}
        ariaLabel="Single data series bar chart"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point({ item }) {
            return { key: item.series.name, value: item.y !== null ? priceFormatter(item.y) : 0 };
          },
        }}
        xAxis={{
          type: "category",
          title: "Time (UTC)",
          categories: [
            dateFormatter(1601071200000),
            dateFormatter(1601078400000),
            dateFormatter(1601085600000),
            dateFormatter(1601092800000),
            dateFormatter(1601100000000),
          ],
        }}
        yAxis={{
          title: "Revenue (USD)",
          min: -10000,
          max: 40000,
          valueFormatter: numberFormatter,
        }}
      />
    </PageSection>
  );
}

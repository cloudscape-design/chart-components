// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter, numberFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Site 1",
    type: "line",
    data: [
      // The x values are timestamps that can be converted to a date with new Date(timestamp)
      { x: 1600984800000, y: 58020 },
      { x: 1600985700000, y: 102402 },
      { x: 1600986600000, y: 104920 },
      { x: 1600987500000, y: 94031 },
      { x: 1600988400000, y: 125021 },
      { x: 1600989300000, y: 159219 },
      { x: 1600990200000, y: 193082 },
      { x: 1600991100000, y: 162592 },
      { x: 1600992000000, y: 274021 },
      { x: 1600992900000, y: 264286 },
      { x: 1600993800000, y: 289210 },
      { x: 1600994700000, y: 256362 },
      { x: 1600995600000, y: 257306 },
      { x: 1600996500000, y: 186776 },
      { x: 1600997400000, y: 294020 },
      { x: 1600998300000, y: 385975 },
      { x: 1600999200000, y: 486039 },
      { x: 1601000100000, y: 490447 },
      { x: 1601001000000, y: 361845 },
      { x: 1601001900000, y: 339058 },
      { x: 1601002800000, y: 298028 },
      { x: 1601003700000, y: 231902 },
      { x: 1601004600000, y: 224558 },
      { x: 1601005500000, y: 253901 },
      { x: 1601006400000, y: 102839 },
      { x: 1601007300000, y: 234943 },
      { x: 1601008200000, y: 204405 },
      { x: 1601009100000, y: 190391 },
      { x: 1601010000000, y: 183570 },
      { x: 1601010900000, y: 162592 },
      { x: 1601011800000, y: 148910 },
      { x: 1601012700000, y: 229492 },
      { x: 1601013600000, y: 293910 },
    ],
  },
  {
    type: "x-threshold",
    name: "Peak hours",
    value: 1601003400000,
  },
];

export function ExampleLineChartSingleDataSeries() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Line chart: Single data series"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/line-chart/">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={379}
        ariaLabel="Single data series line chart"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point: ({ item }) => {
            return {
              key: (
                <Link external={true} href="#">
                  {item.series.name}
                </Link>
              ),
              value: item.y !== null ? numberFormatter(item.y) : null,
            };
          },
        }}
        xAxis={{
          type: "datetime",
          title: "Time (UTC)",
          min: 1600984800000,
          max: 1601013600000,
          valueFormatter: dateFormatter,
        }}
        yAxis={{
          title: "Bytes transferred",
          min: 0,
          max: 500000,
          valueFormatter: numberFormatter,
        }}
      />
    </PageSection>
  );
}

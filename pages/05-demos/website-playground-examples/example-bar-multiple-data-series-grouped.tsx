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
    type: "column",
    data: [470319, 374991, 430357, 440773, 464442],
  },
  {
    name: "Site 2",
    type: "column",
    data: [452301, 432909, 463349, 470328, 485630],
  },
  {
    name: "Site 3",
    type: "column",
    data: [301030, 352920, 368204, 358290, 210720],
  },
  {
    name: "Site 4",
    type: "column",
    data: [91394, 56012, 156204, 98349, 99249],
  },
  {
    name: "Site 5",
    type: "column",
    data: [102032, 84201, 173002, 103283, 95382],
  },
  {
    name: "Site 6",
    type: "column",
    data: [45029, 99291, 90325, 23940, 59321],
  },
];

export function ExampleBarChartMultipleDataSeriesGrouped() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Bar chart: Multiple data series, grouped"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/bar-chart?tabId=playground&example=multiple-data-series%2C-grouped">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={423}
        ariaLabel="Multiple data series bar chart"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point: ({ item }) => {
            const formattedValue = item.y !== null ? numberFormatter(item.y) : null;
            return {
              key: item.series.name,
              value: (
                <Link
                  external={true}
                  href="#"
                  ariaLabel={`See details for ${formattedValue} on ${item.series.name} (opens in a new tab)`}
                >
                  {formattedValue}
                </Link>
              ),
            };
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
          title: "Bytes transferred",
          min: 0,
          max: 500000,
          valueFormatter: numberFormatter,
        }}
      />
    </PageSection>
  );
}

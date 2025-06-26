// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { percentageFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Desktop",
    type: "column",
    data: [0.32, 0.24],
  },
  {
    name: "Mobile",
    type: "column",
    data: [0.26, 0.45],
  },
  {
    name: "Tablet",
    type: "column",
    data: [0.23, 0.18],
  },
  {
    name: "Embedded",
    type: "column",
    data: [0.13, 0.03],
  },
  {
    name: "Crawler",
    type: "column",
    data: [0.06, 0.1],
  },
];

export function ExampleBarChartMultipleDataSeriesStackedHorizontal() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Bar chart: Multiple data series, stacked, horizontal"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/bar-chart?tabId=playground&example=multiple-data-series%2C-stacked%2C-horizontal">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={423}
        inverted={true}
        ariaLabel="Stacked, horizontal bar chart"
        stacking="normal"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point: ({ item }) => {
            const valueLink = ({ key, value }: { key: string; value: number }) => (
              <Link
                external={true}
                href="#"
                ariaLabel={`See details for ${percentageFormatter(value)} on ${key} (opens in a new tab)`}
              >
                {percentageFormatter(value)}
              </Link>
            );
            return {
              key: item.series.name,
              value: valueLink({
                key: item.series.name ?? "",
                value: item.y ?? 0,
              }),
              expandable: item.series.name === "Desktop" || item.series.name === "Mobile",
              subItems:
                item.series.name === "Desktop"
                  ? [
                      {
                        key: "Chrome",
                        value: valueLink({
                          key: "Desktop Chrome",
                          value: item.x === 0 ? 0.19 : 0.15,
                        }),
                      },
                      {
                        key: "Safari",
                        value: valueLink({
                          key: "Desktop Safari",
                          value: item.x === 0 ? 0.07 : 0.05,
                        }),
                      },
                      {
                        key: "Edge",
                        value: valueLink({
                          key: "Desktop Edge",
                          value: item.x === 0 ? 0.02 : 0.02,
                        }),
                      },
                      {
                        key: "Firefox",
                        value: valueLink({
                          key: "Desktop Firefox",
                          value: item.x === 0 ? 0.02 : 0.02,
                        }),
                      },
                      {
                        key: "Others",
                        value: valueLink({
                          key: "Other desktop browsers",
                          value: item.x === 0 ? 0.02 : 0.02,
                        }),
                      },
                    ]
                  : item.series.name === "Mobile"
                    ? [
                        {
                          key: "Chrome",
                          value: valueLink({
                            key: "Mobile Chrome",
                            value: item.x === 0 ? 0.18 : 0.3,
                          }),
                        },
                        {
                          key: "Safari",
                          value: valueLink({
                            key: "Mobile Safari",
                            value: item.x === 0 ? 0.04 : 0.08,
                          }),
                        },
                        {
                          key: "Others",
                          value: valueLink({
                            key: "Other mobile browsers",
                            value: item.x === 0 ? 0.04 : 0.07,
                          }),
                        },
                      ]
                    : undefined,
            };
          },
          footer: ({ x }) => <Button ariaLabel={`View details for ${x}`}>View details</Button>,
        }}
        xAxis={{
          type: "category",
          title: "Visit type",
          categories: ["Visits", "Bounces"],
        }}
        yAxis={{ title: "", min: 0, max: 1, valueFormatter: percentageFormatter }}
      />
    </PageSection>
  );
}

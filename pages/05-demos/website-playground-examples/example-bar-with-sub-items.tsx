// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { moneyFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Amazon Simple Storage Service",
    type: "column",
    data: [56.03, 65.14, 69.8, 78.45, 84.36, 90.68],
  },
  {
    name: "Amazon Relational Database Service",
    type: "column",
    data: [null, 217.77, 35.9, 36.39, 36.39, 35.96],
  },
  {
    name: "AWS Config",
    type: "column",
    data: [39.02, 41.94, 40.06, 39.6, 48.62, 88.34],
  },
  {
    name: "AWS Key Management Service",
    type: "column",
    data: [39.48, 43.63, 43.25, 45.62, 45.12, 45.93],
  },
  {
    name: "Amazon Elastic Container Service",
    type: "column",
    data: [25.48, 45.06, 41.65, 23.42, 13.52, 64.24],
  },
  {
    name: "Others",
    type: "column",
    data: [27.31, 33.6, 41.08, 37.37, 25.49, 25.28],
  },
];

export function ExampleBarChartWithSubItems() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Bar chart: With sub-items"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/bar-chart/?tabId=playground&example=with-sub-items">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={423}
        ariaLabel="Costs chart"
        stacking="normal"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          point: ({ item }) => {
            return {
              key: item.series.name,
              value: item.y !== null ? moneyFormatter(item.y) : null,
              expandable: item.series.name === "Others",
              subItems:
                item.series.name === "Others"
                  ? [
                      {
                        key: "AWS Lambda",
                        value: moneyFormatter([10.89, 11.25, 10.89, 11.25, 11.25, 10.89][item.x]),
                      },
                      {
                        key: "CodeBuild",
                        value: moneyFormatter([6.42, 9.52, 19.06, 17.92, 7.22, 6.08][item.x]),
                      },
                      {
                        key: "Amazon GuardDuty",
                        value: moneyFormatter([10, 12.83, 11.13, 8.2, 7.02, 8.31][item.x]),
                      },
                    ]
                  : undefined,
            };
          },
          footer: ({ x }) => {
            const total = [131.29, 447.14, 271.74, 260.85, 253.5, 350.43][x as number];
            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Total</span>
                <span>{moneyFormatter(total)}</span>
              </div>
            );
          },
        }}
        xAxis={{
          type: "category",
          title: "Time",
          categories: ["2023-04", "2023-05", "2023-06", "2023-07", "2023-08", "2023-09"],
        }}
        yAxis={{ title: "Costs" }}
      />
    </PageSection>
  );
}

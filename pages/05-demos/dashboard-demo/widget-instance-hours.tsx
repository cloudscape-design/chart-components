// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

const cpuData = [
  { date: new Date(2020, 8, 16), "m1.large": 878, "m1.xlarge": 491, "m1.medium": 284, "m1.small": 70 },
  { date: new Date(2020, 8, 17), "m1.large": 781, "m1.xlarge": 435, "m1.medium": 242, "m1.small": 96 },
  { date: new Date(2020, 8, 18), "m1.large": 788, "m1.xlarge": 478, "m1.medium": 311, "m1.small": 79 },
  { date: new Date(2020, 8, 19), "m1.large": 729, "m1.xlarge": 558, "m1.medium": 298, "m1.small": 97 },
  { date: new Date(2020, 8, 20), "m1.large": 988, "m1.xlarge": 530, "m1.medium": 255, "m1.small": 97 },
  { date: new Date(2020, 8, 21), "m1.large": 1016, "m1.xlarge": 445, "m1.medium": 339, "m1.small": 70 },
  { date: new Date(2020, 8, 22), "m1.large": 987, "m1.xlarge": 549, "m1.medium": 273, "m1.small": 62 },
  { date: new Date(2020, 8, 23), "m1.large": 986, "m1.xlarge": 518, "m1.medium": 341, "m1.small": 67 },
  { date: new Date(2020, 8, 24), "m1.large": 925, "m1.xlarge": 454, "m1.medium": 382, "m1.small": 68 },
  { date: new Date(2020, 8, 25), "m1.large": 742, "m1.xlarge": 538, "m1.medium": 361, "m1.small": 70 },
  { date: new Date(2020, 8, 26), "m1.large": 920, "m1.xlarge": 486, "m1.medium": 262, "m1.small": 91 },
  { date: new Date(2020, 8, 27), "m1.large": 826, "m1.xlarge": 457, "m1.medium": 248, "m1.small": 76 },
  { date: new Date(2020, 8, 28), "m1.large": 698, "m1.xlarge": 534, "m1.medium": 243, "m1.small": 66 },
  { date: new Date(2020, 8, 29), "m1.large": 1003, "m1.xlarge": 523, "m1.medium": 393, "m1.small": 70 },
  { date: new Date(2020, 8, 30), "m1.large": 811, "m1.xlarge": 527, "m1.medium": 353, "m1.small": 88 },
];

const domain = cpuData.map(({ date }) => date.getTime());

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "m1.large",
    type: "column",
    data: cpuData.map((datum) => datum["m1.large"]),
  },
  {
    name: "m1.xlarge",
    type: "column",
    data: cpuData.map((datum) => datum["m1.xlarge"]),
  },
  {
    name: "m1.medium",
    type: "column",
    data: cpuData.map((datum) => datum["m1.medium"]),
  },
  {
    name: "m1.small",
    type: "column",
    data: cpuData.map((datum) => datum["m1.small"]),
  },
];

export function WidgetInstanceHours() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      ariaLabel="Instance hours"
      ariaDescription="Bar chart showing total instance hours per instance type over the last 15 days."
      fitHeight={true}
      chartMinHeight={200}
      series={isEmpty ? [] : series}
      stacking="normal"
      xAxis={{
        title: "Date",
        type: "category",
        categories: domain.map(dateFormatter),
        valueFormatter: dateFormatter,
      }}
      yAxis={{ title: "Total instance hours", min: 0, max: 2000 }}
      tooltip={{
        ...chartProps.cartesian.tooltip,
        point({ item }) {
          return {
            key: item.series.name,
            value: (
              <Link
                external={true}
                href="#"
                ariaLabel={`See details for ${item.y} hours on ${item.series.name} (opens in a new tab)`}
              >
                {item.y}
              </Link>
            ),
          };
        },
      }}
    />
  );
}

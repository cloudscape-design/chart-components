// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter, moneyFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

// Note: in Highcharts, the scale can be configured explicitly with zMin/zMax on the bubble series, which is not currently exposed in the API.
const timeScale = 10;
const costScale = 1000;

const baseline = [
  { x: 1600984800000, y: 5802, timeToFix: 50 / timeScale, costImpact: 0 },
  { x: 1600985700000, y: 10240, timeToFix: 234 / timeScale, costImpact: 30_000 / costScale },
  { x: 1600986600000, y: 10492, timeToFix: 553 / timeScale, costImpact: 50_000 / costScale },
  { x: 1600987500000, y: 9403, timeToFix: 33 / timeScale, costImpact: 0 },
  { x: 1600988400000, y: 12502, timeToFix: 44 / timeScale, costImpact: 100_000 / costScale },
  { x: 1600989300000, y: 15921, timeToFix: 22 / timeScale, costImpact: 10_000 / costScale },
  { x: 1600990200000, y: 19308, timeToFix: 111 / timeScale, costImpact: 20_000 / costScale },
  { x: 1600991100000, y: 16259, timeToFix: 343 / timeScale, costImpact: 20_000 / costScale },
  { x: 1600992000000, y: 27402, timeToFix: 11 / timeScale, costImpact: 0 },
  { x: 1600992900000, y: 2628, timeToFix: 3 / timeScale, costImpact: 80_000 / costScale },
];

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Time to fix",
    sizeAxis: "time-axis",
    type: "bubble",
    data: baseline.map(({ x, y, timeToFix: size }) => ({ x, y, size })),
  },
  {
    name: "Cost impact",
    sizeAxis: "cost-axis",
    type: "bubble",
    data: baseline.map(({ x, y, costImpact: size }) => ({ x, y, size })),
  },
];

export default function () {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <Page title="Bubble chart">
      <CartesianChart
        {...chartProps.cartesian}
        series={series}
        xAxis={{ title: "Time (UTC)", type: "datetime", valueFormatter: dateFormatter }}
        yAxis={{ title: "Events" }}
        sizeAxis={[
          { id: "time-axis", title: "Time to fix", valueFormatter: (value) => `${value! * timeScale} minutes` },
          { id: "cost-axis", title: "Cost impact", valueFormatter: (value) => moneyFormatter(value! * costScale) },
        ]}
        chartHeight={400}
      />
    </Page>
  );
}

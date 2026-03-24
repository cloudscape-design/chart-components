// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const baseline = [
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
];

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Series A",
    type: "bubble",
    data: baseline.map(({ x, y }) => ({ x, y, z: randomInt(100, 300) })),
  },
  {
    name: "Series B",
    type: "bubble",
    data: baseline.map(({ x, y }) => ({
      x: x + (Math.random() > 0.2 ? randomInt(-5000000, 5000000) : 0),
      y: y + randomInt(-50000, 50000),
      z: randomInt(50, 400),
    })),
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
        zAxis={{ title: "Average size", valueFormatter: (value) => `${value}kB` }}
        chartHeight={400}
      />
    </Page>
  );
}

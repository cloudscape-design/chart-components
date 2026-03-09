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
  { x: 1601003400000, y: 255555 },
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
];

const primarySeries: CartesianChartProps.SeriesOptions[] = Array.from({ length: 3 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return {
    type: "line" as const,
    name: `Events ${letter}`,
    yAxis: 0,
    data: baseline.map(({ x, y }) => ({
      x,
      y: y + randomInt(-100000 * ((i % 3) + 1), 100000 * ((i % 3) + 1)),
    })),
  };
});

const secondarySeries: CartesianChartProps.SeriesOptions[] = Array.from({ length: 3 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return {
    type: "line" as const,
    name: `Percentage ${letter}`,
    yAxis: 1,
    dashStyle: "Dash" as const,
    data: baseline.map(({ x, y }) => ({
      x,
      y: (y / 10000) * randomInt(3 + (i % 5), 10 + (i % 10)),
    })),
  };
});

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page
      title="Cartesian dual-axis chart"
      subtitle="This page demonstrates the CartesianChart component with two Y axes for displaying data with different scales."
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={400}
        series={[...primarySeries, ...secondarySeries]}
        xAxis={{
          title: "Time (UTC)",
          type: "datetime",
          valueFormatter: dateFormatter,
        }}
        yAxis={[
          {
            title: "Events",
          },
          {
            title: "Percentage (%)",
          },
        ]}
      />
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import pseudoRandom from "../../utils/pseudo-random";

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
  { x: 1601012700000, y: 229492 },
  { x: 1601013600000, y: 293910 },
];

const randX = (x: number) => x - randomInt(0, 900000);

const series: CartesianChartProps.ScatterSeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "A" + i, x: randX(x), y })),
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "B" + i, x: randX(x), y: y + randomInt(-100000, 100000) })),
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "C" + i, x: randX(x), y: y + randomInt(-150000, 50000) })),
  },
  {
    name: "D",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "D" + i, x: randX(x), y: y + randomInt(-200000, -100000) })),
  },
  {
    name: "E",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "E" + i, x: randX(x), y: y + randomInt(50000, 75000) })),
  },
];

export function ComponentNew() {
  const { chartProps } = useChartSettings();
  const commonProps = {
    ...chartProps.cartesian,
    chartHeight: 379,
    ariaLabel: "Scatter chart",
    xAxis: { type: "datetime", title: "Time (UTC)", valueFormatter: dateFormatter },
    yAxis: { title: "Events" },
    emphasizeBaseline: false,
  } as const;
  return (
    <CartesianChart {...commonProps} fitHeight={true} chartMinHeight={200} ariaLabel="Scatter chart" series={series} />
  );
}

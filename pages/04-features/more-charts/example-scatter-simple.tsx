// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Alert from "@cloudscape-design/components/alert";

import { CartesianChartProps } from "../../../lib/components";
import { InternalCartesianChart } from "../../../lib/components/cartesian-chart/chart-cartesian-internal";
import { dateFormatter } from "../../common/formatters";
import { usePageSettings } from "../../common/page-settings";
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

const series: CartesianChartProps.Series[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "A", x, y })),
    marker: { enabled: true },
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "B", x, y: y + randomInt(-100000, 100000) })),
    marker: { enabled: true },
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-150000, 50000) })),
    marker: { enabled: true },
  },
  {
    name: "D",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-200000, -100000) })),
    marker: { enabled: true },
  },
  {
    name: "E",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(50000, 75000) })),
    marker: { enabled: true },
  },
];

export function ExampleScatterSimple() {
  const { highcharts, chartStateProps } = usePageSettings();
  return (
    <InternalCartesianChart
      highcharts={highcharts}
      {...chartStateProps}
      options={{
        chart: {
          height: 379,
        },
        lang: {
          accessibility: {
            chartContainerLabel: "Scatter chart",
          },
        },
        series,
        xAxis: [
          {
            type: "datetime",
            title: "Time (UTC)",
            valueFormatter: dateFormatter,
          },
        ],
        yAxis: [{ title: "Events" }],
      }}
      series={{
        getItemStatus(itemId: string) {
          return itemId === "B" ? "warning" : "normal";
        },
      }}
      legendTooltip={{
        getContent(itemId) {
          if (itemId === "B") {
            return { header: "B", body: <Alert type="warning">This series has a warning</Alert> };
          }
          return null;
        },
      }}
    />
  );
}

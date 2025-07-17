// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import SpaceBetween from "@cloudscape-design/components/space-between";
import Toggle from "@cloudscape-design/components/toggle";

import CoreChart, { CoreChartProps } from "../../lib/components/internal-do-not-use/core-chart";
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
];

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }) => ({ x, y: y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ x, y: y + randomInt(-150000, 50000) }));

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { name: "A", type: "line", data: dataA },
  { name: "B", type: "line", data: dataB },
  { name: "C", type: "line", data: dataC },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "Average",
    type: "pie",
    data: [
      { name: "A", y: Math.round(dataA.reduce((acc, { y }) => acc + y, 0) / dataA.length) },
      { name: "B", y: Math.round(dataB.reduce((acc, { y }) => acc + y, 0) / dataA.length) },
      { name: "C", y: Math.round(dataC.reduce((acc, { y }) => acc + y, 0) / dataA.length) },
    ],
  },
];

export default function () {
  const { chartProps } = useChartSettings();
  const [chartType, setChartType] = useState<"line" | "pie">("line");
  const options: CoreChartProps.ChartOptions =
    chartType === "line"
      ? {
          series: lineSeries,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
              valueFormatter: dateFormatter,
            },
          ],
          yAxis: [{ title: { text: "Events" } }],
        }
      : { series: pieSeries, xAxis: [], yAxis: [] };
  return (
    <Page title="Dynamic chart type">
      <SpaceBetween size="m">
        <Toggle checked={chartType === "pie"} onChange={({ detail }) => setChartType(detail.checked ? "pie" : "line")}>
          Show average
        </Toggle>

        <CoreChart
          {...omit(chartProps.cartesian, "ref")}
          highcharts={Highcharts}
          ariaLabel="Events chart"
          options={options}
        />
      </SpaceBetween>
    </Page>
  );
}

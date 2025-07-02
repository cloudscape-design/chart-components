// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";
import { omit } from "lodash";

import Button from "@cloudscape-design/components/button";
import Link from "@cloudscape-design/components/link";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
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
  { x: 1601012700000, y: null },
  { x: 1601013600000, y: 293910 },
];

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-150000, 50000) }));

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "A",
    type: "line",
    data: dataA,
  },
  {
    name: "B",
    type: "line",
    data: dataB,
  },
  {
    name: "C",
    type: "line",
    data: dataC,
  },
  {
    name: "X",
    type: "scatter",
    data: [{ x: 1601012700000, y: 500000 }],
    marker: { symbol: "square" },
    showInLegend: false,
  },
];

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page
      title="Core chart demo"
      subtitle="The page demonstrates the use of the core chart, including additional legend settings."
      settings={
        <PageSettingsForm
          selectedSettings={["showLegend", "legendPosition", "showLegendTitle", "showLegendActions", "useFallback"]}
        />
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        highcharts={Highcharts}
        options={{
          lang: {
            accessibility: {
              chartContainerLabel: "Line chart",
            },
          },
          series: series,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
              valueFormatter: dateFormatter,
            },
          ],
          yAxis: [{ title: { text: "Events" } }],
          chart: {
            zooming: {
              type: "x",
            },
          },
        }}
        chartHeight={400}
        tooltip={{ placement: "outside" }}
        getTooltipContent={() => ({
          point({ item }) {
            const value = item ? (item.point.y ?? null) : null;
            return {
              value: (
                <div>
                  {numberFormatter(value)} <Button variant="inline-icon" iconName="settings" />
                </div>
              ),
            };
          },
          footer() {
            return <Button>Footer action</Button>;
          },
        })}
        getLegendTooltipContent={({ legendItem }) => ({
          header: (
            <div>
              <div style={{ display: "flex" }}>
                {legendItem.marker}
                {legendItem.name}
              </div>
            </div>
          ),
          body: (
            <>
              <table>
                <tbody style={{ textAlign: "left" }}>
                  <tr>
                    <th scope="row">Period</th>
                    <td>15 min</td>
                  </tr>
                  <tr>
                    <th scope="row">Statistic</th>
                    <td>Average</td>
                  </tr>
                  <tr>
                    <th scope="row">Unit</th>
                    <td>Count</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
          footer: (
            <Link external={true} href="https://example.com/" variant="primary">
              Learn more
            </Link>
          ),
        })}
      />
    </Page>
  );
}

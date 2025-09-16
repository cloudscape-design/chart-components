// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import Link from "@cloudscape-design/components/link";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

function shuffleArray<T>(array: T[]): void {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

const colors = [
  "#F15C80",
  "#2B908F",
  "#F45B5B",
  "#91E8E1",
  "#8085E9",
  "#E4D354",
  "#8D4654",
  "#7798BF",
  "#AAEEEE",
  "#FF9655",
];

const dashStyles: Highcharts.DashStyleValue[] = [
  "Dash",
  "DashDot",
  "Dot",
  "LongDash",
  "LongDashDot",
  "LongDashDotDot",
  "ShortDash",
  "ShortDashDot",
  "ShortDashDotDot",
  "ShortDot",
  "Solid",
];

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

const generatePrimaryAxisData = (letter: string, index: number) => {
  return baseline.map(({ x, y }) => ({
    name: `Events ${letter}`,
    x,
    y: y === null ? null : y + randomInt(-100000 * ((index % 3) + 1), 100000 * ((index % 3) + 1)),
  }));
};

const generateSecondaryAxisData = (letter: string, index: number) => {
  return baseline.map(({ x, y }) => ({
    name: `Percentage ${letter}`,
    x,
    y: y === null ? null : (y / 10000) * randomInt(3 + (index % 5), 10 + (index % 10)),
  }));
};

const primarySeriesData: Record<string, ReturnType<typeof generatePrimaryAxisData>> = {};
for (let i = 0; i < 10; i++) {
  const letter = String.fromCharCode(65 + i);
  primarySeriesData[`data${letter}`] = generatePrimaryAxisData(letter, i);
}

const secondarySeriesData: Record<string, ReturnType<typeof generatePrimaryAxisData>> = {};
for (let i = 0; i < 10; i++) {
  const letter = String.fromCharCode(65 + i);
  secondarySeriesData[`data${letter}`] = generateSecondaryAxisData(letter, i);
}

const series: Highcharts.SeriesOptionsType[] = [];

Object.entries(primarySeriesData).forEach(([, data], index) => {
  series.push({
    name: data[0].name,
    type: "line",
    data: data,
    yAxis: 0,
    color: colors[index],
  });
});

Object.entries(secondarySeriesData).forEach(([, data], index) => {
  series.push({
    name: data[0].name,
    type: "line",
    data: data,
    yAxis: 1,
    color: colors[index],
    dashStyle: dashStyles[index % dashStyles.length],
  });
});

shuffleArray(series);

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page
      title="Core dual-axis chart demo"
      subtitle="This page demonstrates the use of the core chart with two Y axes for displaying data with different scales."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            "legendType",
            "legendPosition",
            "legendBottomMaxHeight",
            "showLegendTitle",
            "showOppositeLegendTitle",
            "showLegendActions",
          ]}
        />
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        chartHeight={400}
        ariaLabel="Dual axis line chart"
        tooltip={{ placement: "outside" }}
        options={{
          series: series,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
              valueFormatter: dateFormatter,
            },
          ],
          yAxis: [
            {
              title: { text: "Events" },
            },
            {
              opposite: true,
              title: { text: "Percentage (%)" },
            },
          ],
        }}
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

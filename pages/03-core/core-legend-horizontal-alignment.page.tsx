// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import ColumnLayout from "@cloudscape-design/components/column-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CoreChartProps } from "../../lib/components/core/interfaces";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const lineChartData = [
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

export default function () {
  const { chartProps } = useChartSettings({ solidgauge: true });

  const charts: ((horizontalAlignment: CoreChartProps.LegendOptionsHorizontalAlignment) => CoreChartProps)[] = [
    (horizontalAlignment) => ({
      ...omit(chartProps.cartesian, "ref"),
      legend: {
        horizontalAlignment,
        title: chartProps.cartesian.legend?.title,
        actions: chartProps.cartesian.legend?.actions,
      },
      options: {
        chart: {
          type: "pie",
        },
        title: {
          text: `${horizontalAlignment} aligned Pie`,
        },
        yAxis: {
          min: 0,
          max: 100,
          title: {
            text: "Usage",
          },
        },
        series: [
          {
            name: "Storage Distribution",
            type: "pie",
            data: [
              { y: randomInt(30, 40), name: "Documents" },
              { y: randomInt(20, 30), name: "Images" },
              { y: randomInt(15, 25), name: "Videos" },
              { y: randomInt(10, 15), name: "Other" },
            ],
          },
        ],
      },
    }),
    (horizontalAlignment) => ({
      ...omit(chartProps.cartesian, "ref"),
      legend: {
        horizontalAlignment,
        title: chartProps.cartesian.legend?.title,
        actions: chartProps.cartesian.legend?.actions,
      },
      options: {
        chart: {
          type: "solidgauge",
        },
        title: {
          text: `${horizontalAlignment} aligned Gauge`,
        },
        yAxis: {
          min: 0,
          max: 100,
        },
        series: [
          {
            type: "solidgauge",
            name: "Download speed",
            data: [randomInt(50, 100)],
            showInLegend: true,
            dataLabels: {
              format: "{y} MB/s",
            },
          },
        ],
      },
    }),
    (horizontalAlignment) => ({
      ...omit(chartProps.cartesian, "ref"),
      legend: {
        horizontalAlignment,
        title: chartProps.cartesian.legend?.title,
        actions: chartProps.cartesian.legend?.actions,
      },
      options: {
        chart: {
          type: "line",
        },
        title: {
          text: `${horizontalAlignment} aligned Line`,
        },
        series: [
          {
            type: "line",
            name: "Download speed",
            data: lineChartData,
          },
        ],
      },
    }),
  ];

  return (
    <Page
      title="Core Legend horizontal alignment demo"
      subtitle="The page demonstrates the horizontal alignments of the core legend."
      settings={<PageSettingsForm selectedSettings={["showLegendTitle", "showLegendActions"]} />}
    >
      <SpaceBetween direction="vertical" size="m">
        {charts.map((chart, i) => (
          <ColumnLayout key={i} columns={2}>
            <CoreChart {...chart("start")}></CoreChart>
            <CoreChart {...chart("center")}></CoreChart>
          </ColumnLayout>
        ))}
      </SpaceBetween>
    </Page>
  );
}

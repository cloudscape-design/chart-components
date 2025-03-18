// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { InternalCartesianChart } from "../../../lib/components/cartesian-chart/chart-cartesian-internal";
import { usePageSettings } from "../../common/page-settings";
import pseudoRandom from "../../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "Category",
    type: "heatmap",
    data: [
      { x: 0, y: 0, value: randomInt(15, 20) },
      { x: 0, y: 1, value: randomInt(0, 5) },
      { x: 0, y: 2, value: randomInt(11, 16) },
      { x: 0, y: 3, value: randomInt(2, 17) },
      { x: 1, y: 0, value: randomInt(15, 20) },
      { x: 1, y: 1, value: randomInt(0, 5) },
      { x: 1, y: 2, value: randomInt(11, 16) },
      { x: 1, y: 3, value: randomInt(2, 17) },
      { x: 2, y: 0, value: randomInt(15, 20) },
      { x: 2, y: 1, value: randomInt(0, 5) },
      { x: 2, y: 2, value: randomInt(11, 16) },
      { x: 2, y: 3, value: randomInt(2, 17) },
      { x: 3, y: 0, value: randomInt(15, 20) },
      { x: 3, y: 1, value: randomInt(0, 5) },
      { x: 3, y: 2, value: randomInt(11, 16) },
      { x: 3, y: 3, value: randomInt(2, 17) },
      { x: 4, y: 0, value: randomInt(15, 20) },
      { x: 4, y: 1, value: randomInt(0, 5) },
      { x: 4, y: 2, value: randomInt(11, 16) },
      { x: 4, y: 3, value: randomInt(2, 17) },
      { x: 5, y: 0, value: randomInt(15, 20) },
      { x: 5, y: 1, value: randomInt(0, 5) },
      { x: 5, y: 2, value: randomInt(11, 16) },
      { x: 5, y: 3, value: randomInt(2, 17) },
      { x: 6, y: 0, value: randomInt(15, 20) },
      { x: 6, y: 1, value: randomInt(0, 5) },
      { x: 6, y: 2, value: randomInt(11, 16) },
      { x: 6, y: 3, value: randomInt(2, 17) },
    ],
    marker: { enabled: true },
    dataLabels: {
      enabled: true,
    },
  },
];

export function ExampleHeatmapSimple() {
  const { settings, highcharts, chartStateProps } = usePageSettings();
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
            chartContainerLabel: "Heatmap demo",
          },
        },
        legend: {
          enabled: false,
        },
        colorAxis: {
          min: 0,
          max: 30,
          minColor: "#FFFFFF",
          maxColor: "#688ae8",
        },
        series,
        xAxis: [
          {
            title: "Timerange",
            type: "category",
            categories: ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"],
          },
        ],
        yAxis: [{ title: "Values", type: "category", categories: ["A", "B", "C", "D"] }],
      }}
      tooltip={{ placement: settings.tooltipPlacement }}
    />
  );
}

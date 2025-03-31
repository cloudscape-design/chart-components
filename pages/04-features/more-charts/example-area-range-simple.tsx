// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { CartesianChartProps } from "../../../lib/components";
import { InternalCartesianChart } from "../../../lib/components/cartesian-chart/chart-cartesian-internal";
import { dateFormatter, numberFormatter } from "../../common/formatters";
import { usePageSettings } from "../../common/page-settings";

const series: (CartesianChartProps.Series | Highcharts.SeriesOptionsType)[] = [
  {
    name: "Range",
    type: "areasplinerange",
    data: [
      // The x values are timestamps that can be converted to a date with new Date(timestamp)
      { x: 1600984800000, high: 58020, low: -50_000 + 56789 },
      { x: 1600985700000, high: 102402, low: -50_000 + 100001 },
      { x: 1600986600000, high: 104920, low: -50_000 + 98702 },
      { x: 1600987500000, high: 94031, low: -50_000 + 88009 },
      { x: 1600988400000, high: 125021, low: -50_000 + 121333 },
      { x: 1600989300000, high: 159219, low: -50_000 + 158111 },
      { x: 1600990200000, high: 193082, low: -50_000 + 171332 },
      { x: 1600991100000, high: 162592, low: -50_000 + 158242 },
      { x: 1600992000000, high: 274021, low: -50_000 + 250042 },
      { x: 1600992900000, high: 264286, low: -50_000 + 250244 },
      { x: 1600993800000, high: 289210, low: -50_000 + 277125 },
      { x: 1600994700000, high: 256362, low: -50_000 + 233342 },
      { x: 1600995600000, high: 257306, low: -50_000 + 233456 },
      { x: 1600996500000, high: 186776, low: -50_000 + 144243 },
      { x: 1600997400000, high: 294020, low: -50_000 + 254998 },
      { x: 1600998300000, high: 385975, low: -50_000 + 348332 },
      { x: 1600999200000, high: 486039, low: -50_000 + 455332 },
      { x: 1601000100000, high: 490447, low: -50_000 + 479222 },
      { x: 1601001000000, high: 361845, low: -50_000 + 324923 },
      { x: 1601001900000, high: 339058, low: -50_000 + 332221 },
      { x: 1601002800000, high: 298028, low: -50_000 + 288331 },
      { x: 1601003400000, high: 255555, low: -50_000 + 233134 },
      { x: 1601003700000, high: 231902, low: -50_000 + 201423 },
      { x: 1601004600000, high: 224558, low: -50_000 + 199223 },
      { x: 1601005500000, high: 253901, low: -50_000 + 213124 },
      { x: 1601006400000, high: 102839, low: -50_000 + 99342 },
      { x: 1601007300000, high: 234943, low: -50_000 + 199133 },
      { x: 1601008200000, high: 204405, low: -50_000 + 188324 },
      { x: 1601009100000, high: 190391, low: -50_000 + 167324 },
      { x: 1601010000000, high: 183570, low: -50_000 + 143224 },
      { x: 1601010900000, high: 162592, low: -50_000 + 123453 },
      { x: 1601011800000, high: 148910, low: -50_000 + 98452 },
      { x: 1601012700000, high: 229492, low: -50_000 + 154224 },
      { x: 1601013600000, high: 293910, low: -50_000 + 161342 },
    ],
    color: {
      linearGradient: {
        x1: 0,
        x2: 0,
        y1: 0,
        y2: 1,
      },
      stops: [
        [0, "#ff0000"],
        [1, "#0000ff"],
      ],
    },
  },
  {
    type: "awsui-x-threshold",
    name: "Peak hours",
    value: 1601003400000,
  },
];

export function ExampleAreaRangeSimple() {
  const { highcharts, settings, chartStateProps } = usePageSettings({ more: true });
  const hideSeries = settings.applyLoadingState || settings.applyEmptyState || settings.applyErrorState;
  return (
    <InternalCartesianChart
      highcharts={highcharts}
      {...chartStateProps}
      options={{
        chart: {
          height: 379,
        },
        legend: {
          enabled: settings.showLegend,
          title: { text: settings.showLegendTitle ? "Legend title" : undefined },
        },
        lang: {
          accessibility: {
            chartContainerLabel: "Single data series line chart",
          },
        },
        series: hideSeries ? [] : series,
        xAxis: [
          {
            type: "datetime",
            title: "Time (UTC)",
            min: 1600984800000,
            max: 1601013600000,
            valueFormatter: dateFormatter,
          },
        ],
        yAxis: [
          {
            title: "Bytes transferred",
            min: 0,
            max: 500000,
            valueFormatter: numberFormatter,
          },
        ],
      }}
      tooltip={{ placement: settings.tooltipPlacement, size: settings.tooltipSize }}
      emphasizeBaselineAxis={settings.emphasizeBaselineAxis}
    />
  );
}

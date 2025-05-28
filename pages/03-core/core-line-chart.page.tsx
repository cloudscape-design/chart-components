// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import { CoreChartAPI } from "../../lib/components/core/interfaces-core";
import { getSeriesColor, getSeriesMarkerType } from "../../lib/components/core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../../lib/components/internal/components/series-details";
import { ChartSeriesMarker } from "../../lib/components/internal/components/series-marker";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

interface ThisPageSettings extends PageSettings {
  keepZoomingFrame: boolean;
}

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

const dataA = baseline.map(({ x, y }) => ({ name: "A", x, y }));
const dataB = baseline.map(({ x, y }) => ({ name: "B", x, y: y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-150000, 50000) }));

const scatterSeries: Highcharts.SeriesOptionsType[] = [
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
];

export default function () {
  return (
    <Page title="Line chart implemented with core chart API">
      <LineChart />
    </Page>
  );
}

function LineChart() {
  const { chartProps } = useChartSettings<ThisPageSettings>({ more: true });
  const chartRef = useRef<CoreChartAPI>(null) as React.MutableRefObject<CoreChartAPI>;
  const getChart = () => chartRef.current!;
  return (
    <CoreChart
      callback={(chart) => {
        chartRef.current = chart;
      }}
      {...omit(chartProps.cartesian, "ref")}
      options={{
        chart: {
          height: 400,
        },
        lang: {
          accessibility: {
            chartContainerLabel: "Scatter chart",
          },
        },
        series: scatterSeries,
        xAxis: [
          {
            type: "datetime",
            title: { text: "Time (UTC)" },
          },
        ],
        yAxis: [{ title: { text: "Events" } }],
      }}
      getTooltipContent={({ group }) => {
        const x = group[0].x;
        const header = dateFormatter(x);
        const details: ChartSeriesDetailItem[] = [];
        for (const s of getChart().chart.series) {
          for (const p of s.data) {
            if (p.x === x) {
              details.push({
                key: p.name,
                marker: <ChartSeriesMarker color={getSeriesColor(s)} type={getSeriesMarkerType(s)} />,
                value: numberFormatter(p.y!),
              });
            }
          }
        }
        return {
          header,
          body: <ChartSeriesDetails details={details} />,
        };
      }}
    />
  );
}

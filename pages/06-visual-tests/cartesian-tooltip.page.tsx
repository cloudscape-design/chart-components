// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import Button from "@cloudscape-design/components/button";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

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
];

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }, index) => ({ x, y: y + index * 10000 }));

const series: Highcharts.SeriesOptionsType[] = [
  { name: "A", type: "spline", data: dataA },
  { name: "B", type: "spline", data: dataB },
];

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page title="Cartesian chart tooltip visual regression page">
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        options={{
          lang: { accessibility: { chartContainerLabel: "Line chart" } },
          series: series,
          xAxis: [{ type: "datetime", title: { text: "Time (UTC)" }, valueFormatter: dateFormatter }],
          yAxis: [{ title: { text: "Events" } }],
        }}
        chartHeight={400}
        tooltip={{ placement: "outside" }}
        getTooltipContent={() => ({
          footer() {
            return <Button>Footer action</Button>;
          },
        })}
        callback={(api) => {
          setTimeout(() => {
            if (api.chart.series) {
              const point = api.chart.series[0].data.find((p) => p.x === 1600990200000)!;
              api.highlightChartPoint(point);
            }
          }, 0);
        }}
      />
    </Page>
  );
}

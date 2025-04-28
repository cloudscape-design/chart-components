// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChartProps } from "../../lib/components";
import { InternalCartesianChart } from "../../lib/components/cartesian-chart/chart-cartesian-internal";
import { dateFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

export default function () {
  return (
    <Page
      title="Large series"
      subtitle="This demonstrates how component handles large series"
      settings={<PageSettingsForm selectedSettings={["showLegend"]} />}
    >
      <Component />
    </Page>
  );
}

const domain: number[] = [];
for (
  let time = new Date("2015-01-01").getTime();
  time < new Date("2025-01-01").getTime();
  time += 12 * 60 * 60 * 1000
) {
  domain.push(time);
}

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Site 1",
    type: "spline",
    data: domain.map((x, index) => ({
      x,
      y: Math.round(1000 + pseudoRandom() * 5000 + pseudoRandom() * 10000 + pseudoRandom() * 10 * index),
    })),
  },
  {
    name: "Site 2",
    type: "spline",
    data: domain.map((x, index) => ({
      x,
      y: Math.round(1000 + pseudoRandom() * 5000 + pseudoRandom() * 10000 + pseudoRandom() * 20 * index),
    })),
  },
];

function Component() {
  const { chartProps } = useChartSettings();
  return (
    <InternalCartesianChart
      {...chartProps.cartesian}
      options={{
        chart: { height: 500 },
        lang: { accessibility: { chartContainerLabel: "Line chart" } },
        series: series,
        xAxis: [
          {
            type: "linear",
            title: "Time (UTC)",
            min: domain[0],
            max: domain[domain.length - 1],
            valueFormatter: dateFormatter,
          },
        ],
        yAxis: [{ title: "Bytes transferred", min: 0, max: 300000 }],
        plotOptions: { series: { marker: { enabled: false }, stacking: "normal" } },
      }}
      tooltip={{
        placement: "bottom",
      }}
    />
  );
}

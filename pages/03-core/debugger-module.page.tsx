// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "line-1",
    type: "line",
    data: [
      { x: 1, y: 25000 },
      { x: 4, y: 28000 },
      { x: 3, y: -4000 },
      { x: 2, y: 9000 },
      { x: 0, y: 10000 },
    ],
  },
];

export default function () {
  return (
    <Page
      title="Debugger module demo"
      subtitle="The page demonstrates how debugger module (active in development mode only) helps finding issues."
      screenshotArea={false}
    >
      <ExampleMixedChart />
    </Page>
  );
}

function ExampleMixedChart() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={423}
      ariaLabel="Simple line chart with a mistake in series definition"
      series={series}
      xAxis={{
        title: "Linear X",
      }}
      yAxis={{
        title: "Linear Y",
        min: -10000,
        max: 40000,
      }}
    />
  );
}

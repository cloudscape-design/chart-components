// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "CPU Usage",
    type: "solidgauge",
    data: [randomInt(60, 90)],
  },
];

export default function () {
  const { chartProps } = useChartSettings({ solidgauge: true });
  return (
    <Page
      title="Solid Gauge Chart Demo"
      subtitle="This page demonstrates the use of solid gauge charts for displaying single-value metrics."
      settings={
        <PageSettingsForm
          selectedSettings={["showLegend", "legendPosition", "showLegendTitle", "showLegendActions", "useFallback"]}
        />
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        options={{
          series,
          chart: {
            type: "solidgauge",
          },
          title: {
            text: "Resource Usage",
          },
          yAxis: {
            min: 0,
            max: 100,
            title: {
              text: "Usage",
            },
            stops: [
              [0.1, "#55BF3B"],
              [0.5, "#DDDF0D"],
              [0.8, "#DF5353"],
            ],
          },
        }}
      />
    </Page>
  );
}

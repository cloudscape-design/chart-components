// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { colors } from "../../lib/components/internal/chart-styles";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "Disk Usage",
    type: "solidgauge",
    data: [85],
    showInLegend: true,
  },
  {
    name: "Memory Usage",
    type: "solidgauge",
    data: [60],
    showInLegend: true,
  },
  {
    name: "CPU Usage",
    type: "solidgauge",
    data: [15],
    showInLegend: true,
  },
];

export default function () {
  const {
    chartProps: { cartesian },
  } = useChartSettings({ solidgauge: true });

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
        {...cartesian}
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
              [0.1, colors[0]],
              [0.5, colors[1]],
              [0.8, colors[2]],
            ],
          },
        }}
      />
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { colors } from "../../lib/components/internal/chart-styles";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "Resource usage",
    type: "solidgauge",
    data: [
      { y: 85, name: "Disk Usage", color: colors[0] },
      { y: 60, name: "Memory Usage", color: colors[1] },
      { y: 15, name: "CPU Usage", color: colors[2] },
    ],
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
          yAxis: { min: 0, max: 100, title: { text: "Usage" } },
        }}
      />
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { CloudscapeHighcharts } from "../../../lib/components/core/chart-core";
import { usePageSettings } from "../../common/page-settings";

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "Highcharts Treemap",
    type: "treemap",
    data: [
      { name: "A", value: 6, color: "#d2f7d4" },
      { name: "B", value: 6, color: "#f6ebea" },
      { name: "C", value: 4, color: "#f3dceb" },
      { name: "D", value: 3, color: "#a4d7e7" },
      { name: "E", value: 2, color: "#aab8dc" },
      { name: "F", value: 2, color: "#65bbd6" },
      { name: "G", value: 1, color: "#8fb9e5" },
    ],
  },
];

export function ExampleTreemapSimple() {
  const { highcharts, chartStateProps } = usePageSettings({ treemap: true });

  const highchartsOptions: Highcharts.Options = {
    chart: {
      height: 379,
    },
    lang: {
      accessibility: {
        chartContainerLabel: "Treemap chart",
      },
    },
    legend: { enabled: false },
    series,
    tooltip: { enabled: true },
  };

  return <CloudscapeHighcharts highcharts={highcharts} options={highchartsOptions} noData={chartStateProps.noData} />;
}

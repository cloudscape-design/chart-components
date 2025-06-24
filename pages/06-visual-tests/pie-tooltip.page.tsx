// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import Button from "@cloudscape-design/components/button";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "Resource count",
    type: "pie",
    data: [
      { name: "Running", y: 60 },
      { name: "Failed", y: 30 },
      { name: "In-progress", y: 10 },
    ],
  },
];

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page title="Pie chart tooltip visual regression page">
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        options={{
          lang: { accessibility: { chartContainerLabel: "Pie chart" } },
          series: series,
        }}
        chartHeight={400}
        getTooltipContent={() => ({
          footer() {
            return <Button>Footer action</Button>;
          },
        })}
        callback={(api) => {
          setTimeout(() => {
            if (api.chart.series) {
              const point = api.chart.series[0].data.find((p) => p.y === 30)!;
              api.highlightChartPoint(point);
            }
          }, 0);
        }}
      />
    </Page>
  );
}

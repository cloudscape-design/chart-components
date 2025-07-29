// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";
import { omit } from "lodash";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page
      title="Core chart demo"
      subtitle="The page demonstrates the use of the core chart, including additional legend settings."
      settings={
        <PageSettingsForm
          selectedSettings={["showLegend", "legendPosition", "showLegendTitle", "showLegendActions", "useFallback"]}
        />
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        chartHeight={400}
        highcharts={Highcharts}
        options={{
          xAxis: {
            min: 1,
            max: 50,
          },
          yAxis: {
            min: 0,
            max: 1,
          },
          series: [
            {
              data: [],
              type: "line",
              showInLegend: false,
            },
          ],
        }}
      />
    </Page>
  );
}

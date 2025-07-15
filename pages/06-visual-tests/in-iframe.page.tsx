// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import { IframeWrapper } from "../utils/iframe-wrapper";

export default function () {
  return (
    <IframeWrapper
      AppComponent={() => {
        const { chartProps } = useChartSettings();
        return (
          <Page title="Chart inside iframe visual regression page">
            <CoreChart
              {...omit(chartProps.pie, "ref")}
              ariaLabel="Pie chart"
              options={{
                series: [
                  {
                    name: "Resource count",
                    type: "pie",
                    data: [
                      { name: "Running", y: 60 },
                      { name: "Failed", y: 30 },
                      { name: "In-progress", y: 10 },
                    ],
                  },
                ],
              }}
              callback={(api) => {
                setTimeout(() => {
                  if (api.chart.series) {
                    const point = api.chart.series[0].data.find((p) => p.y === 10)!;
                    api.highlightChartPoint(point);
                  }
                }, 0);
              }}
            />
          </Page>
        );
      }}
    />
  );
}

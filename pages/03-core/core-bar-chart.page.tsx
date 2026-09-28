// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

export default function () {
  const { chartProps } = useChartSettings();

  return (
    <Page title="Core bar chart" settings={<PageSettingsForm selectedSettings={["showLegend"]} />}>
      <div style={{ height: 400 }}>
        <CoreChart
          {...chartProps.core}
          fitHeight={true}
          ariaLabel="Bar chart"
          options={{
            chart: { type: "bar" },
            series: [
              {
                name: "Series",
                type: "column",
                yAxis: 1,
                data: [1, 2, 3],
              },
            ],
            xAxis: { categories: ["A", "B", "C"] },
            yAxis: [{}, { opposite: true }],
          }}
        />
      </div>
    </Page>
  );
}

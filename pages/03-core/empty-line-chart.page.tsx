// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";
import { omit } from "lodash";

import Checkbox from "@cloudscape-design/components/checkbox";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  showInLegend?: boolean;
}

export default function () {
  const { chartProps, settings, setSettings } = useChartSettings<ThisPageSettings>();
  return (
    <Page
      title="Empty core chart demo"
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            "legendPosition",
            "showLegendTitle",
            "showLegendActions",
            "useFallback",
            {
              content: (
                <Checkbox
                  checked={!!settings.showInLegend}
                  onChange={({ detail }) => setSettings({ showInLegend: detail.checked })}
                >
                  Show in legend
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        highcharts={Highcharts}
        options={{
          xAxis: { min: 1, max: 50 },
          yAxis: { min: 0, max: 1 },
          series: [{ type: "line", data: [], showInLegend: settings.showInLegend }],
        }}
      />
    </Page>
  );
}

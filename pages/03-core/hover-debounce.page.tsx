// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentType } from "react";
import Highcharts from "highcharts";
import { range } from "lodash";

import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

import { CoreChartProps } from "../../lib/components/core/interfaces";
import { InternalHoverProps } from "../../lib/components/core/internal-interfaces";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

interface ThisPageSettings extends PageSettings {
  hoverDebounce?: number;
}

const HoverCoreChart = CoreChart as ComponentType<CoreChartProps & InternalHoverProps>;

const MINUTE = 60 * 1000;
const start = new Date("2025-01-01T00:00:00Z").getTime();

const lineSeries: Highcharts.SeriesOptionsType[] = range(0, 40).map((s) => ({
  type: "line",
  name: `Host ${String(s + 1).padStart(2, "0")} (us-east-1${"abcdef"[s % 6]})`,
  data: range(0, 60).map((i) => ({
    x: start + i * 5 * MINUTE,
    y: Math.round(50 + s * 10 + Math.sin(i / 6 + s) * 20 + pseudoRandom() * 15),
  })),
}));

export default function () {
  const { settings, setSettings, chartProps } = useChartSettings<ThisPageSettings>();
  const hoverDebounce = Number(settings.hoverDebounce ?? 300);
  const legend = { ...chartProps.core.legend, bottomMaxHeight: Number(settings.legendBottomMaxHeight ?? 50) };

  return (
    <Page
      title="Hover debounce"
      subtitle="Series highlight, legend highlight, legend scroll-into-view, and the tooltip are applied together once the pointer settles on a target for the given delay. Set the delay to 0 to compare with the immediate behavior."
      settings={
        <PageSettingsForm
          selectedSettings={[
            {
              content: (
                <FormField label="Hover debounce (ms)" description="0 disables the delay.">
                  <Input
                    type="number"
                    value={String(hoverDebounce)}
                    onChange={({ detail }) => setSettings({ hoverDebounce: detail.value ? parseInt(detail.value) : 0 })}
                  />
                </FormField>
              ),
            },
            "legendPosition",
            "legendBottomMaxHeight",
            "tooltipPlacement",
          ]}
        />
      }
    >
      <PageSection
        title="Line chart with many series"
        subtitle="Sweep across the plot: the highlight should stay put until the pointer rests. The bottom legend is limited to 50px (unless set in page settings) so the highlighted item scrolls into view."
      >
        <HoverCoreChart
          {...chartProps.core}
          legend={legend}
          hoverDebounce={hoverDebounce}
          chartHeight={300}
          ariaLabel="Line chart"
          options={{
            series: lineSeries,
            xAxis: [{ type: "datetime", title: { text: "Time (UTC)" }, valueFormatter: dateFormatter }],
            yAxis: [{ title: { text: "Requests" } }],
          }}
        />
      </PageSection>
    </Page>
  );
}

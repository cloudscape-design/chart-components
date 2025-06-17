// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PieChart, PieChartProps } from "../../lib/components";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { FitSizeDemo, Page, PageSection } from "../common/templates";

const pieSeries: PieChartProps.SeriesOptions = {
  name: "Resource count",
  type: "pie",
  data: [
    {
      name: "Running",
      y: 60,
    },
    {
      name: "Failed",
      y: 30,
    },
    {
      name: "In-progress",
      y: 10,
    },
    {
      name: "Pending",
      y: null,
    },
  ],
};

export default function () {
  const { settings, chartProps } = useChartSettings();
  const commonChartProps: PieChartProps = {
    ...chartProps.pie,
    series: pieSeries,
    segmentDescription: ({ segmentValue, totalValue }) =>
      `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
  };
  return (
    <Page
      title="Chart size"
      subtitle="The page demonstrates chart size settings, including fit size, chart height, chart min height, and chart min width."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "height",
            "minHeight",
            "minWidth",
            "containerHeight",
            "containerWidth",
            "showLegend",
            "showLegendTitle",
            "legendPosition",
            "useFallback",
          ]}
        />
      }
    >
      <PageSection title="Chart height">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <PieChart {...commonChartProps} chartHeight={settings.height} />
        </FitSizeDemo>
      </PageSection>

      <PageSection title="Chart height, min height, and min width">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <PieChart
            {...commonChartProps}
            chartHeight={settings.height}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </FitSizeDemo>
      </PageSection>

      <PageSection title="Fit height, min height, and min width">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <PieChart
            {...commonChartProps}
            fitHeight={true}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </FitSizeDemo>
      </PageSection>
    </Page>
  );
}

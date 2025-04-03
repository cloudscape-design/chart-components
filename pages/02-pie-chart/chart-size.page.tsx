// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { PieChart, PieChartProps } from "../../lib/components";
import { usePageSettings } from "../common/page-settings";
import { FitSizeDemo, Page, PageSection } from "../common/templates";

const pieSeries: PieChartProps.Series = {
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
  const { highcharts, settings, setSettings } = usePageSettings();
  const commonChartProps: PieChartProps = {
    highcharts: settings.useFallback ? null : highcharts,
    series: pieSeries,
    legend: {
      enabled: settings.showLegend,
      title: settings.showLegendTitle ? "Legend title" : undefined,
    },
    segmentOptions: {
      description: ({ segmentValue, totalValue }) =>
        `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
    },
  };
  return (
    <Page
      title="Chart size"
      subtitle="The page demonstrates chart size settings, including fit size, chart height, chart min height, and chart min width."
      settings={
        <SpaceBetween size="s">
          <FormField label="Chart height">
            <Input
              type="number"
              value={settings.height.toString()}
              onChange={({ detail }) => setSettings({ height: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Chart min height">
            <Input
              type="number"
              value={settings.minHeight.toString()}
              onChange={({ detail }) => setSettings({ minHeight: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Chart min width">
            <Input
              type="number"
              value={settings.minWidth.toString()}
              onChange={({ detail }) => setSettings({ minWidth: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Container height">
            <Input
              type="number"
              value={settings.containerHeight.toString()}
              onChange={({ detail }) => setSettings({ containerHeight: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Container width">
            <Input
              value={settings.containerWidth}
              onChange={({ detail }) => setSettings({ containerWidth: detail.value })}
            />
          </FormField>
          <Checkbox
            checked={settings.showLegend}
            onChange={({ detail }) => setSettings({ showLegend: detail.checked })}
          >
            Show legend
          </Checkbox>
          <Checkbox
            checked={settings.showLegendTitle}
            onChange={({ detail }) => setSettings({ showLegendTitle: detail.checked })}
          >
            Show legend title
          </Checkbox>
          <Checkbox
            checked={settings.useFallback}
            onChange={({ detail }) => setSettings({ useFallback: detail.checked })}
          >
            Use fallback
          </Checkbox>
        </SpaceBetween>
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

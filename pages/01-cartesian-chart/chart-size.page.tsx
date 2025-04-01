// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { ChartFrame } from "../common/chart-frame";
import { usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const splineSeries: CartesianChartProps.Series[] = [
  {
    type: "spline",
    name: "Demo spline fifty",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 50)]),
  },
  {
    type: "spline",
    name: "Demo spline seventy-five",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 75)]),
  },
  {
    type: "spline",
    name: "Demo spline one hundred",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 100)]),
  },
  {
    type: "spline",
    name: "Demo spline one hundred twenty-five",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 125)]),
  },
  {
    type: "spline",
    name: "Demo spline one hundred fifty",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 150)]),
  },
];

export default function () {
  const { highcharts, settings, setSettings } = usePageSettings();
  const commonChartProps: CartesianChartProps = {
    highcharts: settings.useFallback ? null : highcharts,
    series: splineSeries,
    legend: {
      enabled: settings.showLegend,
      title: settings.showLegendTitle ? "Legend title" : undefined,
    },
    xAxis: {
      title: "X values",
      type: "linear",
      valueDecimals: 0,
    },
    yAxis: {
      title: "Y values",
      type: "linear",
      valueDecimals: 0,
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
        <ChartFrame height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart {...commonChartProps} chartHeight={settings.height} />
        </ChartFrame>
      </PageSection>

      <PageSection title="Chart height, min height, and min width">
        <ChartFrame height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart
            {...commonChartProps}
            chartHeight={settings.height}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </ChartFrame>
      </PageSection>

      <PageSection title="Fit height, min height, and min width">
        <ChartFrame height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart
            {...commonChartProps}
            fitHeight={true}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </ChartFrame>
      </PageSection>
    </Page>
  );
}

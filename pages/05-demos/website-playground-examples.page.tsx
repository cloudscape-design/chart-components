// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { PageSettingsDefaults, TooltipSettings, usePageSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import { ExampleAreaChartStackedAreaChart } from "./website-playground-examples/example-area-stacked-area-chart";
import { ExampleAreaChartStackedAreaChartMultipleMetrics } from "./website-playground-examples/example-area-stacked-area-chart-multiple-metrics";
import { ExampleAreaChartStackedAreaChartWithThreshold } from "./website-playground-examples/example-area-stacked-area-chart-with-threshold";
import { ExampleBarChartMultipleDataSeriesGrouped } from "./website-playground-examples/example-bar-multiple-data-series-grouped";
import { ExampleBarChartMultipleDataSeriesStacked } from "./website-playground-examples/example-bar-multiple-data-series-stacked";
import { ExampleBarChartMultipleDataSeriesStackedHorizontal } from "./website-playground-examples/example-bar-multiple-data-series-stacked-horizontal";
import { ExampleBarChartSingleDataSeries } from "./website-playground-examples/example-bar-single-data-series";
import { ExampleBarChartWithSubItems } from "./website-playground-examples/example-bar-with-sub-items";
import { ExampleLineChartMultipleDataSeriesAndThreshold } from "./website-playground-examples/example-line-multiple-data-series-and-threshold";
import { ExampleLineChartSingleDataSeries } from "./website-playground-examples/example-line-single-data-series";
import { ExampleMixedLineAndBarChart } from "./website-playground-examples/example-mixed-line-and-bar-chart";
import { ExamplePieChartDonutChart } from "./website-playground-examples/example-pie-chart-donut-chart";
import { ExamplePieChartPieChart } from "./website-playground-examples/example-pie-chart-pie-chart";
import { ExamplePieChartSmallDonutChart } from "./website-playground-examples/example-pie-chart-small-donut-chart";

export default function () {
  const { settings, setSettings } = usePageSettings();
  return (
    <PageSettingsDefaults settings={{ pieInnerValue: "100", pieInnerDescription: "total units" }}>
      <Page
        title="Website playground examples"
        subtitle="This pages features new charts implemented from the existing website playground examples to demonstrate feature parity."
        settings={
          <SpaceBetween size="s">
            <TooltipSettings />
            <FormField label="Donut chart inner value">
              <Input
                value={settings.pieInnerValue}
                onChange={({ detail }) => setSettings({ pieInnerValue: detail.value })}
                placeholder="Enter value"
              />
            </FormField>
            <FormField label="Donut chart inner description">
              <Input
                value={settings.pieInnerDescription}
                onChange={({ detail }) => setSettings({ pieInnerDescription: detail.value })}
                placeholder="Enter value"
              />
            </FormField>
            <Checkbox
              checked={settings.applyLoadingState}
              onChange={({ detail }) => setSettings({ applyLoadingState: detail.checked })}
            >
              Apply loading state
            </Checkbox>
            <Checkbox
              checked={settings.applyEmptyState}
              onChange={({ detail }) => setSettings({ applyEmptyState: detail.checked })}
            >
              Apply empty state
            </Checkbox>
            <Checkbox
              checked={settings.applyErrorState}
              onChange={({ detail }) => setSettings({ applyErrorState: detail.checked })}
            >
              Apply error state
            </Checkbox>
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
              checked={settings.emphasizeBaselineAxis}
              onChange={({ detail }) => setSettings({ emphasizeBaselineAxis: detail.checked })}
            >
              Emphasize baseline axis
            </Checkbox>
          </SpaceBetween>
        }
      >
        <ColumnLayout columns={2} borders="all">
          <ExampleBarChartSingleDataSeries />
          <ExampleBarChartMultipleDataSeriesGrouped />
          <ExampleBarChartMultipleDataSeriesStacked />
          <ExampleBarChartMultipleDataSeriesStackedHorizontal />
          <ExampleBarChartWithSubItems />
          <ExampleLineChartSingleDataSeries />
          <ExampleLineChartMultipleDataSeriesAndThreshold />
          <ExampleAreaChartStackedAreaChart />
          <ExampleAreaChartStackedAreaChartMultipleMetrics />
          <ExampleAreaChartStackedAreaChartWithThreshold />
          <ExampleMixedLineAndBarChart />
          <ExamplePieChartPieChart />
          <ExamplePieChartDonutChart />
          <PageSettingsDefaults settings={{ pieInnerValue: "80%" }}>
            <ExamplePieChartSmallDonutChart />
          </PageSettingsDefaults>
        </ColumnLayout>
      </Page>
    </PageSettingsDefaults>
  );
}

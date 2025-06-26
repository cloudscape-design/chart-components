// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ColumnLayout from "@cloudscape-design/components/column-layout";

import { PageSettingsForm } from "../common/page-settings";
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
  return (
    <Page
      title="Website playground examples"
      subtitle="This pages features new charts implemented from the existing website playground examples to demonstrate feature parity."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "emptySeries",
            "seriesLoading",
            "seriesError",
            "showLegend",
            "showLegendTitle",
            "tooltipSize",
            "tooltipPlacement",
            "emphasizeBaseline",
          ]}
        />
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
        <ExamplePieChartSmallDonutChart />
      </ColumnLayout>
    </Page>
  );
}

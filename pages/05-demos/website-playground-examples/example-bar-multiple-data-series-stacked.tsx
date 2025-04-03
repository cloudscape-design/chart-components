// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { usePageSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.Series[] = [
  {
    name: "Severe",
    type: "column",
    data: [12, 18, 15, 9, 18],
  },
  {
    name: "Moderate",
    type: "column",
    data: [8, 11, 12, 11, 13],
  },
  {
    name: "Low",
    type: "column",
    data: [7, 9, 8, 7, 5],
  },
  {
    name: "Unclassified",
    type: "column",
    data: [14, 8, 6, 4, 6],
  },
];

export function ExampleBarChartMultipleDataSeriesStacked() {
  const { highcharts, settings, chartStateProps } = usePageSettings();
  const hideSeries = settings.applyLoadingState || settings.applyEmptyState || settings.applyErrorState;
  return (
    <PageSection
      title="Bar chart: Multiple data series, stacked"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/bar-chart?tabId=playground&example=multiple-data-series%2C-stacked">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        highcharts={highcharts}
        {...chartStateProps}
        chartHeight={423}
        legend={{
          enabled: settings.showLegend,
          title: settings.showLegendTitle ? "Legend title" : undefined,
        }}
        ariaLabel="Stacked bar chart"
        plotOptions={{ series: { stacking: "normal" } }}
        series={hideSeries ? [] : series}
        tooltip={{ placement: settings.tooltipPlacement, size: settings.tooltipSize }}
        xAxis={{
          type: "category",
          title: "Time (UTC)",
          categories: [
            dateFormatter(1601071200000),
            dateFormatter(1601078400000),
            dateFormatter(1601085600000),
            dateFormatter(1601092800000),
            dateFormatter(1601100000000),
          ],
        }}
        yAxis={{ title: "Error count", min: 0, max: 50 }}
        emphasizeBaselineAxis={settings.emphasizeBaselineAxis}
      />
    </PageSection>
  );
}

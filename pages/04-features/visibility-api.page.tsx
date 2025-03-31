// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { sum } from "lodash";

import Box from "@cloudscape-design/components/box";
import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps, PieChart, PieChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { PageSettingsDefaults, usePageSettings } from "../common/page-settings";
import { SeriesFilter } from "../common/series-filter";
import { Page, PageSection } from "../common/templates";

const mixedChartSeries: CartesianChartProps.Series[] = [
  {
    id: "Costs",
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
  },
  {
    id: "Costs last year",
    name: "Costs last year",
    type: "line",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
  },
  {
    type: "awsui-x-threshold",
    id: "Peak cost",
    name: "Peak cost",
    value: 3,
  },
  {
    type: "awsui-y-threshold",
    id: "Budget",
    name: "Budget",
    value: 12000,
  },
];

const pieChartSeries: PieChartProps.Series = {
  name: "Value",
  type: "pie",
  data: [
    { id: "Costs", name: "Costs", y: sum([6562, 8768, 9742, 10464, 16777, 9956, 5876]) },
    { id: "Costs last year", name: "Costs last year", y: sum([5373, 7563, 7900, 12342, 14311, 11830, 8505]) },
    { id: "Budget", name: "Budget", y: 12000 * 7 },
  ],
};

export default function () {
  return (
    <PageSettingsDefaults
      settings={{
        visibleContent: ["Costs", "Costs last year", "Peak cost"],
      }}
    >
      <Page
        title="Visibility API"
        subtitle="This page demonstrates controllable series visibility API that allows to make series visible or hidden
            programmatically."
        settings={<SeriesFilter allSeries={["Costs", "Costs last year", "Peak cost", "Budget"]} />}
      >
        <PageSection title="Mixed chart">
          <ExampleMixedChart />
        </PageSection>
        <PageSection title="Pie chart">
          <ExamplePieChart />
        </PageSection>
      </Page>
    </PageSettingsDefaults>
  );
}

function ExampleMixedChart() {
  const { highcharts, settings, setSettings, chartStateProps } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...chartStateProps}
      height={379}
      ariaLabel="Mixed bar chart"
      series={mixedChartSeries}
      tooltip={{
        series: (detail) => {
          switch (detail.type) {
            case "point":
              return {
                key: detail.series.name,
                value: (
                  <Link
                    external={true}
                    href="#"
                    ariaLabel={`See details for ${moneyFormatter(detail.y)} on ${detail.series.name} (opens in a new tab)`}
                  >
                    {moneyFormatter(detail.y)}
                  </Link>
                ),
              };
            default:
              return { key: "?", value: "?" };
          }
        },
      }}
      xAxis={{
        type: "category",
        title: "Budget month",
        categories: ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"],
        min: 0,
        max: 6,
      }}
      yAxis={{
        title: "Costs (USD)",
        min: 0,
        max: 20000,
        valueFormatter: numberFormatter,
      }}
      visibleSeries={settings.visibleContent}
      onToggleVisibleSeries={({ detail: { visibleSeries } }) => setSettings({ visibleContent: visibleSeries })}
      emphasizeBaselineAxis={settings.emphasizeBaselineAxis}
    />
  );
}

function ExamplePieChart() {
  const { highcharts, settings, setSettings, chartStateProps } = usePageSettings();
  return (
    <PieChart
      highcharts={highcharts}
      {...chartStateProps}
      height={500}
      ariaLabel="Pie chart"
      series={pieChartSeries}
      tooltip={{
        body(details) {
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                <Box variant="span">Value</Box>
                <Box variant="span">{details.segmentValue}</Box>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                <Box variant="span">Percentage</Box>
                <Box variant="span">{`${((details.segmentValue / details.totalValue) * 100).toFixed(0)}%`}</Box>
              </div>
            </div>
          );
        },
      }}
      segmentOptions={{
        description: ({ segmentValue, totalValue }) =>
          `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
      }}
      visibleSegments={settings.visibleContent}
      onChangeVisibleSegments={({ detail: { visibleSegments } }) => setSettings({ visibleContent: visibleSegments })}
    />
  );
}

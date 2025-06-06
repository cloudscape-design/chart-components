// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, SeriesFilter, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  visibleItems: string;
}

const mixedChartSeries: CartesianChartProps.SeriesOptions[] = [
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
    type: "x-threshold",
    id: "Peak cost",
    name: "Peak cost",
    value: 3,
  },
  {
    type: "y-threshold",
    id: "Budget",
    name: "Budget",
    value: 12000,
  },
];

const defaultVisibleItems = "Costs,Costs last year,Peak cost";

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const visibleSeries = (settings.visibleItems ?? defaultVisibleItems).split(",");
  return (
    <Page
      title="Visibility API"
      subtitle="This page demonstrates controllable series visibility API that allows to make series visible or hidden
        programmatically."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            {
              content: (
                <SeriesFilter
                  allSeries={["Costs", "Costs last year", "Peak cost", "Budget"]}
                  visibleSeries={visibleSeries}
                  onVisibleSeriesChange={(visibleSeries) => setSettings({ visibleItems: visibleSeries.join(",") })}
                />
              ),
            },
          ]}
        />
      }
    >
      <PageSection title="Mixed chart">
        <ExampleMixedChart />
      </PageSection>
    </Page>
  );
}

function ExampleMixedChart() {
  const { settings, setSettings, chartProps } = useChartSettings<ThisPageSettings>();
  const visibleSeries = (settings.visibleItems ?? defaultVisibleItems).split(",");
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={379}
      ariaLabel="Mixed bar chart"
      series={mixedChartSeries}
      tooltip={{
        point: ({ item }) => {
          return {
            key: item.series.name,
            value: (
              <Link external={true} href="#" ariaLabel={`See details for ${item.series.name} (opens in a new tab)`}>
                {item.y !== null ? moneyFormatter(item.y) : null}
              </Link>
            ),
          };
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
      visibleSeries={visibleSeries}
      onChangeVisibleSeries={({ detail: { visibleSeries } }) => setSettings({ visibleItems: visibleSeries.join(",") })}
      emphasizeBaseline={settings.emphasizeBaseline}
    />
  );
}

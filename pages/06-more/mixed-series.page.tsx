// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter, numberFormatter, priceFormatter } from "../common/formatters";
import { PageSettings, SeriesSelector, usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  selectedSeries: string;
}

const allSeries: CartesianChartProps.Series[] = [
  {
    name: "column-1",
    type: "column",
    data: [34503, 25832, 4012, -5602, 17839],
  },
  {
    name: "bar-1",
    type: "column",
    data: [23500, 24000, null, 17000, null],
  },
  {
    name: "line-1",
    type: "line",
    data: [25000, 28000, -4000, 9000, 10000],
  },
  {
    name: "area-1",
    type: "area",
    data: [25555, 28888, -4444, 9999, 11111],
  },
  {
    type: "x-threshold",
    id: "x-threshold-1",
    name: "x-threshold-1",
    value: 2,
  },
  {
    type: "y-threshold",
    id: "y-threshold-1",
    name: "y-threshold-1",
    value: 19104,
  },
];

const seriesOptions = allSeries.map((s) => s.name);

const defaultSelectedSeries = "column-1";

export default function () {
  const { settings, setSettings } = usePageSettings<ThisPageSettings>();
  const selectedSeries = (settings.selectedSeries ?? defaultSelectedSeries).split(",");
  return (
    <Page
      title="Mixing series demo"
      subtitle="The page demonstrates how chart series can be combined together. Some series while can be combined
            technically, do not provide a reasonable user experience and/or cause performance issues."
      settings={
        <SeriesSelector
          allSeries={seriesOptions}
          selectedSeries={selectedSeries}
          onSelectedSeriesChange={(selectedSeries) => setSettings({ selectedSeries: selectedSeries.join(",") })}
        />
      }
    >
      <PageSection>
        <ExampleMixedChart />
      </PageSection>
    </Page>
  );
}

function ExampleMixedChart() {
  const { settings, chartProps } = usePageSettings<ThisPageSettings>();
  const selectedSeries = (settings.selectedSeries ?? defaultSelectedSeries).split(",");
  const series = getSelected(allSeries, selectedSeries);
  return (
    <CartesianChart
      {...chartProps}
      chartHeight={423}
      inverted={series.some((s) => s.name.startsWith("bar"))}
      ariaLabel="Mixed series chart"
      series={series}
      tooltip={{
        series(detail) {
          switch (detail.type) {
            case "point":
              return { key: detail.series.name, value: priceFormatter(detail.y) };
            default:
              return { key: "?", value: "?" };
          }
        },
      }}
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
      yAxis={{
        title: "Revenue (USD)",
        min: -10000,
        max: 40000,
        valueFormatter: numberFormatter,
      }}
    />
  );
}

function getSelected<T extends CartesianChartProps.Series>(series: T[], selectedSeries: string[]) {
  const seriesToIndex = selectedSeries.reduce((map, s, index) => map.set(s, index), new Map<string, number>());
  return series
    .filter((s) => selectedSeries.includes(s.name))
    .sort((a, b) => seriesToIndex.get(a.name)! - seriesToIndex.get(b.name)!);
}

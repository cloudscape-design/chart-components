// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BarChart, { BarChartProps } from "@cloudscape-design/components/bar-chart";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { usePageSettings } from "../../common/page-settings";

const domain = [
  new Date(1601071200000),
  new Date(1601078400000),
  new Date(1601085600000),
  new Date(1601092800000),
  new Date(1601100000000),
];

const series = [
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
] as const;

const seriesNew: CartesianChartProps.Series[] = series.map((s) => ({ ...s, data: [...s.data] }));

const seriesOld: BarChartProps<Date>["series"] = series.map((s) => ({
  title: s.name,
  type: "bar",
  data: s.data.map((y, index) => ({ x: domain[index], y })),
}));

export function ComponentNew() {
  const { chartProps } = usePageSettings();
  return (
    <CartesianChart
      {...chartProps}
      fitHeight={true}
      chartMinHeight={200}
      ariaLabel="Stacked bar chart"
      plotOptions={{ series: { stacking: "normal" } }}
      series={seriesNew}
      xAxis={{
        type: "category",
        title: "Time (UTC)",
        categories: domain.map((date) => dateFormatter(date.getTime())),
      }}
      yAxis={{ title: "Error count", min: 0, max: 50 }}
    />
  );
}

export function ComponentOld() {
  const { chartProps } = usePageSettings();
  return (
    <BarChart
      fitHeight={true}
      hideFilter={true}
      height={200}
      series={seriesOld}
      xDomain={domain}
      yDomain={[0, 50]}
      i18nStrings={{
        xTickFormatter: (value) => dateFormatter(value.getTime()),
      }}
      ariaLabel="Stacked bar chart"
      stackedBars={true}
      xTitle="Time (UTC)"
      yTitle="Error count"
      noMatch={chartProps.noData.noMatch}
    />
  );
}

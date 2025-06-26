// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BarChart, { BarChartProps } from "@cloudscape-design/components/bar-chart";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

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
    data: [22, 28, 25, 13, 28],
  },
  {
    name: "Moderate",
    type: "column",
    data: [18, 21, 22, 0, 1],
  },
  {
    name: "Low",
    type: "column",
    data: [17, 19, 18, 17, 15],
  },
  {
    name: "Unclassified",
    type: "column",
    data: [24, 18, 16, 14, 16],
  },
] as const;

const seriesNew: CartesianChartProps.SeriesOptions[] = series.map((s) => ({ ...s, data: [...s.data] }));

const seriesOld: BarChartProps<Date>["series"] = series.map((s) => ({
  title: s.name,
  type: "bar",
  data: s.data.map((y, index) => ({ x: domain[index], y })),
}));

export function ComponentNew({
  single,
  stacking,
  inverted,
}: {
  single?: boolean;
  stacking?: boolean;
  inverted?: boolean;
}) {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      fitHeight={true}
      chartMinHeight={100}
      ariaLabel="Bar chart"
      inverted={inverted}
      stacking={stacking ? "normal" : undefined}
      series={single ? seriesNew.slice(1, 2) : seriesNew}
      xAxis={{
        type: "category",
        title: "Time (UTC)",
        categories: domain.map((date) => dateFormatter(date.getTime())),
      }}
      yAxis={{ title: "Error count" }}
      tooltip={{ placement: "outside" }}
    />
  );
}

export function ComponentOld({
  single,
  stacking,
  inverted,
}: {
  single?: boolean;
  stacking?: boolean;
  inverted?: boolean;
}) {
  const { chartProps } = useChartSettings();
  return (
    <BarChart
      fitHeight={true}
      hideFilter={true}
      height={100}
      series={single ? seriesOld.slice(1, 2) : seriesOld}
      xDomain={domain}
      i18nStrings={{
        xTickFormatter: (value) => dateFormatter(value.getTime()),
      }}
      ariaLabel="Bar chart"
      stackedBars={stacking}
      horizontalBars={inverted}
      xTitle="Time (UTC)"
      yTitle="Error count"
      noMatch={chartProps.cartesian.noData!.noMatch}
    />
  );
}

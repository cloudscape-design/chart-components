// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MixedLineBarChart, { MixedLineBarChartProps } from "@cloudscape-design/components/mixed-line-bar-chart";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { numberFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

const domain = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];

const seriesNew: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
  },
  {
    name: "Costs last year",
    type: "line",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
  },
  {
    type: "x-threshold",
    name: "Peak cost",
    value: 3,
  },
  {
    type: "y-threshold",
    name: "Budget",
    value: 12000,
  },
];

const seriesOld: MixedLineBarChartProps<string>["series"] = [
  {
    title: "Costs",
    type: "bar",
    data: [
      { x: "Jun 2019", y: 6562 },
      { x: "Jul 2019", y: 8768 },
      { x: "Aug 2019", y: 9742 },
      { x: "Sep 2019", y: 10464 },
      { x: "Oct 2019", y: 16777 },
      { x: "Nov 2019", y: 9956 },
      { x: "Dec 2019", y: 5876 },
    ],
  },
  {
    title: "Costs last year",
    type: "line",
    data: [
      { x: "Jun 2019", y: 5373 },
      { x: "Jul 2019", y: 7563 },
      { x: "Aug 2019", y: 7900 },
      { x: "Sep 2019", y: 12342 },
      { x: "Oct 2019", y: 14311 },
      { x: "Nov 2019", y: 11830 },
      { x: "Dec 2019", y: 8505 },
    ],
  },
  {
    type: "threshold",
    title: "Peak cost",
    x: "Sep 2019",
  },
  {
    type: "threshold",
    title: "Budget",
    y: 12000,
  },
];

export function ComponentNew() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      fitHeight={true}
      chartMinHeight={200}
      ariaLabel="Mixed chart"
      series={seriesNew}
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
      tooltip={{}}
    />
  );
}

export function ComponentOld({ hideFilter = false }: { hideFilter?: boolean }) {
  const { chartProps } = useChartSettings();
  return (
    <MixedLineBarChart
      fitHeight={true}
      hideFilter={hideFilter}
      height={200}
      series={seriesOld}
      xDomain={domain}
      yDomain={[0, 20000]}
      ariaLabel="Mixed chart"
      xScaleType="categorical"
      xTitle="Budget month"
      yTitle="Costs (USD)"
      noMatch={chartProps.cartesian.noData!.noMatch}
    />
  );
}

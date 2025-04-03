// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import OldPieChart, { PieChartProps as OldPieChartProps } from "@cloudscape-design/components/pie-chart";

import { PieChart, PieChartProps } from "../../../lib/components";
import { usePageSettings } from "../../common/page-settings";

const seriesNew: PieChartProps.Series = {
  name: "Resource count",
  type: "pie",
  data: [
    {
      name: "Running",
      y: 60,
    },
    {
      name: "Failed",
      y: 30,
    },
    {
      name: "In-progress",
      y: 10,
    },
    {
      name: "Pending",
      y: null,
    },
  ],
};

const dataOld: OldPieChartProps["data"] = [
  {
    title: "Running",
    value: 60,
  },
  {
    title: "Failed",
    value: 30,
  },
  {
    title: "In-progress",
    value: 10,
  },
  {
    title: "Pending",
    value: 0,
  },
];

export function ComponentNew() {
  const { highcharts, chartStateProps } = usePageSettings();
  return (
    <PieChart
      highcharts={highcharts}
      {...chartStateProps}
      fitHeight={true}
      chartMinHeight={200}
      ariaLabel="Pie chart"
      series={seriesNew}
      segmentOptions={{}}
    />
  );
}

export function ComponentOld({ hideFilter = false }: { hideFilter?: boolean }) {
  const { chartStateProps } = usePageSettings();
  return (
    <OldPieChart
      fitHeight={true}
      hideFilter={hideFilter}
      size="small"
      data={dataOld}
      ariaLabel="Pie chart"
      noMatch={chartStateProps.noData.noMatch}
    />
  );
}

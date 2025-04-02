// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import OldPieChart, { PieChartProps as OldPieChartProps } from "@cloudscape-design/components/pie-chart";

import { PieChart, PieChartProps } from "../../../lib/components";
import { usePageSettings } from "../../common/page-settings";

const seriesNew: PieChartProps.Series = {
  name: "Resource count",
  type: "pie",
  data: [
    { name: "Running", y: 60 },
    { name: "Failed", y: 40 },
  ],
};
const seriesNewNoData: PieChartProps.Series = {
  name: "Resource count",
  type: "pie",
  data: [
    { name: "Running", y: null },
    { name: "Failed", y: null },
  ],
};
const dataOld: OldPieChartProps["data"] = [
  { title: "Running", value: 60 },
  { title: "Failed", value: 40 },
];
const dataOldEmpty: OldPieChartProps["data"] = [
  { title: "Running", value: 0 },
  { title: "Failed", value: 0 },
];

interface ComponentProps {
  statusType: "loading" | "error" | "finished";
  hideSeries?: boolean;
  series: "none" | "empty" | "data";
}

export function ComponentNew({ statusType, series, hideSeries }: ComponentProps) {
  const { highcharts, chartStateProps } = usePageSettings();
  return (
    <PieChart
      highcharts={highcharts}
      noData={{ ...chartStateProps.noData, statusType }}
      fitHeight={true}
      chartMinHeight={150}
      ariaLabel="Pie chart"
      series={{ none: null, empty: seriesNewNoData, data: seriesNew }[series]}
      visibleSegments={hideSeries ? [] : undefined}
    />
  );
}

export function ComponentOld({ statusType, series, hideSeries }: ComponentProps) {
  const { chartStateProps } = usePageSettings();
  return (
    <OldPieChart
      fitHeight={true}
      hideFilter={true}
      size="small"
      data={{ none: [], empty: dataOldEmpty, data: dataOld }[series]}
      visibleSegments={hideSeries ? [] : undefined}
      ariaLabel="Pie chart"
      {...chartStateProps.noData}
      onRecoveryClick={() => {}}
      statusType={statusType}
    />
  );
}

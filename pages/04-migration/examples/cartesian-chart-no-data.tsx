// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LineChart, { LineChartProps } from "@cloudscape-design/components/line-chart";

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

const seriesNew: CartesianChartProps.SeriesOptions[] = [
  { name: "Events", type: "line", data: [2, 4, 6, 8, 16].map((y, index) => ({ x: domain[index].getTime(), y })) },
];

const seriesNewNoData: CartesianChartProps.SeriesOptions[] = [{ name: "Events", type: "line", data: [] }];

const seriesNewThreshold: CartesianChartProps.SeriesOptions[] = [
  { name: "Timestamp", type: "x-threshold", value: domain[2].getTime() },
  { name: "Alarm", type: "y-threshold", value: 30 },
];

const seriesOld: LineChartProps<Date>["series"] = [
  { title: "Events", type: "line", data: [2, 4, 6, 8, 16].map((y, index) => ({ x: domain[index], y })) },
];

const seriesOldNoData: LineChartProps<Date>["series"] = [{ title: "Events", type: "line", data: [] }];

const seriesOldThreshold: LineChartProps<Date>["series"] = [
  { title: "Timestamp", type: "threshold", x: domain[2] },
  { title: "Alarm", type: "threshold", y: 30 },
];

interface ComponentProps {
  statusType: "loading" | "error" | "finished";
  series: "none" | "empty" | "threshold" | "data";
  hideSeries?: boolean;
}

export function ComponentNew({ statusType, series, hideSeries }: ComponentProps) {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      noData={{ ...chartProps.cartesian.noData, statusType }}
      fitHeight={true}
      chartMinHeight={150}
      ariaLabel="Line chart"
      stacking="normal"
      series={{ none: [], empty: seriesNewNoData, threshold: seriesNewThreshold, data: seriesNew }[series]}
      visibleSeries={hideSeries ? [] : undefined}
      xAxis={{
        type: "datetime",
        title: "Time (UTC)",
        min: domain[0].getTime(),
        max: domain[domain.length - 1].getTime(),
        valueFormatter: dateFormatter,
      }}
      yAxis={{ title: "Error count", min: 0, max: 50 }}
    />
  );
}

export function ComponentOld({ statusType, series, hideSeries }: ComponentProps) {
  const { chartProps } = useChartSettings();
  return (
    <LineChart
      fitHeight={true}
      hideFilter={true}
      height={150}
      series={{ none: [], empty: seriesOldNoData, threshold: seriesOldThreshold, data: seriesOld }[series]}
      visibleSeries={hideSeries ? [] : undefined}
      xDomain={[domain[0], domain[domain.length - 1]]}
      yDomain={[0, 50]}
      i18nStrings={{
        xTickFormatter: (value) => dateFormatter(value.getTime()),
      }}
      ariaLabel="Line chart"
      xScaleType="time"
      xTitle="Time (UTC)"
      yTitle="Error count"
      {...chartProps.cartesian.noData}
      onRecoveryClick={() => {}}
      statusType={statusType}
    />
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LineChart, { LineChartProps } from "@cloudscape-design/components/line-chart";

import { CartesianChartProps } from "../../../lib/components";
import { InternalCartesianChart } from "../../../lib/components/cartesian-chart/chart-cartesian-internal";
import { dateFormatter } from "../../common/formatters";
import { usePageSettings } from "../../common/page-settings";

const domain = [
  new Date(1600984800000),
  new Date(1600985700000),
  new Date(1600986600000),
  new Date(1600987500000),
  new Date(1600988400000),
  new Date(1600989300000),
  new Date(1600990200000),
  new Date(1600991100000),
  new Date(1600992000000),
  new Date(1600992900000),
  new Date(1600993800000),
  new Date(1600994700000),
  new Date(1600995600000),
  new Date(1600996500000),
  new Date(1600997400000),
  new Date(1600998300000),
  new Date(1600999200000),
  new Date(1601000100000),
  new Date(1601001000000),
  new Date(1601001900000),
  new Date(1601002800000),
  new Date(1601003700000),
  new Date(1601004600000),
  new Date(1601005500000),
  new Date(1601006400000),
  new Date(1601007300000),
  new Date(1601008200000),
  new Date(1601009100000),
  new Date(1601010000000),
  new Date(1601010900000),
  new Date(1601011800000),
  new Date(1601012700000),
  new Date(1601013600000),
];
const site1Data = [
  58020, 102402, 104920, 94031, 125021, 159219, 193082, 162592, 274021, 264286, 289210, 256362, 257306, 186776, 294020,
  385975, 486039, 490447, 361845, 339058, 298028, 231902, 224558, 253901, 102839, 234943, 204405, 190391, 183570,
  162592, 148910, 229492, 293910,
];
const site2Data = [
  151023, 169975, 176980, 168852, 149130, 147299, 169552, 163401, 154091, 199516, 195503, 189953, 181635, 192975,
  205951, 218958, 220516, 213557, 165899, 173557, 172331, 186492, 131541, 142262, 194091, 185899, 173401, 171635,
  179130, 185951, 144091, 152975, 157299,
];

const seriesNew: CartesianChartProps.Series[] = [
  {
    name: "Site 1",
    type: "line",
    data: site1Data.map((y, index) => ({ x: domain[index].getTime(), y })),
  },
  {
    name: "Site 2",
    type: "line",
    data: site2Data.map((y, index) => ({ x: domain[index].getTime(), y })),
  },
  {
    type: "awsui-y-threshold",
    name: "Performance goal",
    value: 250000,
  },
];

const seriesOld: LineChartProps<Date>["series"] = [
  {
    title: "Site 1",
    type: "line",
    data: site1Data.map((y, index) => ({ x: domain[index], y })),
  },
  {
    title: "Site 2",
    type: "line",
    data: site2Data.map((y, index) => ({ x: domain[index], y })),
  },
  {
    type: "threshold",
    title: "Performance goal",
    y: 250000,
  },
];

export function ComponentNew({ preferencesFilter }: { preferencesFilter?: boolean }) {
  const { chartProps } = usePageSettings();
  return (
    <InternalCartesianChart
      {...chartProps}
      fitHeight={true}
      chartMinHeight={200}
      options={{
        lang: { accessibility: { chartContainerLabel: "Line chart" } },
        series: seriesNew,
        xAxis: [
          {
            type: "datetime",
            title: "Time (UTC)",
            min: domain[0].getTime(),
            max: domain[domain.length - 1].getTime(),
            valueFormatter: dateFormatter,
          },
        ],
        yAxis: [{ title: "Bytes transferred", min: 0, max: 500000 }],
        plotOptions: { series: { marker: { enabled: false } } },
      }}
      legend={{
        ...chartProps.legend,
        preferences: preferencesFilter
          ? {
              itemDisplayPreference: true,
              onApply: () => {},
            }
          : undefined,
      }}
      tooltip={{
        ...chartProps.tooltip,
        placement: "middle",
      }}
    />
  );
}

export function ComponentOld({ hideFilter = false }: { hideFilter?: boolean }) {
  const { chartProps } = usePageSettings();
  return (
    <LineChart
      fitHeight={true}
      hideFilter={hideFilter}
      height={200}
      series={seriesOld}
      xDomain={[domain[0], domain[domain.length - 1]]}
      yDomain={[0, 500000]}
      i18nStrings={{
        xTickFormatter: (value) => dateFormatter(value.getTime()),
      }}
      ariaLabel="Line chart"
      xScaleType="time"
      xTitle="Time (UTC)"
      yTitle="Bytes transferred"
      noMatch={chartProps.noData.noMatch}
    />
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AreaChart, { AreaChartProps } from "@cloudscape-design/components/area-chart";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter, numberFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

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
];
const network1Data = [
  114489, 136935, 141026, 123288, 121956, 119868, 132326, 126879, 138543, 144309, 121118, 113430, 135911, 113126,
  119538, 124338, 133884, 135473, 131187, 136176, 144422, 115392, 139307, 128517, 107160, 110283, 134513, 111311,
  142686, 130652, 149418, 121923,
];
const network2Data = [
  126623, 147035, 136488, 149778, 126710, 107964, 131969, 147045, 122661, 112436, 133167, 96558, 122246, 99248, 144693,
  149547, 125133, 124845, 102768, 90708, 116681, 133457, 111090, 104931, 133434, 135491, 101198, 93306, 103043, 138810,
  113219, 142304,
];
const network3Data = [
  10413, 26582, 45593, 65918, 76223, 62385, 83330, 127209, 104802, 145899, 121375, 112968, 145263, 139562, 128343,
  122774, 145396, 176509, 201006, 196538, 213773, 205076, 216369, 159386, 238852, 207500, 187110, 314165, 165653,
  175584, 230042, 293879,
];

const seriesNew: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Network 1",
    type: "area",
    data: network1Data.map((y, index) => ({ x: domain[index].getTime(), y })),
  },
  {
    name: "Network 2",
    type: "area",
    data: network2Data.map((y, index) => ({ x: domain[index].getTime(), y })),
  },
  {
    name: "Network 3",
    type: "area",
    data: network3Data.map((y, index) => ({ x: domain[index].getTime(), y })),
  },
  {
    type: "y-threshold",
    name: "Target",
    value: 350000,
  },
];

const seriesOld: AreaChartProps<Date>["series"] = [
  {
    title: "Network 1",
    type: "area",
    data: network1Data.map((y, index) => ({ x: domain[index], y })),
  },
  {
    title: "Network 2",
    type: "area",
    data: network2Data.map((y, index) => ({ x: domain[index], y })),
  },
  {
    title: "Network 3",
    type: "area",
    data: network3Data.map((y, index) => ({ x: domain[index], y })),
  },
  {
    type: "threshold",
    title: "Target",
    y: 350000,
  },
];

export function ComponentNew() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      fitHeight={true}
      chartMinHeight={100}
      ariaLabel="Area chart"
      series={seriesNew}
      stacking="normal"
      xAxis={{
        type: "datetime",
        title: "Time (UTC)",
        min: domain[0].getTime(),
        max: domain[domain.length - 1].getTime(),
        valueFormatter: dateFormatter,
      }}
      tooltip={{
        placement: "middle",
        footer(detail) {
          return (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>Total</span>
              <span>{numberFormatter(detail.items.reduce((sum, item) => sum + (item.y ?? 0), 0))}</span>
            </div>
          );
        },
      }}
      yAxis={{ title: "Bytes transferred", min: 0, max: 600000 }}
    />
  );
}

export function ComponentOld({ hideFilter = false }: { hideFilter?: boolean }) {
  const { chartProps } = useChartSettings();
  return (
    <AreaChart
      fitHeight={true}
      hideFilter={hideFilter}
      height={100}
      series={seriesOld}
      xDomain={[domain[0], domain[domain.length - 1]]}
      yDomain={[0, 600000]}
      i18nStrings={{
        xTickFormatter: (value) => dateFormatter(value.getTime()),
      }}
      yTickFormatter={numberFormatter}
      ariaLabel="Area chart"
      xScaleType="time"
      xTitle="Time (UTC)"
      yTitle="Bytes transferred"
      noMatch={chartProps.cartesian.noData!.noMatch}
    />
  );
}

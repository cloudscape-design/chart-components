// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter, numberFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";
import { PageSection } from "../../common/templates";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Network 1",
    type: "area",
    data: [
      { x: 1600984800000, y: 114489 },
      { x: 1600985700000, y: 136935 },
      { x: 1600986600000, y: 141026 },
      { x: 1600987500000, y: 123288 },
      { x: 1600988400000, y: 121956 },
      { x: 1600989300000, y: 119868 },
      { x: 1600990200000, y: 132326 },
      { x: 1600991100000, y: 126879 },
      { x: 1600992000000, y: 138543 },
      { x: 1600992900000, y: 144309 },
      { x: 1600993800000, y: 121118 },
      { x: 1600994700000, y: 113430 },
      { x: 1600995600000, y: 135911 },
      { x: 1600996500000, y: 113126 },
      { x: 1600997400000, y: 119538 },
      { x: 1600998300000, y: 124338 },
      { x: 1600999200000, y: 133884 },
      { x: 1601000100000, y: 135473 },
      { x: 1601001000000, y: 131187 },
      { x: 1601001900000, y: 136176 },
      { x: 1601002800000, y: 144422 },
      { x: 1601003700000, y: 115392 },
      { x: 1601004600000, y: 139307 },
      { x: 1601005500000, y: 128517 },
      { x: 1601006400000, y: 107160 },
      { x: 1601007300000, y: 110283 },
      { x: 1601008200000, y: 134513 },
      { x: 1601009100000, y: 111311 },
      { x: 1601010000000, y: 142686 },
      { x: 1601010900000, y: 130652 },
      { x: 1601011800000, y: 149418 },
      { x: 1601012700000, y: 121923 },
    ],
  },
  {
    name: "Network 2",
    type: "area",
    data: [
      { x: 1600984800000, y: 126623 },
      { x: 1600985700000, y: 147035 },
      { x: 1600986600000, y: 136488 },
      { x: 1600987500000, y: 149778 },
      { x: 1600988400000, y: 126710 },
      { x: 1600989300000, y: 107964 },
      { x: 1600990200000, y: 131969 },
      { x: 1600991100000, y: 147045 },
      { x: 1600992000000, y: 122661 },
      { x: 1600992900000, y: 112436 },
      { x: 1600993800000, y: 133167 },
      { x: 1600994700000, y: 96558 },
      { x: 1600995600000, y: 122246 },
      { x: 1600996500000, y: 99248 },
      { x: 1600997400000, y: 144693 },
      { x: 1600998300000, y: 149547 },
      { x: 1600999200000, y: 125133 },
      { x: 1601000100000, y: 124845 },
      { x: 1601001000000, y: 102768 },
      { x: 1601001900000, y: 90708 },
      { x: 1601002800000, y: 116681 },
      { x: 1601003700000, y: 133457 },
      { x: 1601004600000, y: 111090 },
      { x: 1601005500000, y: 104931 },
      { x: 1601006400000, y: 133434 },
      { x: 1601007300000, y: 135491 },
      { x: 1601008200000, y: 101198 },
      { x: 1601009100000, y: 93306 },
      { x: 1601010000000, y: 103043 },
      { x: 1601010900000, y: 138810 },
      { x: 1601011800000, y: 113219 },
      { x: 1601012700000, y: 142304 },
    ],
  },
  {
    name: "Network 3",
    type: "area",
    data: [
      { x: 1600984800000, y: 10413 },
      { x: 1600985700000, y: 26582 },
      { x: 1600986600000, y: 45593 },
      { x: 1600987500000, y: 65918 },
      { x: 1600988400000, y: 76223 },
      { x: 1600989300000, y: 62385 },
      { x: 1600990200000, y: 83330 },
      { x: 1600991100000, y: 127209 },
      { x: 1600992000000, y: 104802 },
      { x: 1600992900000, y: 145899 },
      { x: 1600993800000, y: 121375 },
      { x: 1600994700000, y: 112968 },
      { x: 1600995600000, y: 145263 },
      { x: 1600996500000, y: 139562 },
      { x: 1600997400000, y: 128343 },
      { x: 1600998300000, y: 122774 },
      { x: 1600999200000, y: 145396 },
      { x: 1601000100000, y: 176509 },
      { x: 1601001000000, y: 201006 },
      { x: 1601001900000, y: 196538 },
      { x: 1601002800000, y: 213773 },
      { x: 1601003700000, y: 205076 },
      { x: 1601004600000, y: 216369 },
      { x: 1601005500000, y: 159386 },
      { x: 1601006400000, y: 238852 },
      { x: 1601007300000, y: 207500 },
      { x: 1601008200000, y: 187110 },
      { x: 1601009100000, y: 314165 },
      { x: 1601010000000, y: 165653 },
      { x: 1601010900000, y: 175584 },
      { x: 1601011800000, y: 230042 },
      { x: 1601012700000, y: 293879 },
    ],
  },
  {
    type: "y-threshold",
    name: "Target",
    value: 350000,
  },
];

export function ExampleAreaChartStackedAreaChartWithThreshold() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <PageSection
      title="Area chart: Stacked area chart, with threshold"
      subtitle={
        <Link href="https://cloudscape.aws.dev/components/area-chart?tabId=playground&example=stacked-area-chart%2C-with-threshold">
          compare with the website playground example
        </Link>
      }
    >
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={379}
        ariaLabel="Stacked area chart, with threshold"
        stacking="normal"
        series={isEmpty ? [] : series}
        tooltip={{
          ...chartProps.cartesian.tooltip,
          footer: ({ x }) => {
            const total = findY(x as number, series[0])! + findY(x as number, series[1])!;
            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Total</span>
                <span>{numberFormatter(total)}</span>
              </div>
            );
          },
        }}
        xAxis={{
          type: "datetime",
          title: "Time (UTC)",
          min: 1600984800000,
          max: 1601012700000,
          valueFormatter: dateFormatter,
        }}
        yAxis={{
          title: "Bytes transferred",
          min: 0,
          max: 600000,
          valueFormatter: numberFormatter,
        }}
      />
    </PageSection>
  );
}

function findY(x: number, series: CartesianChartProps.SeriesOptions) {
  if (!("data" in series)) {
    return null;
  }
  for (const d of series.data) {
    if (d && typeof d === "object" && "x" in d && d.x === x) {
      return (d as any).y;
    }
  }
  return null;
}

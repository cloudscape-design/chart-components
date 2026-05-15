// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SpaceBetween from "@cloudscape-design/components/space-between";
import { colorChartsThresholdNegative, colorChartsThresholdNeutral } from "@cloudscape-design/design-tokens";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const data1 = [
  { x: 1600984800000, y: 58020 },
  { x: 1600985700000, y: 102402 },
  { x: 1600986600000, y: 104920 },
  { x: 1600987500000, y: 94031 },
  { x: 1600988400000, y: 125021 },
  { x: 1600989300000, y: 159219 },
  { x: 1600990200000, y: 193082 },
  { x: 1600991100000, y: 162592 },
  { x: 1600992000000, y: 274021 },
  { x: 1600992900000, y: 264286 },
  { x: 1600993800000, y: 289210 },
  { x: 1600994700000, y: 256362 },
  { x: 1600995600000, y: 257306 },
  { x: 1600996500000, y: 186776 },
  { x: 1600997400000, y: 294020 },
  { x: 1600998300000, y: 385975 },
  { x: 1600999200000, y: 486039 },
  { x: 1601000100000, y: 490447 },
  { x: 1601001000000, y: 361845 },
  { x: 1601001900000, y: 339058 },
  { x: 1601002800000, y: 298028 },
  { x: 1601003700000, y: 231902 },
  { x: 1601004600000, y: 364558 },
  { x: 1601005500000, y: 413901 },
  { x: 1601006400000, y: 432839 },
  { x: 1601007300000, y: 464943 },
  { x: 1601008200000, y: 464405 },
  { x: 1601009100000, y: 490391 },
  { x: 1601010000000, y: 513570 },
  { x: 1601010900000, y: 552592 },
  { x: 1601011800000, y: 538910 },
  { x: 1601012700000, y: 599492 },
  { x: 1601013600000, y: 643910 },
];
const data2 = data1.map(({ x, y }) => ({ x, y: y + 10_000 + pseudoRandom() * 100_000 }));

export default function () {
  const { chartProps } = useChartSettings();

  const xyzZones: CartesianChartProps.SeriesZone[] = [
    { value: 1601004100000, dashStyle: "Solid" },
    { value: undefined, dashStyle: "Dash" },
  ];

  const performanceZones: CartesianChartProps.SeriesZone[] = [
    { value: 250000, color: colorChartsThresholdNegative, dashStyle: "Dash" },
    { value: undefined, dashStyle: "Solid" },
  ];

  return (
    <Page title="Zoned series demo" subtitle="Zoned series can have different style based on X or Y thresholds.">
      <SpaceBetween size="m">
        <CartesianChart
          {...chartProps.cartesian}
          ariaLabel="Line chart with x-zoned series"
          series={[
            { name: "Site 1", type: "spline", data: data1, zoneAxis: "x", zones: xyzZones },
            { name: "Site 2", type: "spline", data: data2, zoneAxis: "x", zones: xyzZones },
            { type: "x-threshold", name: "XYZ deployed", color: colorChartsThresholdNeutral, value: 1601004100000 },
          ]}
          xAxis={{ type: "datetime", title: "Time (UTC)", min: 1600984800000, max: 1601013600000 }}
          yAxis={{ title: "Bytes transferred", min: 0, max: 650000 }}
        />
        <CartesianChart
          {...chartProps.cartesian}
          ariaLabel="Line chart withy-zoned series"
          series={[
            { name: "Site 1", type: "spline", data: data1, zoneAxis: "y", zones: performanceZones },
            { name: "Site 2", type: "spline", data: data2, zoneAxis: "y", zones: performanceZones },
            { type: "y-threshold", name: "Performance goal", color: colorChartsThresholdNegative, value: 250000 },
          ]}
          xAxis={{ type: "datetime", title: "Time (UTC)", min: 1600984800000, max: 1601013600000 }}
          yAxis={{ title: "Bytes transferred", min: 0, max: 650000 }}
        />
      </SpaceBetween>
    </Page>
  );
}

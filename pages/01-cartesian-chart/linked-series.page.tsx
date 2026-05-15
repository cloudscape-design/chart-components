// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart } from "../../lib/components";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const data = [
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
  { x: 1601004600000, y: 224558 },
];

const dataProjected = data.map(({ x, y }) => ({ x, y: y + pseudoRandom() * 50000 }));

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page
      title="Linked series demo"
      subtitle="Linked series are not represented in the filter or legend, but visible in the tooltip."
    >
      <CartesianChart
        {...chartProps.cartesian}
        ariaLabel="Line chart with linked series"
        series={[
          { type: "y-threshold", name: "Performance goal", value: 250000 },
          { name: "Site 1", type: "spline", data: data },
          { name: "Site 1 peak", linkedTo: ":previous", type: "spline", dashStyle: "Dash", data: dataProjected },
        ]}
        xAxis={{ type: "datetime", title: "Time (UTC)", min: 1600984800000, max: 1601004600000 }}
        yAxis={{ title: "Bytes transferred", min: 0, max: 600000 }}
        filter={{ seriesFilter: true }}
        tooltip={{
          point: ({ item }) => {
            const seriesName = item.series.name;
            return { key: seriesName === "Site 1" ? "Site 1 avg" : seriesName };
          },
        }}
      />
    </Page>
  );
}

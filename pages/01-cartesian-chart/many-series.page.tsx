// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const loremIpsum =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris congue aliquet feugiat. Integer gravida efficitur elementum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Curabitur et nisi iaculis diam laoreet pharetra. Phasellus nec nibh dapibus, feugiat leo sodales, feugiat mi. Vivamus a orci mattis, fringilla nisl et, pretium metus. Nunc leo nisi, blandit et sodales ut, sodales id leo. Vestibulum consectetur ante et sapien pretium vestibulum. Donec cursus arcu vitae nunc convallis molestie. Nunc est elit, maximus eu odio eget, commodo fermentum felis. Nullam sit amet sem lectus. Quisque eu rhoncus libero, nec lacinia ipsum. Mauris libero nulla, placerat vitae nisi et, luctus placerat turpis. Donec vitae faucibus neque, eu accumsan enim. Cras nec arcu lacus. Aenean vehicula, mauris in vestibulum maximus, sem nisi rutrum mi, in lobortis lorem elit quis est.";

export default function () {
  return (
    <Page
      title="Legend demo"
      subtitle="This pages shows how legend works in a chart with many series."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "verticalAxisTitlePlacement",
            "showLegend",
            "showLegendTitle",
            "legendPosition",
            "legendBottomMaxHeight",
            "tooltipSize",
            "tooltipPlacement",
          ]}
        />
      }
    >
      <PageSection>
        <Component />
      </PageSection>
    </Page>
  );
}

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
].map((v) => v * 0.9);
const site2Data = [
  151023, 169975, 176980, 168852, 149130, 147299, 169552, 163401, 154091, 199516, 195503, 189953, 181635, 192975,
  205951, 218958, 220516, 213557, 165899, 173557, 172331, 186492, 131541, 142262, 194091, 185899, 173401, 171635,
  179130, 185951, 144091, 152975, 157299,
].map((v) => v * 0.9);

const series: CartesianChartProps.SeriesOptions[] = [];
for (let index = 0; index < 20; index++) {
  const data = index < 10 ? site1Data : site2Data;
  series.push({
    name: loremIpsum
      .slice(index * 20, (index + 1) * 20)
      .replace(/[\W]+/g, "-")
      .replace(/(^-)|(-$)/g, "")
      .toLowerCase(),
    type: "areaspline",
    data: data.map((y, index) => ({
      x: domain[index].getTime(),
      y: y + Math.round((pseudoRandom() - 0.5) * (index + 1) * 5000),
    })),
  });
}
series.push({ type: "x-threshold", name: "X Threshold", value: 1601000100000 });
series.push({ type: "y-threshold", name: "Y Threshold", value: 1_500_000 });

function Component() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      stacking="normal"
      chartHeight={400}
      ariaLabel="Area chart"
      series={series}
      xAxis={{
        type: "datetime",
        title: "Time (UTC)",
        min: domain[0].getTime(),
        max: domain[domain.length - 1].getTime(),
        valueFormatter: dateFormatter,
      }}
      yAxis={{ title: "Bytes transferred" }}
    />
  );
}

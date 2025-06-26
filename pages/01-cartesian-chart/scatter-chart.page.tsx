// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorTextBodyDefault,
} from "@cloudscape-design/design-tokens";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

export default function () {
  return (
    <Page
      title="Scatter chart"
      settings={
        <PageSettingsForm selectedSettings={["showLegend", "showLegendTitle", "tooltipSize", "tooltipPlacement"]} />
      }
    >
      <ExampleScatterSimple />
    </Page>
  );
}

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const baseline = [
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
  { x: 1601003400000, y: 255555 },
  { x: 1601003700000, y: 231902 },
  { x: 1601004600000, y: 224558 },
  { x: 1601005500000, y: 253901 },
  { x: 1601006400000, y: 102839 },
  { x: 1601007300000, y: 234943 },
  { x: 1601008200000, y: 204405 },
  { x: 1601009100000, y: 190391 },
  { x: 1601010000000, y: 183570 },
  { x: 1601010900000, y: 162592 },
  { x: 1601011800000, y: 148910 },
  { x: 1601012700000, y: 229492 },
  { x: 1601013600000, y: 293910 },
];

const randX = (x: number) => x - randomInt(0, 900000);

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "A" + i, x: randX(x), y })),
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "B" + i, x: randX(x), y: y + randomInt(-100000, 100000) })),
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "C" + i, x: randX(x), y: y + randomInt(-150000, 50000) })),
  },
  {
    name: "D",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "D" + i, x: randX(x), y: y + randomInt(-200000, -100000) })),
  },
  {
    name: "E",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "E" + i, x: randX(x), y: y + randomInt(50000, 75000) })),
  },
  {
    name: "Threshold",
    type: "x-threshold",
    value: 1600993000000,
  },
];

const matchingSeries: CartesianChartProps.ScatterSeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "A" + i, x, y })),
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "B" + i, x, y: y + randomInt(-100000, 100000) })),
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "C" + i, x, y: y + randomInt(-150000, 50000) })),
  },
  {
    name: "D",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "D" + i, x, y: y + randomInt(-200000, -100000) })),
  },
  {
    name: "E",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "E" + i, x, y: y + randomInt(50000, 75000) })),
  },
];

const seriesWithCustomMarkers: CartesianChartProps.SeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "A" + i, x: randX(x), y })),
    color: "#ed1b76",
    marker: { symbol: "triangle" },
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "B" + i, x: randX(x), y: y + randomInt(-100000, 100000) })),
    color: "#249f9c",
    marker: { symbol: "circle" },
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }, i) => ({ name: "C" + i, x: randX(x), y: y + randomInt(-150000, 50000) })),
    color: colorTextBodyDefault,
    marker: { symbol: "square" },
  },
];

const dataA = [
  { x: baseline[0].x, y: 1000 },
  { x: baseline[1].x, y: 1400 },
  { x: baseline[2].x, y: 1800 },
  { x: baseline[3].x, y: 1600 },
  { x: baseline[4].x, y: 1200 },
  { x: baseline[5].x, y: 1730 },
  { x: baseline[6].x, y: 1800 },
  { x: baseline[7].x, y: 1820 },
  { x: baseline[8].x, y: 1900 },
  { x: baseline[9].x, y: 2020 },
  { x: baseline[10].x, y: 2000 },
  { x: baseline[10].x, y: 2000 },
  { x: baseline[11].x, y: 2050 },
  { x: baseline[11].x, y: 2025 },
  { x: baseline[12].x, y: 2080 },
  { x: baseline[13].x, y: 2200 },
  { x: baseline[14].x, y: 2160 },
];
const dataB = [
  { x: dataA[0].x + 500_000, y: dataA[0].y + 500 },
  { x: dataA[1].x + 450_000, y: dataA[1].y + 480 },
  { x: dataA[2].x + 420_000, y: dataA[2].y + 440 },
  { x: dataA[3].x + 390_000, y: dataA[3].y + 410 },
  { x: dataA[4].x + 320_000, y: dataA[4].y + 340 },
  { x: dataA[5].x + 360_000, y: dataA[5].y + 300 },
  { x: dataA[6].x + 310_000, y: dataA[6].y + 260 },
  { x: dataA[7].x + 255_000, y: dataA[7].y + 230 },
  { x: dataA[8].x + 205_000, y: dataA[8].y + 180 },
  { x: dataA[9].x + 140_000, y: dataA[9].y + 140 },
  { x: dataA[10].x + 100_000, y: dataA[10].y + 0 },
  { x: dataA[11].x + 80_000, y: dataA[11].y + 50 },
  { x: dataA[12].x + 0, y: dataA[12].y + 20 },
  { x: dataA[13].x + 0, y: dataA[13].y + 0 },
  { x: dataA[14].x - 1_000, y: dataA[14].y + 10 },
];
const dataC = [
  { x: dataA[6].x + 150_000, y: dataA[6].y - 300 },
  { x: dataA[7].x + 150_000, y: dataA[7].y - 300 },
  { x: dataA[7].x + 150_000, y: dataA[7].y - 300 },
  { x: dataA[8].x + 150_000, y: dataA[8].y - 300 },
];
const seriesWithDuplicatePoints: CartesianChartProps.SeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: dataA,
    color: colorChartsPaletteCategorical1,
  },
  {
    name: "B",
    type: "scatter",
    data: dataB,
    color: colorChartsPaletteCategorical2,
  },
  {
    name: "C",
    type: "scatter",
    data: dataC,
    color: colorChartsPaletteCategorical3,
  },
  {
    name: "A trend",
    type: "line",
    data: computeTrendLine(dataA),
    color: colorChartsPaletteCategorical1,
  },
  {
    name: "B trend",
    type: "line",
    data: computeTrendLine(dataB),
    color: colorChartsPaletteCategorical2,
  },
  {
    name: "C trend",
    type: "line",
    data: computeTrendLine(dataC),
    color: colorChartsPaletteCategorical3,
  },
];

const largeDomain: number[] = [];
for (
  let time = new Date("2015-01-01").getTime();
  time < new Date("2025-01-01").getTime();
  time += 48 * 60 * 60 * 1000
) {
  largeDomain.push(time);
}
const largeDataA = largeDomain.map((x, index) => ({
  x,
  y: Math.round(1000 + pseudoRandom() * 5000 + pseudoRandom() * 10000 + pseudoRandom() * 10 * index),
}));
const largeDataB = largeDomain
  .slice(Math.round(largeDomain.length * 0.3), Math.round(largeDomain.length * 0.7))
  .map((x, index) => ({
    x,
    y: Math.round(1000 + pseudoRandom() * 5000 + pseudoRandom() * 10000 + pseudoRandom() * 10 * index),
  }));
const largeSeries: CartesianChartProps.SeriesOptions[] = [
  {
    name: "A",
    type: "scatter",
    data: largeDataA,
    color: `rgba(0,205,0,0.6)`,
  },
  {
    name: "B",
    type: "scatter",
    data: largeDataB,
    color: `rgba(0,155,155,0.6)`,
  },
  {
    name: "A trend",
    type: "spline",
    data: computeTrendLine(largeDataA),
    color: `rgba(0,125,0,1.0)`,
  },
  {
    name: "B trend",
    type: "spline",
    data: computeTrendLine(largeDataB),
    color: `rgba(0,105,105,1.0)`,
  },
];

function ExampleScatterSimple() {
  const { chartProps } = useChartSettings();
  const commonProps = {
    ...chartProps.cartesian,
    chartHeight: 400,
    ariaLabel: "Scatter chart",
    xAxis: { type: "datetime", title: "Time (UTC)", valueFormatter: dateFormatter },
    yAxis: { title: "Events" },
    emphasizeBaseline: false,
  } as const;
  return (
    <>
      <PageSection title="Scatter chart">
        <CartesianChart {...commonProps} series={series} />
      </PageSection>

      <PageSection title="Scatter chart with matching X">
        <CartesianChart {...commonProps} series={matchingSeries} />
      </PageSection>

      <PageSection title="Scatter chart with explicit markers and colors">
        <CartesianChart {...commonProps} series={seriesWithCustomMarkers} />
      </PageSection>

      <PageSection
        title="Scatter chart with trend lines and duplicate points"
        subtitle="There are points in data that belong to the same series and have identical x- and y-. Highcharts shows them as one point."
      >
        <CartesianChart {...commonProps} series={seriesWithDuplicatePoints} />
      </PageSection>

      <PageSection title="Large scatter chart with trend line">
        <CartesianChart {...commonProps} series={largeSeries} />
      </PageSection>
    </>
  );
}

function computeTrendLine(data: { x: number; y: number }[]): { x: number; y: number }[] {
  const n = data.length;
  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const xMin = Math.min(...data.map((p) => p.x));
  const xMax = Math.max(...data.map((p) => p.x));

  return [
    { x: xMin, y: slope * xMin + intercept },
    { x: xMax, y: slope * xMax + intercept },
  ];
}

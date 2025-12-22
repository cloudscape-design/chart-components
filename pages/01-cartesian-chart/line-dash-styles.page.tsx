// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import range from "../../lib/components/internal/utils/range";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const startDate = new Date(1600984800000); // 2020-09-25T06:00:00.000Z
const endDate = new Date(1601014500000); // 2020-09-25T14:00:00.000Z
const domain = range(startDate.getTime(), endDate.getTime(), 15 * 60 * 1000).map((time) => new Date(time));
const rawData = [
  58020, 102402, 104920, 94031, 125021, 159219, 193082, 162592, 274021, 264286, 289210, 256362, 257306, 186776, 294020,
  385975, 486039, 490447, 361845, 339058, 298028, 231902, 224558, 253901, 102839, 234943, 204405, 190391, 183570,
  162592, 148910, 229492, 293910,
];

function createSeries(offset: number, dashStyle?: Highcharts.DashStyleValue): CartesianChartProps.SeriesOptions {
  return {
    name: `spline-${dashStyle ?? "default"}`,
    type: "spline",
    dashStyle,
    data: rawData.map((y, index) => ({
      x: domain[index].getTime(),
      y: offset + y + Math.round((index * 0.5 - 20) * (index + 5) * 5000),
    })),
  };
}
const series: CartesianChartProps.SeriesOptions[] = [
  createSeries(0),
  createSeries(50_000, "Dash"),
  createSeries(250_000, "DashDot"),
  createSeries(440_000, "Dot"),
  createSeries(789_000, "LongDash"),
  createSeries(999_000, "LongDashDot"),
  createSeries(1_132_000, "LongDashDotDot"),
  createSeries(1_350_000, "ShortDash"),
  createSeries(1_400_000, "ShortDashDot"),
  createSeries(1_560_000, "ShortDashDotDot"),
  createSeries(1_880_000, "ShortDot"),
  createSeries(2_000_000, "Solid"),
  { type: "x-threshold", name: "threshold-default", value: 1601000100000 },
  { type: "y-threshold", name: "threshold-DashDot", value: 1_500_000, dashStyle: "DashDot" },
];

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page title="Dash style demo" subtitle="This pages shows all supported line dash styles for line-like series.">
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={700}
        ariaLabel="Line chart"
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
    </Page>
  );
}

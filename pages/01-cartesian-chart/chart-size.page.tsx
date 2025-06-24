// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { FitSizeDemo, Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const splineSeries: CartesianChartProps.SeriesOptions[] = [
  {
    type: "spline",
    name: "Demo spline fifty",
    data: range(0, 100).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 50) })),
  },
  {
    type: "spline",
    name: "Demo spline seventy-five",
    data: range(0, 100).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 75) })),
  },
  {
    type: "spline",
    name: "Demo spline one hundred",
    data: range(0, 100).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 100) })),
  },
  {
    type: "spline",
    name: "Demo spline one hundred twenty-five",
    data: range(0, 100).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 125) })),
  },
  {
    type: "spline",
    name: "Demo spline one hundred fifty",
    data: range(0, 100).map((i) => ({ x: i * 10, y: Math.floor((pseudoRandom() + i / 25) * 150) })),
  },
];

export default function () {
  const { settings, chartProps } = useChartSettings();
  const commonChartProps: CartesianChartProps = {
    ...chartProps.cartesian,
    series: splineSeries,
    xAxis: {
      title: "X values",
      type: "linear",
    },
    yAxis: {
      title: "Y values",
      type: "linear",
    },
  };
  return (
    <Page
      title="Chart size"
      subtitle="The page demonstrates chart size settings, including fit size, chart height, chart min height, and chart min width."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "height",
            "minHeight",
            "minWidth",
            "containerHeight",
            "containerWidth",
            "showLegend",
            "showLegendTitle",
            "legendBottomMaxHeight",
            "legendPosition",
            "useFallback",
          ]}
        />
      }
    >
      <PageSection title="Chart height">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart {...commonChartProps} chartHeight={settings.height} />
        </FitSizeDemo>
      </PageSection>

      <PageSection title="Chart height, min height, and min width">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart
            {...commonChartProps}
            chartHeight={settings.height}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </FitSizeDemo>
      </PageSection>

      <PageSection title="Fit height, min height, and min width">
        <FitSizeDemo height={settings.containerHeight} width={settings.containerWidth}>
          <CartesianChart
            {...commonChartProps}
            fitHeight={true}
            chartMinHeight={settings.minHeight}
            chartMinWidth={settings.minWidth}
          />
        </FitSizeDemo>
      </PageSection>
    </Page>
  );
}

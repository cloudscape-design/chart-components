// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps, PieChart, PieChartProps } from "../../lib/components";
import { MeasureHeight } from "../common/measure-height";
import { usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const pieSeries: PieChartProps.Series = {
  name: "Units",
  type: "pie",
  innerSize: "80%",
  data: [
    { name: "Item A", y: 40 },
    { name: "Item B", y: 25 },
    { name: "Item C", y: 20 },
    { name: "Item D", y: 10 },
    { name: "Item E", y: 5 },
  ],
};

const splineSeries: CartesianChartProps.Series[] = [
  {
    type: "spline",
    name: "Demo",
    data: range(0, 100).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 50)]),
  },
];

export default function () {
  const { highcharts, settings, setSettings, chartStateProps } = usePageSettings();
  const outerContainerStyle: React.CSSProperties = {
    height: settings.containerHeight,
    width: settings.containerWidth,
    border: "1px solid black",
    borderRadius: "4px",
    position: "relative",
  };
  return (
    <Page
      title="Fit height: Donut chart"
      subtitle="The page demonstrates the fit-height property. It works the same across all supported types of Highcharts."
      settings={
        <SpaceBetween size="s">
          <FormField label="Chart min height">
            <Input
              type="number"
              value={settings.minHeight.toString()}
              onChange={({ detail }) => setSettings({ minHeight: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Chart min width">
            <Input
              type="number"
              value={settings.minWidth.toString()}
              onChange={({ detail }) => setSettings({ minWidth: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Container height">
            <Input
              type="number"
              value={settings.containerHeight.toString()}
              onChange={({ detail }) => setSettings({ containerHeight: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Container width">
            <Input
              value={settings.containerWidth}
              onChange={({ detail }) => setSettings({ containerWidth: detail.value })}
            />
          </FormField>
        </SpaceBetween>
      }
    >
      <PageSection
        title="Fit-height with outer container"
        subtitle="This example demonstrates how fit-height behavior is implemented with an outer container that relies on the resize observer."
      >
        <div style={{ ...outerContainerStyle, overflow: "auto" }}>
          <MeasureHeight minHeight={settings.minHeight}>
            {(height) => (
              <PieChart
                highcharts={highcharts}
                {...chartStateProps}
                height={height}
                ariaLabel="Donut chart"
                ariaDescription="Donut chart showing generic example data."
                series={pieSeries}
                segment={{
                  description: ({ segmentValue, totalValue }) =>
                    `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
                }}
                innerValue="100"
                innerDescription="total units"
              />
            )}
          </MeasureHeight>
        </div>
      </PageSection>

      <PageSection
        title="Fit-height with scrollable plot area settings"
        subtitle="This example demonstrates how fit-height behavior is implemented with Highcharts scrollablePlotArea features."
      >
        <div style={{ ...outerContainerStyle, overflow: "hidden" }}>
          <MeasureHeight>
            {(height) => (
              <PieChart
                highcharts={highcharts}
                {...chartStateProps}
                height={height}
                scrollablePlotArea={{ minHeight: settings.minHeight }}
                ariaLabel="Donut chart"
                ariaDescription="Donut chart showing generic example data."
                series={pieSeries}
                segment={{
                  description: ({ segmentValue, totalValue }) =>
                    `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
                }}
                innerValue="100"
                innerDescription="total units"
              />
            )}
          </MeasureHeight>
        </div>
      </PageSection>

      <PageSection
        title="Fit-width with scrollable plot area settings"
        subtitle="This example demonstrates how fit-width behavior is implemented with Highcharts scrollablePlotArea features."
      >
        <div style={{ ...outerContainerStyle, overflow: "hidden", height: settings.minHeight }}>
          <CartesianChart
            highcharts={highcharts}
            height={settings.minHeight}
            scrollablePlotArea={{ minWidth: settings.minWidth }}
            series={splineSeries}
            xAxis={{
              title: "X values",
              type: "linear",
              valueDecimals: 0,
            }}
            yAxis={{
              title: "Y values",
              type: "linear",
              valueDecimals: 0,
            }}
          />
        </div>
      </PageSection>
    </Page>
  );
}

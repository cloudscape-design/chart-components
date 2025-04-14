// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";

import Box from "@cloudscape-design/components/box";
import MixedLineBarChart, { MixedLineBarChartProps } from "@cloudscape-design/components/mixed-line-bar-chart";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { CodeSnippet } from "../common/code-snippet";
import { numberFormatter } from "../common/formatters";
import { MigrationDemo, Page, PageSection } from "../common/templates";

const commonPropsOld: MixedLineBarChartProps<any> = {
  series: [],
  ariaLabel: "Demo chart",
  height: 100,
  fitHeight: true,
  hideFilter: true,
  hideLegend: true,
  xTitle: "X axis title",
  yTitle: "Y axis title",
};

const commonPropsNew: CartesianChartProps = {
  highcharts: Highcharts,
  series: [],
  ariaLabel: "Demo chart",
  chartMinHeight: 100,
  fitHeight: true,
  legend: { enabled: false },
  xAxis: { title: "X axis title" },
  yAxis: { title: "Y axis title" },
};

export default function () {
  return (
    <Page title="Migration: Axes and scales">
      <PageSection title="Vertical axis title"></PageSection>

      <PageSection
        title="Axes labels"
        docs={{
          functional: {
            bullets: [
              `The vertical axis (usually Y-axis) label is on the chart's top in the old charts, and is along the axis in te new charts.
              This has an affect on the usable space in the chart plot.`,
            ],
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              tags: [],
              old: (
                <MixedLineBarChart
                  {...commonPropsOld}
                  series={[
                    {
                      title: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 10_000 },
                        { x: 1, y: 100_000 },
                      ],
                    },
                  ]}
                  xTickFormatter={numberFormatter}
                  yTickFormatter={numberFormatter}
                />
              ),
              new: (
                <CartesianChart
                  {...commonPropsNew}
                  series={[
                    {
                      name: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 10_000 },
                        { x: 1, y: 100_000 },
                      ],
                    },
                  ]}
                  xAxis={{ ...commonPropsNew.xAxis, valueFormatter: numberFormatter }}
                  yAxis={{ ...commonPropsNew.yAxis, valueFormatter: numberFormatter }}
                />
              ),
              containerHeight: 200,
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Axes domain"
        docs={{
          implementation: {
            bullets: [
              `In the new charts the axes domain is set with min, max on the corresponding axis. It is recommended to use tickInterval to
            improve ticks distribution.`,
            ],
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              tags: [],
              old: (
                <MixedLineBarChart
                  {...commonPropsOld}
                  series={[
                    {
                      title: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 0 },
                        { x: 90_000, y: 90_000 },
                      ],
                    },
                  ]}
                  xDomain={[0, 80_000]}
                  yDomain={[0, 80_000]}
                  xTickFormatter={numberFormatter}
                  yTickFormatter={numberFormatter}
                />
              ),
              new: (
                <CartesianChart
                  {...commonPropsNew}
                  series={[
                    {
                      name: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 0 },
                        { x: 90_000, y: 90_000 },
                      ],
                    },
                  ]}
                  xAxis={{ ...commonPropsNew.xAxis, min: 0, max: 80_000 }}
                  yAxis={{ ...commonPropsNew.yAxis, min: 0, max: 80_000, tickInterval: 20_000 }}
                />
              ),
              containerHeight: 200,
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Long labels and titles"
        docs={{
          implementation: {
            bullets: [
              `In the old charts the labels can be made multi-line by inserting "\\n" between formatted parts.
              In the new charts the same is achieved by inserting <br />.`,
            ],
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              tags: [],
              old: (
                <MixedLineBarChart
                  {...commonPropsOld}
                  series={[
                    {
                      title: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 0 },
                        { x: 90_000, y: 90_000 },
                      ],
                    },
                  ]}
                  xTitle="Very very very long X-axis title, that can wrap"
                  yTitle="Very very very long Y-axis title, that can wrap"
                  xTickFormatter={(value) => `${value}\nitem label`}
                  yTickFormatter={(value) => `${value}\nitem label`}
                />
              ),
              new: (
                <CartesianChart
                  {...commonPropsNew}
                  series={[
                    {
                      name: "S1",
                      type: "line",
                      data: [
                        { x: 0, y: 0 },
                        { x: 100_000, y: 100_000 },
                      ],
                    },
                  ]}
                  xAxis={{
                    title: "Very very very long X-axis title, that can wrap",
                    valueFormatter: (value) => `${value}<br />item label`,
                  }}
                  yAxis={{
                    title: "Very very very long Y-axis title, that can wrap",
                    valueFormatter: (value) => `${value}<br />item label`,
                  }}
                />
              ),
              containerHeight: 220,
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Axes formatters"
        docs={{
          implementation: {
            bullets: [
              `The "time"-scaled axis of the old charts requires values of type Date. In the new charts the corresponding "datetime" scale
              only supports numeric dates representation. The "datetime" scale type is supported on either axis.`,
              { content: DatetimeScaleGuidance },
              `In the new charts there are default number and date-time formatters. In the old charts the formatters must be explicitly passed.`,
            ],
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              tags: [],
              old: (
                <MixedLineBarChart
                  {...commonPropsOld}
                  series={[
                    {
                      title: "S1",
                      type: "line",
                      data: [
                        { x: new Date("2020-01-01"), y: 10_000 },
                        { x: new Date("2021-01-01"), y: 100_000 },
                        { x: new Date("2022-01-01"), y: 1_000_000 },
                        { x: new Date("2023-01-01"), y: 10_000_000 },
                      ],
                    },
                  ]}
                  xScaleType="time"
                  yScaleType="log"
                />
              ),
              new: (
                <CartesianChart
                  {...commonPropsNew}
                  series={[
                    {
                      name: "S1",
                      type: "line",
                      data: [
                        { x: new Date("2020-01-01").getTime(), y: 10_000 },
                        { x: new Date("2021-01-01").getTime(), y: 100_000 },
                        { x: new Date("2022-01-01").getTime(), y: 1_000_000 },
                        { x: new Date("2023-01-01").getTime(), y: 10_000_000 },
                      ],
                    },
                  ]}
                  xAxis={{ ...commonPropsNew.xAxis, type: "datetime" }}
                  yAxis={{ ...commonPropsNew.yAxis, type: "logarithmic" }}
                />
              ),
              containerHeight: 200,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

const DatetimeScaleGuidance = (
  <SpaceBetween size="s">
    <Box variant="span">See implementation of the datetime scale in the new charts:</Box>

    <CodeSnippet
      content={`let datetimeChart = (
  <CartesianChart
    {...chartProps}
    series={[
      {
        name: "S1",
        type: "line",
        data: [
          { x: new Date("2020-01-01").getTime(), y: 10_000 },
          { x: new Date("2021-01-01").getTime(), y: 100_000 },
          { x: new Date("2022-01-01").getTime(), y: 1_000_000 },
          { x: new Date("2023-01-01").getTime(), y: 10_000_000 },
        ],
      },
    ]}
    xAxis={{ title: 'X axis title', type: "datetime" }}
    yAxis={{ title: 'Y axis title', type: "logarithmic" }}
  />
);`}
    />
  </SpaceBetween>
);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";

import Box from "@cloudscape-design/components/box";
import MixedLineBarChart, { MixedLineBarChartProps } from "@cloudscape-design/components/mixed-line-bar-chart";
import SpaceBetween from "@cloudscape-design/components/space-between";

import "highcharts/modules/accessibility";
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
            before: (
              <Box>
                In the old charts, the vertical axis (usually Y-axis) title is on the chart&apos;s top. In the new
                charts, the label can be also displayed along the axis line (controlled with{" "}
                <Box variant="code">verticalAxisTitlePlacement</Box> property).
              </Box>
            ),
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              tags: ["y-axis title on top"],
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
                  verticalAxisTitlePlacement="top"
                />
              ),
              containerHeight: 200,
            },
            {
              tags: ["y-axis title on side"],
              old: null,
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
                  verticalAxisTitlePlacement="side"
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
            before: (
              <SpaceBetween size="s">
                <Box>
                  In the new charts the axes domain is set with <Box variant="code">min</Box>,{" "}
                  <Box variant="code">max</Box> on the corresponding axis. It is recommended to use{" "}
                  <Box variant="code">tickInterval</Box> to improve ticks distribution.
                </Box>

                <CodeSnippet
                  content={`let oldChart = (
  <LineChart
    {...restProps}
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
    xTitle="X axis title"
    xDomain={[0, 80_000]}
    yTitle="Y axis title"
    yDomain={[0, 80_000]}
  />
);

let newChart = (
  <CartesianChart
    {...restProps}
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
    xAxis={{ title: 'X axis title', min: 0, max: 80_000 }}
    yAxis={{ title: 'Y axis title', min: 0, max: 80_000, tickInterval: 20_000 }}
  />
);`}
                />
              </SpaceBetween>
            ),
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
            before: (
              <SpaceBetween size="s">
                <Box>
                  In both old and new charts charts the labels can be made multi-line by inserting {`"\\n"`} between
                  formatted parts.
                </Box>

                <CodeSnippet
                  content={`let oldChart = (
  <LineChart
    {...restProps}
    xTickFormatter={(value) => \`\${value}\\nitem label\`}
    yTickFormatter={(value) => \`\${value}\\nitem label\`}
  />
);
        
let newChart = (
  <CartesianChart
    {...restProps}
    xAxis={{
      ...xAxisProps,
      valueFormatter: (value) => \`\${value}\\nitem label\`,
    }}
    yAxis={{
      ...yAxisProps,
      valueFormatter: (value) => \`\${value}\\nitem label\`,
    }}
  />
);`}
                />
              </SpaceBetween>
            ),
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
                    valueFormatter: (value) => `${value}\nitem label`,
                  }}
                  yAxis={{
                    title: "Very very very long Y-axis title, that can truncate",
                    valueFormatter: (value) => `${value}\nitem label`,
                  }}
                  verticalAxisTitlePlacement="top"
                />
              ),
              containerHeight: 220,
            },
            {
              tags: [],
              old: null,
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
                    valueFormatter: (value) => `${value}\nitem label`,
                  }}
                  yAxis={{
                    title: "Very very very long Y-axis title, that can wrap",
                    valueFormatter: (value) => `${value}\nitem label`,
                  }}
                  verticalAxisTitlePlacement="side"
                />
              ),
              containerHeight: 220,
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Axes formatters and datetime scale"
        docs={{
          implementation: {
            bullets: [
              `The "time"-scaled axis of the old charts requires values of type Date. In the new charts the corresponding "datetime" scale
              only supports numeric dates representation. The "datetime" scale type is supported on either axis.`,
              `In the new charts there are default formatter for numeric and date-time values. In the old charts the formatters must be explicitly passed.`,
            ],
            after: (
              <CodeSnippet
                content={`let oldChart = (
  <LineChart
    {...restProps}
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
    xTitle: "X axis title"
    xScaleType="time"
    yTitle: "Y axis title"
    yScaleType="log"
  />
);
        
let newChart = (
  <CartesianChart
    {...restProps}
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
            ),
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
                  verticalAxisTitlePlacement="top"
                />
              ),
              containerHeight: 200,
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Category scale"
        docs={{
          implementation: {
            bullets: [
              `In the old charts, the "categorical" scale can be used with numeric, string, or Date tick- and domain types.
              In the new charts, the categories can only be strings, while x values are always indices.`,
            ],
            after: (
              <CodeSnippet
                content={`let oldChart = (
  <LineChart
    {...restProps}
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
    xScaleType="categorical"
    xDomain={[
      new Date("2020-01-01"),
      new Date("2021-01-01"),
      new Date("2022-01-01"),
      new Date("2023-01-01"),
    ]}
    xTickFormatter={(x) => x.getFullYear()}
    yScaleType="log"
  />
);

let newChart = (
  <CartesianChart
    {...restProps}
    series={[
      {
        name: "S1",
        type: "line",
        data: [
          { x: 0, y: 10_000 },
          { x: 1, y: 100_000 },
          { x: 2, y: 1_000_000 },
          { x: 3, y: 10_000_000 },
        ],
      },
    ]}
    xAxis={{ ...xAxisProps, type: "category", categories: ["2020", "2021", "2022", "2023"] }}
    yAxis={{ ...yAxisProps, type: "logarithmic" }}
  />
);`}
              />
            ),
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
                  xScaleType="categorical"
                  xDomain={[
                    new Date("2020-01-01"),
                    new Date("2021-01-01"),
                    new Date("2022-01-01"),
                    new Date("2023-01-01"),
                  ]}
                  xTickFormatter={(x) => x.getFullYear()}
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
                        { x: 0, y: 10_000 },
                        { x: 1, y: 100_000 },
                        { x: 2, y: 1_000_000 },
                        { x: 3, y: 10_000_000 },
                      ],
                    },
                  ]}
                  xAxis={{ ...commonPropsNew.xAxis, type: "category", categories: ["2020", "2021", "2022", "2023"] }}
                  yAxis={{ ...commonPropsNew.yAxis, type: "logarithmic" }}
                  verticalAxisTitlePlacement="top"
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

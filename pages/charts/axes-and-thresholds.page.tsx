// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { addDays, subYears } from "date-fns";
import { range } from "lodash";

import ColumnLayout from "@cloudscape-design/components/column-layout";

import { CartesianChart } from "../../lib/components";
import { dateFormatter } from "../common/formatters";
import { PageSettingsDefaults, usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

export default function () {
  return (
    <PageSettingsDefaults settings={{}}>
      <Page
        title="Axes and thresholds"
        subtitle="This pages demonstrates different axes types, tick formatters, and thresholds."
      >
        <ColumnLayout columns={2}>
          <PageSection title="Linear X, linear Y">
            <LinearLinear />
          </PageSection>
          <PageSection title="Linear X, log Y">
            <LinearLog />
          </PageSection>
          <PageSection title="Log X, linear Y">
            <LogLinear />
          </PageSection>
          <PageSection title="Log X, log Y">
            <LogLog />
          </PageSection>
          <PageSection title="Categorical X, linear Y">
            <CategoryLinear />
          </PageSection>
          <PageSection title="Linear X, categorical Y">
            <LinearCategory />
          </PageSection>
          <PageSection title="Categorical X, categorical Y">
            <CategoryCategory />
          </PageSection>
          <PageSection title="Datetime X, linear Y">
            <DatetimeLinear />
          </PageSection>
          <PageSection title="Linear X, datetime Y">
            <LinearDatetime />
          </PageSection>
          <PageSection title="Datetime X, datetime Y">
            <DatetimeDatetime />
          </PageSection>
          <PageSection title="Log X, categorical Y">
            <LogCategory />
          </PageSection>
          <PageSection title="Categorical X, log Y">
            <CategoryLog />
          </PageSection>
          <PageSection title="Datetime X, log Y">
            <DatetimeLog />
          </PageSection>
          <PageSection title="Log X, datetime Y">
            <LogDatetime />
          </PageSection>
          <PageSection title="Categorical X, datetime Y">
            <DatetimeCategory />
          </PageSection>
          <PageSection title="Datetime X, categorical Y">
            <CategoryDatetime />
          </PageSection>
        </ColumnLayout>
      </Page>
    </PageSettingsDefaults>
  );
}

const defaultSettings = {
  height: 400,
  legend: { enabled: false },
};

function LinearLinear() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [i * 10, Math.floor((pseudoRandom() + i / 25) * 50)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 250,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 75,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 500,
        valueDecimals: 0,
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 150,
        valueDecimals: 0,
      }}
    />
  );
}

function LinearLog() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [i * 10, i * i]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 100,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 500,
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function LogLinear() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [i * i, i * 20]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 500,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 1000,
      }}
    />
  );
}

function LogLog() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [i * i, Math.pow(2, i / 2)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 5000,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function CategoryLinear() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "column",
          name: "Demo",
          data: range(0, 10).map((i) => Math.floor((pseudoRandom() + i / 25) * 50)),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 4,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 50,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "category",
        categories: range(0, 10).map((i) => "ABCDEFGHIJ"[i]),
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 100,
      }}
    />
  );
}

function LinearCategory() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => [i * 2, Math.floor(pseudoRandom() * 10)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 50,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 4,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 100,
      }}
      yAxis={{
        title: "Y values",
        type: "category",
        categories: range(0, 10).map((i) => "ABCDEFGHIJ"[i]),
      }}
    />
  );
}

function CategoryCategory() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        ...range(0, 5).map(
          (seriesIndex) =>
            ({
              type: "scatter",
              name: `Demo ${seriesIndex + 1}`,
              data: range(0, 15).map((i) => [i, Math.floor(pseudoRandom() * 15)]),
            }) as any,
        ),
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 8,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 8,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        categories: range(0, 15).map((i) => "ABCDEFGHIJKLMNO"[i]),
      }}
      yAxis={{
        title: "Y values",
        type: "category",
        categories: range(0, 15).map((i) => "ABCDEFGHIJKLMNO"[i]),
      }}
    />
  );
}

function DatetimeLinear() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [addDays(new Date(), i).getTime(), Math.floor((pseudoRandom() + i / 25) * 50)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 25).getTime(),
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 75,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        type: "linear",
        min: 0,
        max: 150,
      }}
    />
  );
}

function LinearDatetime() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => [Math.floor((pseudoRandom() + i / 25) * 50), addDays(new Date(), i).getTime()]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 75,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 25).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "linear",
        min: 0,
        max: 150,
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

function DatetimeDatetime() {
  const { highcharts } = usePageSettings({ more: true });
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 10)
            .filter((i) => i % 2)
            .flatMap((x) =>
              range(0, 10)
                .filter((i) => !(i % 2))
                .map(
                  (y) =>
                    [addDays(new Date(), x).getTime(), subYears(addDays(new Date(), y), 1).getTime()] as [
                      number,
                      number,
                    ],
                ),
            ),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 5).getTime(),
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: subYears(addDays(new Date(), 5), 1).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
        valueFormatter: dateFormatter,
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
        valueFormatter: dateFormatter,
      }}
    />
  );
}

function LogCategory() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [i * 5, (i - i * 0.2) % 5]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 100,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 3,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        categories: ["A", "B", "C", "D", "E"],
      }}
    />
  );
}

function CategoryLog() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "column",
          name: "Demo",
          data: range(0, 5).map((i) => [i, 13 + i * 2 * (i + i)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 3,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 50,
        },
      ]}
      xAxis={{
        title: "X values",
        categories: ["A", "B", "C", "D", "E"],
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function DatetimeLog() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "spline",
          name: "Demo",
          data: range(0, 50).map((i) => [addDays(new Date(), i).getTime(), Math.floor((pseudoRandom() + i / 25) * 50)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 25).getTime(),
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 45,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        type: "logarithmic",
      }}
    />
  );
}

function LogDatetime() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 50).map((i) => [Math.floor((pseudoRandom() + i / 25) * 50), addDays(new Date(), i).getTime()]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 45,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 25).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        type: "logarithmic",
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

function DatetimeCategory() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "line",
          name: "Demo",
          data: range(0, 10).map((i) => [addDays(new Date(), i).getTime(), Math.abs(i - 5)]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: addDays(new Date(), 5).getTime(),
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: 3,
        },
      ]}
      xAxis={{
        title: "X values",
        type: "datetime",
      }}
      yAxis={{
        title: "Y values",
        categories: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      }}
    />
  );
}

function CategoryDatetime() {
  const { highcharts } = usePageSettings();
  return (
    <CartesianChart
      highcharts={highcharts}
      {...defaultSettings}
      series={[
        {
          type: "scatter",
          name: "Demo",
          data: range(0, 10).map((i) => [Math.abs(i - 5), addDays(new Date(), i).getTime()]),
        },
        {
          type: "awsui-x-threshold",
          name: "X threshold",
          value: 3,
        },
        {
          type: "awsui-y-threshold",
          name: "Y threshold",
          value: addDays(new Date(), 5).getTime(),
        },
      ]}
      xAxis={{
        title: "X values",
        categories: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      }}
      yAxis={{
        title: "Y values",
        type: "datetime",
      }}
    />
  );
}

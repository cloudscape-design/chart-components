// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { omit } from "lodash";

import ColumnLayout from "@cloudscape-design/components/column-layout";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page title="Charts inside iframe test page" iframe={{}}>
      <ColumnLayout columns={2}>
        <CoreChart
          {...omit(chartProps.pie, "ref")}
          ariaLabel="Line chart"
          options={{
            chart: { height: 300 },
            series: [
              {
                name: "Running",
                type: "line",
                data: [
                  { x: new Date("2020-01-01").getTime(), y: 44 },
                  { x: new Date("2020-01-02").getTime(), y: 55 },
                  { x: new Date("2020-01-03").getTime(), y: 60 },
                ],
              },
              {
                name: "Failed",
                type: "line",
                data: [
                  { x: new Date("2020-01-01").getTime(), y: 22 },
                  { x: new Date("2020-01-02").getTime(), y: 15 },
                  { x: new Date("2020-01-03").getTime(), y: 30 },
                ],
              },
              {
                name: "In-progress",
                type: "line",
                data: [
                  { x: new Date("2020-01-01").getTime(), y: 34 },
                  { x: new Date("2020-01-02").getTime(), y: 30 },
                  { x: new Date("2020-01-03").getTime(), y: 10 },
                ],
              },
            ],
            xAxis: [{ type: "datetime", valueFormatter: dateFormatter }],
          }}
        />

        <CoreChart
          {...omit(chartProps.pie, "ref")}
          ariaLabel="Pie chart"
          options={{
            chart: { height: 300 },
            series: [
              {
                name: "Resource count",
                type: "pie",
                data: [
                  { name: "Running", y: 34 },
                  { name: "Failed", y: 30 },
                  { name: "In-progress", y: 10 },
                ],
              },
            ],
          }}
        />
      </ColumnLayout>
    </Page>
  );
}

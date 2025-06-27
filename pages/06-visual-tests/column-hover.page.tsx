// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ColumnLayout from "@cloudscape-design/components/column-layout";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

const domain = [
  new Date(1601071200000),
  new Date(1601078400000),
  new Date(1601085600000),
  new Date(1601092800000),
  new Date(1601100000000),
];

export default function () {
  return (
    <Page title="Column series hover visual regression page">
      <ColumnLayout columns={3}>
        <PageSection>
          <Chart type="stacked" />
        </PageSection>
        <PageSection>
          <Chart type="grouped" />
        </PageSection>
        <PageSection>
          <Chart type="single" />
        </PageSection>
      </ColumnLayout>
    </Page>
  );
}

function Chart({ type }: { type: "single" | "stacked" | "grouped" }) {
  const { chartProps } = useChartSettings();
  return (
    <CoreChart
      highcharts={chartProps.cartesian.highcharts}
      ariaLabel="Bar chart"
      legend={{ enabled: false }}
      tooltip={{ placement: "outside" }}
      options={{
        plotOptions: { series: { stacking: type === "stacked" ? "normal" : undefined } },
        series: [
          {
            name: "Severe",
            type: "column" as const,
            data: [22, 28, 25, 13, 28],
          },
          {
            name: "Moderate",
            type: "column" as const,
            data: [18, 21, 22, 0, 1],
          },
          {
            name: "Low",
            type: "column" as const,
            data: [17, 19, 18, 17, 15],
          },
          {
            name: "Unclassified",
            type: "column" as const,
            data: [24, 18, 16, 14, 16],
          },
        ].slice(0, type === "single" ? 1 : 4),
        xAxis: [
          {
            type: "category",
            title: { text: "Time (UTC)" },
            categories: domain.map((date) => dateFormatter(date.getTime())),
          },
        ],
        yAxis: [{ title: { text: "Error count" } }],
      }}
      callback={(api) => {
        setTimeout(() => {
          if (api.chart.series) {
            const seriesIndex = Math.min(api.chart.series.length - 1, 1);
            const point = api.chart.series[seriesIndex].data.find((p) => p.x === 2)!;
            api.highlightChartPoint(point);
          }
        }, 0);
      }}
    />
  );
}

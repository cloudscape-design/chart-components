// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { sum } from "lodash";

import Box from "@cloudscape-design/components/box";

import { PieChart, PieChartProps } from "../../lib/components";
import { PageSettings, PageSettingsForm, SeriesFilter, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  visibleItems: string;
}

const pieChartSeries: PieChartProps.SeriesOptions = {
  name: "Value",
  type: "pie",
  data: [
    { id: "Costs", name: "Costs", y: sum([6562, 8768, 9742, 10464, 16777, 9956, 5876]) },
    { id: "Costs last year", name: "Costs last year", y: sum([5373, 7563, 7900, 12342, 14311, 11830, 8505]) },
    { id: "Budget", name: "Budget", y: 12000 * 7 },
  ],
};

const defaultVisibleItems = "Costs,Costs last year,Peak cost";

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const visibleSeries = (settings.visibleItems ?? defaultVisibleItems).split(",");
  return (
    <Page
      title="Visibility API"
      subtitle="This page demonstrates controllable series visibility API that allows to make series visible or hidden
        programmatically."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            {
              content: (
                <SeriesFilter
                  allSeries={["Costs", "Costs last year", "Peak cost", "Budget"]}
                  visibleSeries={visibleSeries}
                  onVisibleSeriesChange={(visibleSeries) => setSettings({ visibleItems: visibleSeries.join(",") })}
                />
              ),
            },
          ]}
        />
      }
    >
      <PageSection title="Pie chart">
        <ExamplePieChart />
      </PageSection>
    </Page>
  );
}

function ExamplePieChart() {
  const { settings, setSettings, chartProps } = useChartSettings<ThisPageSettings>();
  const visibleSegments = (settings.visibleItems ?? defaultVisibleItems).split(",");
  return (
    <PieChart
      {...chartProps.pie}
      chartHeight={500}
      ariaLabel="Pie chart"
      series={pieChartSeries}
      tooltip={{
        body(details) {
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                <Box variant="span">Value</Box>
                <Box variant="span">{details.segmentValue}</Box>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
                <Box variant="span">Percentage</Box>
                <Box variant="span">{`${((details.segmentValue / details.totalValue) * 100).toFixed(0)}%`}</Box>
              </div>
            </div>
          );
        },
      }}
      segmentOptions={{
        description: ({ segmentValue, totalValue }) =>
          `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(0)}%`,
      }}
      visibleSegments={visibleSegments}
      onChangeVisibleSegments={({ detail: { visibleSegments } }) =>
        setSettings({ visibleItems: visibleSegments.join(",") })
      }
    />
  );
}

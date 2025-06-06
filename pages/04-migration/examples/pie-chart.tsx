// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import OldPieChart, { PieChartProps as OldPieChartProps } from "@cloudscape-design/components/pie-chart";
import Popover from "@cloudscape-design/components/popover";
import Select from "@cloudscape-design/components/select";

import { PieChart, PieChartProps } from "../../../lib/components";
import { useChartSettings } from "../../common/page-settings";

const seriesNew: PieChartProps.SeriesOptions = {
  name: "Resource count",
  type: "pie",
  data: [
    {
      name: "Running",
      y: 60,
    },
    {
      name: "Failed",
      y: 30,
    },
    {
      name: "In-progress",
      y: 10,
    },
    {
      name: "Pending",
      y: null,
    },
  ],
};

const dataOld: OldPieChartProps["data"] = [
  {
    title: "Running",
    value: 60,
  },
  {
    title: "Failed",
    value: 30,
  },
  {
    title: "In-progress",
    value: 10,
  },
  {
    title: "Pending",
    value: 0,
  },
];

export function ComponentNew({
  type = "pie",
  headerFilter,
  legendFilter,
}: {
  type?: "pie" | "donut";
  headerFilter?: boolean;
  legendFilter?: boolean;
}) {
  const { chartProps } = useChartSettings();
  const [visibleSegments, setVisibleSegments] = useState(seriesNew.data.map((i) => i.name));
  return (
    <PieChart
      {...chartProps.pie}
      fitHeight={true}
      chartMinHeight={200}
      ariaLabel="Pie chart"
      series={{ ...seriesNew, type }}
      filter={
        headerFilter
          ? {
              seriesFilter: true,
              additionalFilters: (
                <FormField label="Additional filter">
                  <Select options={[]} selectedOption={null} disabled={true} placeholder="Filter time range" />
                </FormField>
              ),
            }
          : undefined
      }
      legend={{
        ...chartProps.pie.legend,
        actions: legendFilter ? (
          <Popover triggerType="custom" content="Custom in-context filter" position="top">
            <Button variant="icon" iconName="search" />
          </Popover>
        ) : undefined,
      }}
      visibleSegments={visibleSegments}
      onChangeVisibleSegments={({ detail }) => setVisibleSegments(detail.visibleSegments)}
      innerAreaTitle="60"
      innerAreaDescription="total instances"
    />
  );
}

export function ComponentOld({ type = "pie", hideFilter = false }: { type?: "pie" | "donut"; hideFilter?: boolean }) {
  const { chartProps } = useChartSettings();
  return (
    <OldPieChart
      fitHeight={true}
      hideFilter={hideFilter}
      additionalFilters={
        !hideFilter && (
          <FormField label="Additional filter">
            <Select options={[]} selectedOption={null} disabled={true} placeholder="Filter time range" />
          </FormField>
        )
      }
      size="small"
      data={dataOld}
      ariaLabel="Pie chart"
      noMatch={chartProps.pie.noData!.noMatch}
      variant={type}
      innerMetricValue="60"
      innerMetricDescription="total instances"
    />
  );
}

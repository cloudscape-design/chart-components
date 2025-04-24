// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import OldPieChart, { PieChartProps as OldPieChartProps } from "@cloudscape-design/components/pie-chart";
import Popover from "@cloudscape-design/components/popover";
import Select from "@cloudscape-design/components/select";

import { ChartSeriesFilter, PieChart, PieChartProps } from "../../../lib/components";
import { HeaderFilterLayout } from "../../common/layout";
import { usePageSettings } from "../../common/page-settings";

const seriesNew: PieChartProps.Series = {
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

export function ComponentNew({ headerFilter, legendFilter }: { headerFilter?: boolean; legendFilter?: boolean }) {
  const { chartProps } = usePageSettings();
  const [visibleSegments, setVisibleSegments] = useState(seriesNew.data.map((i) => i.name));
  return (
    <PieChart
      {...chartProps}
      fitHeight={true}
      chartMinHeight={200}
      ariaLabel="Pie chart"
      series={seriesNew}
      segmentOptions={{}}
      header={
        headerFilter
          ? {
              render: ({ legendItems }) => (
                <HeaderFilterLayout
                  defaultFilter={
                    <ChartSeriesFilter
                      items={legendItems}
                      selectedItems={visibleSegments}
                      onChange={({ detail }) => setVisibleSegments([...detail.selectedItems])}
                    />
                  }
                  additionalFilters={
                    <FormField label="Additional filter">
                      <Select options={[]} selectedOption={null} disabled={true} placeholder="Filter time range" />
                    </FormField>
                  }
                />
              ),
            }
          : undefined
      }
      legend={{
        ...chartProps.legend,
        actions: {
          render: legendFilter
            ? () => (
                <Popover triggerType="custom" content="Custom in-context filter" position="top">
                  <Button variant="icon" iconName="search" />
                </Popover>
              )
            : undefined,
        },
      }}
      visibleSegments={visibleSegments}
      onChangeVisibleSegments={({ detail }) => setVisibleSegments(detail.visibleSegments)}
    />
  );
}

export function ComponentOld({ hideFilter = false }: { hideFilter?: boolean }) {
  const { chartProps } = usePageSettings();
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
      noMatch={chartProps.noData.noMatch}
    />
  );
}

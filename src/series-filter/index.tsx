// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalChartFilter } from "@cloudscape-design/components/internal/do-not-use/chart-filter";

import { ChartLegendItem } from "../core/interfaces-base.js";

interface ChartSeriesFilterProps {
  items: readonly ChartLegendItem[];
  selectedItems: readonly string[];
  onChange: (selectedItems: readonly string[]) => void;
}

const ChartSeriesFilter = (props: ChartSeriesFilterProps) => {
  return (
    <InternalChartFilter
      series={props.items.map((item) => ({
        label: item.name,
        datum: item.id,
        marker: item.marker,
      }))}
      selectedSeries={props.selectedItems}
      onChange={props.onChange}
    />
  );
};

export type { ChartSeriesFilterProps };

export default ChartSeriesFilter;

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalChartFilter } from "@cloudscape-design/components/internal/do-not-use/chart-filter";

import { CoreLegendItem } from "../../../core/interfaces";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../../../internal/events";

interface ChartSeriesFilterProps {
  items: readonly CoreLegendItem[];
  selectedItems: readonly string[];
  onChange: NonCancelableEventHandler<{ selectedItems: readonly string[] }>;
  i18nStrings?: {
    filterLabel?: string;
    filterPlaceholder?: string;
    filterSelectedAriaLabel?: string;
  };
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
      onChange={(selectedItems) => fireNonCancelableEvent(props.onChange, { selectedItems })}
      i18nStrings={props.i18nStrings}
    />
  );
};

export type { ChartSeriesFilterProps };

export default ChartSeriesFilter;

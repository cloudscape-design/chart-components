// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import InternalChartSeriesFilter from "../../internal/components/chart-series-filter";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartI18nStrings } from "../interfaces-base";

export function ChartSeriesFilter({ api, i18nStrings }: { api: ChartAPI; i18nStrings?: ChartI18nStrings }) {
  const i18n = useInternalI18n("[charts]");
  const legendItems = useSelector(api.legendStore, (s) => s.items);
  return (
    <InternalChartSeriesFilter
      items={legendItems}
      selectedItems={legendItems.filter((i) => i.visible).map((i) => i.id)}
      onChange={({ detail }) => api.onItemVisibilityChange(detail.selectedItems)}
      i18nStrings={{
        filterLabel: i18n("i18nStrings.filterLabel", i18nStrings?.seriesFilterLabel),
        filterPlaceholder: i18n("i18nStrings.filterPlaceholder", i18nStrings?.seriesFilterPlaceholder),
      }}
    />
  );
}

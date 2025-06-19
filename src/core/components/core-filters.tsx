// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import InternalChartSeriesFilter from "../../internal/components/chart-series-filter";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { BaseI18nStrings } from "../interfaces";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartFilters({
  seriesFilter,
  additionalFilters,
  api,
  i18nStrings,
}: {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
  api: ChartAPI;
  i18nStrings?: BaseI18nStrings;
}) {
  return (
    <div className={clsx(testClasses["chart-filters"], styles["chart-filters"])}>
      {seriesFilter && (
        <div className={clsx(testClasses["chart-filters-series"], styles["chart-filters-series"])}>
          <ChartSeriesFilter api={api} i18nStrings={i18nStrings} />
        </div>
      )}
      {additionalFilters && <div className={testClasses["chart-filters-additional"]}>{additionalFilters}</div>}
    </div>
  );
}

function ChartSeriesFilter({ api, i18nStrings }: { api: ChartAPI; i18nStrings?: BaseI18nStrings }) {
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
        filterSelectedAriaLabel: i18nStrings?.seriesFilterSelectedAriaLabel,
      }}
    />
  );
}

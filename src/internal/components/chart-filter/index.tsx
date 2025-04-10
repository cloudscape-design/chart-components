// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { memo } from "react";

import { InternalChartFilterLegacy } from "@cloudscape-design/components/internal/do-not-use/chart-filter-legacy";

import { ChartSeriesMarkerType } from "../series-marker";

interface ChartFilterItem {
  id: string;
  name: string;
  color: string;
  active: boolean;
  type: ChartSeriesMarkerType;
}

export interface ChartLegendProps {
  items: readonly ChartFilterItem[];
  onItemVisibilityChange?: (hiddenItems: string[]) => void;
}

export default memo(ChartFilter) as typeof ChartFilter;

function ChartFilter({ items, onItemVisibilityChange }: ChartLegendProps) {
  return (
    <InternalChartFilterLegacy
      series={items.map((i) => ({ label: i.name, type: "rectangle", datum: i.id, color: i.color }))}
      selectedSeries={items.filter((i) => i.active).map((i) => i.id)}
      onChange={(selectedSeries) =>
        onItemVisibilityChange?.(items.map((item) => item.id).filter((id) => !selectedSeries.includes(id)))
      }
    />
  );
}

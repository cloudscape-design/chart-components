// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartI18nStrings } from "../interfaces-base";

export interface ChartLegendProps {
  title?: string;
  actions?: React.ReactNode;
  api: ChartAPI;
  i18nStrings?: ChartI18nStrings;
}

export interface ChartLegendRef {
  highlightItems: (ids: readonly string[]) => void;
  clearHighlight: () => void;
}

export function ChartLegend({ title, actions, api, i18nStrings }: ChartLegendProps) {
  const i18n = useInternalI18n("[charts]");
  const ariaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.legendAriaLabel);

  const legendItems = useSelector(api.store, (s) => s.legend.items);
  if (legendItems.length === 0) {
    return null;
  }
  return (
    <ChartLegendComponent
      ref={(legend) => {
        if (legend) {
          api.registerLegend(legend);
        } else {
          api.unregisterLegend();
        }
      }}
      ariaLabel={ariaLabel}
      legendTitle={title}
      items={legendItems}
      actions={actions}
      onItemVisibilityChange={api.onItemVisibilityChange}
      onItemHighlightEnter={(itemId) => api.highlightChartItems([itemId])}
      onItemHighlightExit={api.clearChartItemsHighlight}
    />
  );
}

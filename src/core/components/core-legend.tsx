// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { BaseI18nStrings, GetLegendTooltipContent } from "../interfaces";

export function ChartLegend({
  api,
  title,
  actions,
  position,
  i18nStrings,
  getLegendTooltipContent,
}: {
  api: ChartAPI;
  title?: string;
  actions?: React.ReactNode;
  position: "bottom" | "side";
  i18nStrings?: BaseI18nStrings;
  getLegendTooltipContent?: GetLegendTooltipContent;
}) {
  const i18n = useInternalI18n("[charts]");
  const ariaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.legendAriaLabel);
  const legendItems = useSelector(api.legendStore, (s) => s.items);
  const isChartTooltipPinned = useSelector(api.tooltipStore, (s) => s.pinned);

  if (legendItems.length === 0) {
    return null;
  }
  return (
    <ChartLegendComponent
      ariaLabel={ariaLabel}
      legendTitle={title}
      items={legendItems}
      actions={actions}
      position={position}
      onItemVisibilityChange={api.onItemVisibilityChange}
      onItemHighlightEnter={(itemId) => api.onHighlightChartItems([itemId])}
      onItemHighlightExit={api.onClearChartItemsHighlight}
      getTooltipContent={(props) => {
        if (isChartTooltipPinned) {
          return null;
        }
        return getLegendTooltipContent?.(props) ?? null;
      }}
    />
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { BaseI18nStrings, CoreChartProps } from "../interfaces";

export function ChartLegend({
  api,
  title,
  actions,
  type,
  position,
  i18nStrings,
  bottomMaxHeight,
  oppositeLegendTitle,
  onItemHighlight,
  getLegendTooltipContent,
}: {
  api: ChartAPI;
  title?: string;
  oppositeLegendTitle?: string;
  bottomMaxHeight?: number;
  actions?: React.ReactNode;
  type: "single" | "dual";
  position: "bottom" | "side";
  i18nStrings?: BaseI18nStrings;
  onItemHighlight?: (detail: CoreChartProps.LegendItemHighlightDetail) => void;
  getLegendTooltipContent?: CoreChartProps.GetLegendTooltipContent;
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
      type={type}
      defaultTitle={title}
      oppositeTitle={oppositeLegendTitle}
      items={legendItems}
      actions={actions}
      position={position}
      bottomMaxHeight={bottomMaxHeight}
      onItemVisibilityChange={api.onItemVisibilityChange}
      onItemHighlightExit={api.onClearChartItemsHighlight}
      onItemHighlightEnter={(item) => {
        api.onHighlightChartItems([item.id]);
        onItemHighlight?.({ item });
      }}
      getTooltipContent={(props) => {
        if (isChartTooltipPinned) {
          return null;
        }
        return getLegendTooltipContent?.(props) ?? null;
      }}
    />
  );
}

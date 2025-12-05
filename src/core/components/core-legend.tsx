// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../../internal/events";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { BaseI18nStrings, CoreChartProps } from "../interfaces";

export function ChartLegend({
  api,
  title,
  actions,
  position,
  i18nStrings,
  onItemHighlight,
  onItemHighlightExit,
  getLegendTooltipContent,
  horizontalAlignment = "start",
}: {
  api: ChartAPI;
  title?: string;
  actions?: React.ReactNode;
  position: "bottom" | "side";
  horizontalAlignment?: CoreChartProps.LegendOptionsHorizontalAlignment;
  i18nStrings?: BaseI18nStrings;
  onItemHighlight?: NonCancelableEventHandler<CoreChartProps.LegendItemHighlightDetail>;
  onItemHighlightExit?: NonCancelableEventHandler;
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
      legendTitle={title}
      items={legendItems}
      horizontalAlignment={horizontalAlignment}
      actions={actions}
      position={position}
      onItemVisibilityChange={api.onItemVisibilityChange}
      onItemHighlightExit={() => {
        api.onClearChartItemsHighlight();
        fireNonCancelableEvent(onItemHighlightExit);
      }}
      onItemHighlightEnter={(item) => {
        api.onHighlightChartItems([item.id]);
        fireNonCancelableEvent(onItemHighlight, { item });
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

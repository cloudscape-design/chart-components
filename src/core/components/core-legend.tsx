// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../../internal/events";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { CoreChartProps, CoreI18nStrings } from "../interfaces";

export function ChartLegend({
  api,
  title,
  actions,
  alignment,
  isSecondary,
  i18nStrings,
  onItemHighlight,
  getLegendTooltipContent,
  horizontalAlignment = "start",
}: {
  api: ChartAPI;
  title?: string;
  isSecondary: boolean;
  actions?: React.ReactNode;
  alignment: "horizontal" | "vertical";
  horizontalAlignment?: "start" | "center" | "end";
  i18nStrings?: CoreI18nStrings;
  onItemHighlight?: NonCancelableEventHandler<CoreChartProps.LegendItemHighlightDetail>;
  getLegendTooltipContent?: CoreChartProps.GetLegendTooltipContent;
}) {
  const i18n = useInternalI18n("[charts]");
  // TODO: This is a temporary approach for the initial release.
  // We need a change to @cloudscape-design/components to provide built-in i18n support
  // for the secondary legend ARIA label (similar to legendAriaLabel).
  // For now, only the primary legend has built-in i18n support via the i18n() call,
  // while the secondary legend requires explicit user-provided i18nStrings.secondaryLegendAriaLabel.
  const legendAriaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.legendAriaLabel);
  const secondaryLegendAriaLabel = i18nStrings?.secondaryLegendAriaLabel;
  const ariaLabel = isSecondary ? secondaryLegendAriaLabel : legendAriaLabel;

  const legendItems = useSelector(api.legendStore, (s) => s.items);
  const someHighlighted = legendItems.some((item) => item.highlighted);
  const isChartTooltipPinned = useSelector(api.tooltipStore, (s) => s.pinned);
  const filteredItems = isSecondary
    ? legendItems.filter((item) => item.isSecondary)
    : legendItems.filter((item) => !item.isSecondary);

  const onToggleItem = (itemId: string) => {
    const visibleItems = legendItems.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.includes(itemId)) {
      api.onItemVisibilityChange(visibleItems.filter((visibleItemId) => visibleItemId !== itemId));
    } else {
      api.onItemVisibilityChange([...visibleItems, itemId]);
    }
    // Needed for touch devices.
    api.onClearChartItemsHighlight();
  };

  const onSelectItem = (itemId: string) => {
    const visibleItems = legendItems.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      api.onItemVisibilityChange(legendItems.map((i) => i.id));
    } else {
      api.onItemVisibilityChange([itemId]);
    }
    // Needed for touch devices.
    api.onClearChartItemsHighlight();
  };

  if (filteredItems.length === 0) {
    return null;
  }
  return (
    <ChartLegendComponent
      ariaLabel={ariaLabel}
      legendTitle={title}
      items={filteredItems}
      isSecondary={isSecondary}
      someHighlighted={someHighlighted}
      horizontalAlignment={horizontalAlignment}
      actions={actions}
      alignment={alignment}
      onToggleItem={onToggleItem}
      onSelectItem={onSelectItem}
      onItemHighlightExit={api.onClearChartItemsHighlight}
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

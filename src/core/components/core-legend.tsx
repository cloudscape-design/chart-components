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
  type,
  alignment,
  title,
  actions,
  i18nStrings,
  onItemHighlight,
  getLegendTooltipContent,
}: {
  api: ChartAPI;
  alignment: "horizontal" | "vertical";
  type: "single" | "primary" | "secondary";
  title?: string;
  actions?: React.ReactNode;
  i18nStrings?: BaseI18nStrings;
  onItemHighlight?: NonCancelableEventHandler<CoreChartProps.LegendItemHighlightDetail>;
  getLegendTooltipContent?: CoreChartProps.GetLegendTooltipContent;
}) {
  const i18n = useInternalI18n("[charts]");
  const ariaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.legendAriaLabel);
  const legendItems = useSelector(api.legendStore, (s) => s.items);
  const isChartTooltipPinned = useSelector(api.tooltipStore, (s) => s.pinned);

  const someHighlighted = legendItems.some((item) => item.highlighted);
  const filteredItems =
    type === "single"
      ? legendItems
      : type === "primary"
        ? legendItems.filter((item) => !item.isSecondary)
        : legendItems.filter((item) => item.isSecondary);

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
      type={type}
      alignment={alignment}
      ariaLabel={ariaLabel}
      legendTitle={title}
      items={filteredItems}
      someHighlighted={someHighlighted}
      actions={actions}
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

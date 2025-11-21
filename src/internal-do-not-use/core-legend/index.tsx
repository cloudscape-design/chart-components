// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CoreLegendProps } from "../../core/interfaces";
import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { fireNonCancelableEvent } from "../../internal/events";

export const CoreLegend = ({
  items,
  title,
  actions,
  ariaLabel,
  alignment = "horizontal",
  onItemHighlight,
  onClearHighlight,
  onVisibleItemsChange,
  getLegendTooltipContent,
  horizontalAlignment = "start",
}: CoreLegendProps) => {
  const onToggleItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.includes(itemId)) {
      fireNonCancelableEvent(onVisibleItemsChange, {
        items: visibleItems.filter((visibleItemId) => visibleItemId !== itemId),
      });
    } else {
      fireNonCancelableEvent(onVisibleItemsChange, {
        items: [...visibleItems, itemId],
      });
    }
  };

  const onSelectItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      fireNonCancelableEvent(onVisibleItemsChange, { items: items.map((i) => i.id) });
    } else {
      fireNonCancelableEvent(onVisibleItemsChange, { items: [itemId] });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <ChartLegendComponent
      items={items}
      actions={actions}
      legendTitle={title}
      alignment={alignment}
      horizontalAlignment={horizontalAlignment}
      ariaLabel={ariaLabel}
      someHighlighted={items.some((item) => item.highlighted)}
      onToggleItem={onToggleItem}
      onSelectItem={onSelectItem}
      getTooltipContent={(props) => getLegendTooltipContent?.(props) ?? null}
      onItemHighlightExit={() => fireNonCancelableEvent(onClearHighlight)}
      onItemHighlightEnter={(item) => fireNonCancelableEvent(onItemHighlight, { item })}
    />
  );
};

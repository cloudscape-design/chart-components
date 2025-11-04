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
}: CoreLegendProps) => {
  const type = alignment === "horizontal" ? "bottom" : "stacked";

  if (items.length === 0) {
    return null;
  }

  return (
    <ChartLegendComponent
      type={type}
      items={items}
      actions={actions}
      legendTitle={title}
      ariaLabel={ariaLabel}
      getTooltipContent={(props) => getLegendTooltipContent?.(props) ?? null}
      onItemHighlightExit={() => fireNonCancelableEvent(onClearHighlight)}
      onItemHighlightEnter={(item) => fireNonCancelableEvent(onItemHighlight, { item })}
      onItemVisibilityChange={(items) => fireNonCancelableEvent(onVisibleItemsChange, { items })}
    />
  );
};

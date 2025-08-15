// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StandaloneLegendProps } from "../../core/interfaces";
import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { fireNonCancelableEvent } from "../../internal/events";

export const StandaloneLegend = ({
  items,
  title,
  actions,
  ariaLabel,
  alignment = "horizontal",
  onItemHighlight,
  onClearHighlight,
  onVisibleItemsChange,
  getLegendTooltipContent,
}: StandaloneLegendProps) => {
  const position = alignment === "horizontal" ? "bottom" : "side";

  if (items.length === 0) {
    return null;
  }

  return (
    <ChartLegendComponent
      items={items}
      actions={actions}
      legendTitle={title}
      position={position}
      ariaLabel={ariaLabel}
      getTooltipContent={(props) => getLegendTooltipContent?.(props) ?? null}
      onItemHighlightExit={() => fireNonCancelableEvent(onClearHighlight)}
      onItemHighlightEnter={(item) => fireNonCancelableEvent(onItemHighlight, { item })}
      onItemVisibilityChange={(items) => fireNonCancelableEvent(onVisibleItemsChange, { items })}
    />
  );
};

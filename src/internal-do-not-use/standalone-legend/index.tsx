// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { StandaloneLegendProps } from "../../core/interfaces";
import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { fireNonCancelableEvent } from "../../internal/events";

export const StandaloneLegend = ({
  items,
  title,
  actions,
  i18nStrings,
  alignment = "horizontal",
  onItemHighlight,
  onClearHighlight,
  onVisibleItemsChange,
  getLegendTooltipContent,
}: StandaloneLegendProps) => {
  const i18n = useInternalI18n("[charts]");
  const ariaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.ariaLabel);
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import { ChartLegendItem, GetLegendPopoverContent } from "../../../core/interfaces";

interface ChartLegendPopoverProps {
  legendItem: ChartLegendItem;
  getLegendPopoverContent?: GetLegendPopoverContent;
  visible: boolean;
  onDismiss: () => void;
  trackRef: React.RefObject<HTMLElement>;
}

export function ChartLegendPopover({
  legendItem,
  getLegendPopoverContent,
  visible,
  onDismiss,
  trackRef,
}: ChartLegendPopoverProps) {
  if (!visible || !getLegendPopoverContent) {
    return null;
  }

  const content = getLegendPopoverContent({ legendItem });

  return (
    <InternalChartTooltip
      trackRef={trackRef}
      trackKey={`legend-${legendItem.id}`}
      container={null}
      dismissButton={false}
      onDismiss={onDismiss}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      size="medium"
      position="bottom"
      minVisibleBlockSize={200}
    >
      {content}
    </InternalChartTooltip>
  );
}

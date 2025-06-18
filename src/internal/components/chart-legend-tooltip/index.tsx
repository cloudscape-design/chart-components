// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import { CoreLegendItem, GetLegendTooltipContent } from "../../../core/interfaces";

interface ChartLegendTooltipProps {
  legendItem: CoreLegendItem;
  getLegendTooltipContent?: GetLegendTooltipContent;
  trackRef: React.RefObject<HTMLElement>;
}

export function ChartLegendTooltip({ legendItem, getLegendTooltipContent, trackRef }: ChartLegendTooltipProps) {
  if (!getLegendTooltipContent) {
    return null;
  }

  const content = getLegendTooltipContent({ legendItem });

  return (
    <InternalChartTooltip
      trackRef={trackRef}
      trackKey={`legend-${legendItem.id}`}
      container={null}
      dismissButton={false}
      onDismiss={() => {}}
      position="bottom"
    >
      {content}
    </InternalChartTooltip>
  );
}

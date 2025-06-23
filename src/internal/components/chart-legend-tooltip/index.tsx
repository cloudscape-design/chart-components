// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import { CoreLegendItem, GetLegendTooltipContent } from "../../../core/interfaces";

interface ChartLegendTooltipProps {
  legendItem: CoreLegendItem;
  getLegendTooltipContent?: GetLegendTooltipContent;
  trackRef: React.RefObject<HTMLElement>;
  setTooltipItemId: (itemId: string | null) => void;
  position: "bottom" | "left";
}

export const ChartLegendTooltip = forwardRef<HTMLElement, ChartLegendTooltipProps>(
  ({ legendItem, getLegendTooltipContent, trackRef, setTooltipItemId, position }, ref) => {
    if (!getLegendTooltipContent) {
      return null;
    }

    const content = getLegendTooltipContent({ legendItem });

    return (
      <InternalChartTooltip
        ref={ref}
        trackRef={trackRef}
        trackKey={legendItem.id}
        container={null}
        dismissButton={false}
        position={position}
        title={content.header}
        onDismiss={() => {
          setTooltipItemId(null);
        }}
        onMouseEnter={() => {
          setTooltipItemId(legendItem.id);
        }}
        onMouseLeave={() => {
          setTooltipItemId(null);
        }}
        onBlur={() => {
          setTooltipItemId(null);
        }}
        footer={
          content.footer && (
            <>
              <hr aria-hidden={true} />
              {content.footer}
            </>
          )
        }
      >
        {content.body}
      </InternalChartTooltip>
    );
  },
);

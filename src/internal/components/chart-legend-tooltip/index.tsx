// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import { CoreLegendItem, GetLegendTooltipContent } from "../../../core/interfaces";

interface ChartLegendTooltipProps {
  legendItem: CoreLegendItem;
  getLegendTooltipContent?: GetLegendTooltipContent;
  trackRef: React.RefObject<HTMLElement>;
  position: "bottom" | "left";
  onDismiss: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBlur: () => void;
}

export const ChartLegendTooltip = forwardRef<HTMLElement, ChartLegendTooltipProps>(
  ({ legendItem, getLegendTooltipContent, trackRef, position, onDismiss, onMouseEnter, onMouseLeave, onBlur }, ref) => {
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
        onDismiss={onDismiss}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onBlur={onBlur}
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { NonCancelableEventHandler } from "../internal/events";

export interface ZoomOptions {
  enabled?: boolean;
  hideZoomControls?: boolean;
}

// The range is nested under the axis it applies to, leaving room for a "y" range should zooming
// along the y-axis be supported later, without a breaking change to the property shape.
export interface ZoomRange {
  x?: { startValue: number; endValue: number };
}

export interface ZoomChangeDetail {
  zoomRange: ZoomRange | null;
}

// The zoom properties accepted by the internal core chart. They are not part of any public component
// interface yet.
export interface InternalZoomProps {
  zoom?: ZoomOptions;
  zoomRange?: ZoomRange | null;
  onZoomRangeChange?: NonCancelableEventHandler<ZoomChangeDetail>;
}

// Delays series highlight, legend highlight, legend scroll-into-view, and the tooltip together until the pointer
// settles on a target, while the cursor marks the hovered point immediately. It supersedes tooltip.debounce, which
// only delays the tooltip: tooltip.debounce is ignored while hoverDebounce is set, and is planned for removal once
// consumers have moved to hoverDebounce.
export interface InternalHoverProps {
  hoverDebounce?: number | boolean;
}

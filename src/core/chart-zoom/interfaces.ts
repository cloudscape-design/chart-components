// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// The public shape of the zoom feature, owned by the core chart and re-exported by the components that
// expose it. It lives next to the zoom implementation, rather than in the chart interfaces, so that the
// zoom module has no dependency on them.

export interface ZoomOptions {
  enabled?: boolean;
  hideButtons?: boolean;
}

// The range is nested under the axis it applies to, leaving room for a "y" range should zooming
// along the y-axis be supported later, without a breaking change to the property shape.
export interface ZoomRange {
  x?: { startValue: number; endValue: number };
}

export interface ZoomChangeDetail {
  zoomRange: ZoomRange | null;
}

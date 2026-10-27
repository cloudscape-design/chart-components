// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface ZoomOptions {
  enabled?: boolean;
  hideZoomControls?: boolean;
}

// The range is nested under the axis it applies to, leaving room for a "y" range later without a breaking change.
export interface ZoomRange {
  x?: { startValue: number; endValue: number };
}

export interface ZoomChangeDetail {
  zoomRange: ZoomRange | null;
}

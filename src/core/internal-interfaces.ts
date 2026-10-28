// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { NonCancelableEventHandler } from "../internal/events";
import { CoreChartProps } from "./interfaces";

// The zoom properties accepted by the internal core chart. They are not part of any public component
// interface yet.
export interface InternalZoomProps {
  zoom?: CoreChartProps.ZoomOptions;
  zoomRange?: CoreChartProps.ZoomRange | null;
  onZoomRangeChange?: NonCancelableEventHandler<CoreChartProps.ZoomChangeDetail>;
}

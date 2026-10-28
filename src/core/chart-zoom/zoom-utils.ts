// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { hasColumnLikeSeries } from "../utils";

// Resolves the Highcharts options the zoom overrides while it is enabled. When zoom is not enabled, nothing is
// overridden, so that the consumer's own options apply as they are.
export function resolveZoomOptions(options: Highcharts.Options, zoomEnabled: boolean) {
  if (!zoomEnabled) {
    return { firstXAxis: {}, errorbar: {} };
  }
  return {
    // Highcharts widens any range narrower than five times the closest point distance unless the axis declares
    // a minRange, and reads zero as not declared. The smallest positive number lets the zoom show any range.
    firstXAxis: { minRange: Number.MIN_VALUE },
    // Error bars pad the axis by half a point range on each side, so the zoomed plot would show more than the
    // zoomed range. Without bars in the chart nothing needs that room, so the error bars are placed on their x.
    errorbar: hasColumnLikeSeries(options.series) ? {} : { pointPlacement: "on" as const },
  };
}

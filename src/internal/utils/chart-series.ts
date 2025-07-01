// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Series } from "highcharts";

interface InternalSeries extends Series {
  options: Series["options"] & {
    isInternal?: boolean;
  };
}

export function getChartSeries(series: InternalSeries[]) {
  // Filters out internal series from chart, e.g., series from navigator, scrollbar, etc.

  return series.filter((s) => !s.options.isInternal);
}

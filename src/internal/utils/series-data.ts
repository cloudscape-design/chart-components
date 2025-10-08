// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Point } from "highcharts";

// Although series data can't be undefined according to Highcharts API, it does become undefined for chart containing more datapoints
// than the cropThreshold for that series (specific cases of re-rendering the chart with updated options listening to setExteme updates)
export const getSeriesData = (data: Array<Point>): Array<Point> => {
  return data.filter((d) => !!d);
};

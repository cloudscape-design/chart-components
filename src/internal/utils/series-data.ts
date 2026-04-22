// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Point } from "highcharts";

// We check point.series explicitly because Highcharts can destroy point objects, replacing the
// contents with { destroyed: true }, violating the point's TS contract.
// See: https://github.com/highcharts/highcharts/issues/23175.
export function isPointVisible(point: null | Highcharts.Point) {
  return point && point.visible && point.series && point.series.visible;
}

// Although series data can't be undefined according to Highcharts API, it does become undefined for chart containing more datapoints
// than the cropThreshold for that series (specific cases of re-rendering the chart with updated options listening to setExtreme updates).
export const getSeriesData = (data: Array<Point>): Array<Point> => {
  return data.filter((d) => isPointVisible(d));
};

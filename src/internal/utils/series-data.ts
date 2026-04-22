// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Point } from "highcharts";

// The method checks if the point is defined and not destroyed.
// The point can be undefined when accessing it from series.data array.
// The point can be destroyed by Highcharts and replaced with { destroyed: true } when
// the actual point is removed, but a reference to it is still preserved somewhere.
// See: https://github.com/highcharts/highcharts/issues/23175.
export function isPointVisible(point: null | Highcharts.Point) {
  return point && point.visible && point.series && point.series.visible;
}

// The series.data may include undefined points. See: https://api.highcharts.com/class-reference/Highcharts.Series.html#data,
// and https://github.com/highcharts/highcharts/issues/11116.
// This can create issues when iterating over the data (using Array.filter() or Array.map() methods is safe, but index access or Array.find()
// can cause a crash if accessing point's properties without checking).
export const getSeriesData = (data: Array<Point>): Array<Point> => {
  return data.filter((d) => isPointVisible(d));
};

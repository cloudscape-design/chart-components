// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

type IdToSeriesMapping = Map<string, { series: Highcharts.Series; data: Map<string, Highcharts.Point> }>;

export function getSeriesToIdMap(allSeries: Highcharts.Series[]): IdToSeriesMapping {
  const mapping: IdToSeriesMapping = new Map();

  for (const series of allSeries) {
    const id = series.userOptions.id ?? series.name;
    if (id) {
      const data = new Map<string, Highcharts.Point>();
      for (const point of series.data) {
        const id = point.options.id ?? point.options.name;
        if (id) {
          data.set(id, point);
        }
      }
      mapping.set(id, { series, data });
    }
  }

  return mapping;
}

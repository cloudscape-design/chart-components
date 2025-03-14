// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

export function setVisibleSeries(chart: Highcharts.Chart, visibleSeries: null | string[]): boolean {
  let stateChanged = false;
  const visibleSeriesSet = visibleSeries ? new Set(visibleSeries) : null;
  for (const series of chart.series) {
    const isVisible = !visibleSeriesSet || visibleSeriesSet.has(getSeriesId(series));
    if (isVisible !== series.visible) {
      series.setVisible(isVisible);
      stateChanged = true;
    }
  }
  return stateChanged;
}

export function setVisiblePoints(chart: Highcharts.Chart, visiblePoints: null | string[]): boolean {
  let stateChanged = false;
  const visiblePointsSet = visiblePoints ? new Set(visiblePoints) : null;
  for (const series of chart.series) {
    for (const point of series.data) {
      const isVisible = !visiblePointsSet || visiblePointsSet.has(getPointId(point));
      if (isVisible !== point.visible) {
        point.setVisible(isVisible);
        stateChanged = true;
      }
    }
  }
  return stateChanged;
}

export function getSeriesId(series: Highcharts.Series): string {
  return series.options.id ?? series.options.name ?? noIdPlaceholder();
}

export function getPointId(point: Highcharts.Point): string {
  return point.options.id ?? point.options.name ?? noIdPlaceholder();
}

export function getOptionsId(options: { id?: string; name?: string }): string {
  return options.id ?? options.name ?? noIdPlaceholder();
}

function noIdPlaceholder() {
  const rand = (Math.random() * 1_000_000).toFixed(0).padStart(6, "0");
  return "awsui-no-id-placeholder-" + rand;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

// Series types Highcharts draws with a width along the x axis. The axis is padded by half a point range on
// each side for them, so the first and last bars are not cut by the plot edges.
const COLUMN_LIKE_SERIES_TYPES = new Set(["bar", "column"]);

export function hasColumnLikeSeries(allSeries: Highcharts.Options["series"] = []): boolean {
  return allSeries.some((series) => "type" in series && COLUMN_LIKE_SERIES_TYPES.has(series.type));
}

// The values a consumer's chart would use for the options the zoom overrides. When zoom is off they are given back
// explicitly, because Highcharts merges option updates over the previous ones, and they include the global
// Highcharts.setOptions defaults, which an explicit option would otherwise override.
export function getInheritedZoomOptions(highcharts: null | typeof Highcharts, options: Highcharts.Options) {
  const globalOptions = highcharts?.getOptions();
  // The deprecated zoomType and pinchType are not typed in Highcharts 12, but still take precedence over zooming.
  const chart = options.chart as undefined | DeprecatedZoomOptions;
  const globalChart = globalOptions?.chart as undefined | DeprecatedZoomOptions;
  const globalXAxis = Array.isArray(globalOptions?.xAxis) ? globalOptions?.xAxis[0] : globalOptions?.xAxis;
  return {
    nativeZoom: {
      zooming: {
        ...options.chart?.zooming,
        type: chart?.zooming?.type ?? globalChart?.zooming?.type,
        pinchType: chart?.zooming?.pinchType ?? globalChart?.zooming?.pinchType,
      },
      zoomType: chart?.zoomType ?? globalChart?.zoomType,
      pinchType: chart?.pinchType ?? globalChart?.pinchType,
    } as Highcharts.ChartOptions,
    minRange: globalXAxis?.minRange,
    // The chart's own plotOptions.errorbar is applied over this. Highcharts resolves the type options before the
    // series options, each with the chart's options over the global ones.
    errorBarPointPlacement:
      globalOptions?.plotOptions?.errorbar?.pointPlacement ??
      options.plotOptions?.series?.pointPlacement ??
      globalOptions?.plotOptions?.series?.pointPlacement,
  };
}

type ZoomingType = NonNullable<Highcharts.ChartZoomingOptions["type"]>;

interface DeprecatedZoomOptions extends Highcharts.ChartOptions {
  zoomType?: ZoomingType;
  pinchType?: ZoomingType;
}

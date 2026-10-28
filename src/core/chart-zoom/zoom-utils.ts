// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { hasColumnLikeSeries } from "../utils";

// Resolves the Highcharts options the zoom depends on. When zoom is enabled, Highcharts' own drag-to-zoom is turned
// off, and the axis and error bars are set up to show the zoomed range exactly. Otherwise the chart's own and the
// global Highcharts.setOptions values are given back explicitly, because Highcharts merges option updates over
// the previous ones, and an explicit option would override the global one.
export function resolveZoomOptions(
  highcharts: null | typeof Highcharts,
  options: Highcharts.Options,
  zoomEnabled: boolean,
) {
  const globalOptions = highcharts?.getOptions();
  // The deprecated zoomType and pinchType are not typed in Highcharts 12, but still take precedence over zooming.
  const chart = options.chart as undefined | DeprecatedZoomOptions;
  const globalChart = globalOptions?.chart as undefined | DeprecatedZoomOptions;
  const globalXAxis = Array.isArray(globalOptions?.xAxis) ? globalOptions?.xAxis[0] : globalOptions?.xAxis;
  // The chart's own plotOptions.errorbar is applied over this. Highcharts resolves the type options before the
  // series options, each with the chart's options over the global ones.
  const errorBarPointPlacement =
    globalOptions?.plotOptions?.errorbar?.pointPlacement ??
    options.plotOptions?.series?.pointPlacement ??
    globalOptions?.plotOptions?.series?.pointPlacement;
  return {
    nativeZoom: (zoomEnabled
      ? {
          zooming: { ...options.chart?.zooming, type: undefined, pinchType: undefined },
          zoomType: undefined,
          pinchType: undefined,
        }
      : {
          zooming: {
            ...options.chart?.zooming,
            type: chart?.zooming?.type ?? globalChart?.zooming?.type,
            pinchType: chart?.zooming?.pinchType ?? globalChart?.zooming?.pinchType,
          },
          zoomType: chart?.zoomType ?? globalChart?.zoomType,
          pinchType: chart?.pinchType ?? globalChart?.pinchType,
        }) as Highcharts.ChartOptions,
    // Highcharts widens any range narrower than five times the closest point distance unless the axis declares
    // a minRange, and reads zero as not declared. The smallest positive number lets the zoom show any range.
    getXAxisMinRange: (axisIndex: number) =>
      zoomEnabled && axisIndex === 0 ? Number.MIN_VALUE : globalXAxis?.minRange,
    // Error bars pad the axis by half a point range on each side, so the zoomed plot would show more than the
    // zoomed range. Without bars in the chart nothing needs that room, so the error bars are placed on their x.
    errorBarPointPlacement:
      zoomEnabled && !hasColumnLikeSeries(options.series) ? ("on" as const) : errorBarPointPlacement,
  };
}

type ZoomingType = NonNullable<Highcharts.ChartZoomingOptions["type"]>;

interface DeprecatedZoomOptions extends Highcharts.ChartOptions {
  zoomType?: ZoomingType;
  pinchType?: ZoomingType;
}

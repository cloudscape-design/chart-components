// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getOptionsId } from "../core/utils";
import { InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";

export const useCartesianSeries = (
  options: InternalCartesianChartOptions,
  { visibleSeries, emphasizeBaselineAxis }: { visibleSeries: string[]; emphasizeBaselineAxis?: boolean },
) => {
  // Threshold series are converted to empty lines series to be visible in the legend.
  const series: Highcharts.SeriesOptionsType[] = options.series.map((s) => {
    // The awsui-threshold series are added as a combination of plot lines and empty series.
    // This makes them available in the chart's legend.
    if (s.type === "awsui-x-threshold" || s.type === "awsui-y-threshold") {
      return {
        type: "line",
        id: s.id,
        name: s.name,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        data: [],
        ...Styles.thresholdSeriesOptions,
      };
    }
    return { ...s };
  });

  // Threshold series are added to the plot as x- or y-axis plot lines.
  const xPlotLines: Highcharts.XAxisPlotLinesOptions[] = [];
  const yPlotLines: Highcharts.YAxisPlotLinesOptions[] = [];
  for (const s of options.series) {
    const seriesId = getOptionsId(s);
    if (s.type === "awsui-x-threshold" && visibleSeries.includes(seriesId)) {
      xPlotLines.push({
        id: seriesId,
        value: s.value,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        ...Styles.thresholdPlotLineOptions,
      });
    }
    if (s.type === "awsui-y-threshold" && visibleSeries.includes(seriesId)) {
      yPlotLines.push({
        id: seriesId,
        value: s.value,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        ...Styles.thresholdPlotLineOptions,
      });
    }
  }

  // This makes the baseline better prominent in the plot.
  if (emphasizeBaselineAxis) {
    yPlotLines.push({ value: 0, ...Styles.chatPlotBaselineOptions });
  }

  // For scatter series type we enable markers by default, unless explicit markers settings provided.
  // Without markers, the scatter series are not visible by default.
  for (const s of series) {
    if (s.type === "scatter" && !s.marker) {
      s.marker = { enabled: true };
    }
  }

  return { series, xPlotLines, yPlotLines };
};

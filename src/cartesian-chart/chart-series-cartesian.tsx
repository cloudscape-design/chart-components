// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import type Highcharts from "highcharts";

import { CoreChartAPI } from "../core/interfaces-core";
import { getOptionsId } from "../core/utils";
import { InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";

export const useCartesianSeries = (
  getAPI: () => CoreChartAPI,
  {
    options,
    visibleSeries,
    emphasizeBaselineAxis,
  }: {
    options: InternalCartesianChartOptions;
    visibleSeries: readonly string[];
    emphasizeBaselineAxis?: boolean;
  },
) => {
  // Threshold series are converted to empty lines series to be visible in the legend.
  const series: Highcharts.SeriesOptionsType[] = options.series.map((s) => {
    // The awsui-threshold series are added as a combination of plot lines and empty series.
    // This makes them available in the chart's legend.
    if (s.type === "x-threshold" || s.type === "y-threshold") {
      return {
        type: "line",
        id: s.id,
        name: s.name,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        data: undefined,
        custom: { awsui: { type: s.type, threshold: s.value } },
        ...Styles.thresholdSeriesOptions,
      };
    }
    return { ...s };
  });

  const onChartRender: Highcharts.ChartRenderCallbackFunction = useCallback(() => {
    updateSeriesData(getAPI().chart);
  }, [getAPI]);

  // Threshold series are added to the plot as x- or y-axis plot lines.
  const xPlotLines: Highcharts.XAxisPlotLinesOptions[] = [];
  const yPlotLines: Highcharts.YAxisPlotLinesOptions[] = [];
  for (const s of options.series) {
    const seriesId = getOptionsId(s);
    if (s.type === "x-threshold" && visibleSeries.includes(seriesId)) {
      xPlotLines.push({
        id: seriesId,
        value: s.value,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        ...Styles.thresholdPlotLineOptions,
      });
    }
    if (s.type === "y-threshold" && visibleSeries.includes(seriesId)) {
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

  return { series, xPlotLines, yPlotLines, onChartRender };
};

function updateSeriesData(chart: Highcharts.Chart) {
  const xExtremes = chart.xAxis[0]?.getExtremes();
  const yExtremes = chart.yAxis[0]?.getExtremes();

  for (const s of chart.series) {
    if (typeof s.options.custom === "object" && s.options.custom?.awsui.type === "x-threshold") {
      updateDataIfNeeded(s, [
        { x: s.options.custom.awsui.threshold, y: yExtremes.min },
        { x: s.options.custom.awsui.threshold, y: yExtremes.max },
      ]);
    }
    if (typeof s.options.custom === "object" && s.options.custom?.awsui.type === "y-threshold") {
      updateDataIfNeeded(s, [
        { x: xExtremes.min, y: s.options.custom.awsui.threshold },
        { x: xExtremes.max, y: s.options.custom.awsui.threshold },
      ]);
    }
  }

  function updateDataIfNeeded(series: Highcharts.Series, data: { x: number; y: number }[]) {
    if (
      series.visible &&
      (series.data[0]?.x !== data[0].x ||
        series.data[1]?.x !== data[1].x ||
        series.data[0]?.y !== data[0].y ||
        series.data[1]?.y !== data[1].y)
    ) {
      series.setData(data);
    }
  }
}

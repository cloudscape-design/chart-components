// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import type Highcharts from "highcharts";

import { getOptionsId } from "../core/utils";
import { InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";

import testClasses from "./test-classes/styles.css.js";

export const useCartesianSeries = ({
  options,
  visibleSeries,
  emphasizeBaselineAxis,
}: {
  options: InternalCartesianChartOptions;
  visibleSeries: readonly string[];
  emphasizeBaselineAxis?: boolean;
}) => {
  // The threshold series are added as a combination of series and plot lines.
  // The series are hidden in the plot area, but are visible in the legend.
  const series: Highcharts.SeriesOptionsType[] = options.series.map((s) => {
    if (s.type === "x-threshold" || s.type === "y-threshold") {
      return {
        type: "line",
        id: s.id,
        name: s.name,
        color: s.color ?? Styles.thresholdSeriesDefaultColor,
        data: [],
        custom: createThresholdMetadata(s.type, s.value).custom,
        ...Styles.thresholdSeriesOptions,
      };
    }
    if (s.type === "errorbar" && s.color) {
      return { ...s, stemColor: s.color, whiskerColor: s.color };
    }
    return { ...s };
  });

  // When chart is re-rendered, there is a chance its thresholds series data or extremes changed.
  // We compare the new state against the already rendered one and make adjustments if needed.
  const onChartRender: Highcharts.ChartRenderCallbackFunction = useCallback(function () {
    updateSeriesData(this);
  }, []);

  // The plot lines for threshold series are visible in the chart plot area. Unlike the line series,
  // the plot lines render across the entire chart plot height or width.
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
    yPlotLines.push({ value: 0, ...Styles.chatPlotBaselineOptions, className: testClasses["emphasized-baseline"] });
  }
  return { series, xPlotLines, yPlotLines, options: { onChartRender } };
};

function updateSeriesData(chart: Highcharts.Chart) {
  const allX = new Set<number>();
  const allY = new Set<number>();
  for (const s of chart.series) {
    if (!s.visible) {
      continue;
    }
    for (const p of s.data) {
      if (p.visible) {
        allX.add(p.x);
      }
      if (p.visible && p.y !== undefined && p.y !== null) {
        allY.add(p.y);
      }
    }
  }
  const sortedAllX = [...allX].sort((a, b) => a - b);
  const sortedAllY = [...allY].sort((a, b) => a - b);

  let updated = false;
  for (const s of chart.series) {
    if (isXThreshold(s)) {
      updated = updateXfNeeded(s, s.options.custom.awsui.threshold, sortedAllY) || updated;
    }
    if (isYThreshold(s)) {
      updated = updateYfNeeded(s, s.options.custom.awsui.threshold, sortedAllX) || updated;
    }
  }
  if (updated) {
    chart.redraw();
  }

  // The update only happens if the new coordinates are different from the old.
  function updateXfNeeded(series: Highcharts.Series, x: number, yValues: number[]) {
    if (!series.visible) {
      return false;
    }
    for (let i = 0; i < Math.max(series.data.length, yValues.length); i++) {
      if (series.data[i]?.x !== x || series.data[i]?.y !== yValues[i]) {
        series.setData(
          yValues.map((y) => ({ x, y })),
          false,
        );
        return true;
      }
    }
    return false;
  }
  function updateYfNeeded(series: Highcharts.Series, y: number, xValues: number[]) {
    if (!series.visible) {
      return false;
    }
    for (let i = 0; i < Math.max(series.data.length, xValues.length); i++) {
      if (series.data[i]?.x !== xValues[i] || series.data[i]?.y !== y) {
        series.setData(
          xValues.map((x) => ({ x, y })),
          false,
        );
        return true;
      }
    }
    return false;
  }
}

interface ThresholdOptions<T extends "x-threshold" | "y-threshold"> {
  custom: {
    awsui: {
      type: T;
      threshold: number;
    };
  };
}

function createThresholdMetadata<T extends "x-threshold" | "y-threshold">(type: T, value: number): ThresholdOptions<T> {
  return { custom: { awsui: { type, threshold: value } } };
}
export function isXThreshold(
  s: Highcharts.Series,
): s is Highcharts.Series & { options: ThresholdOptions<"x-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "x-threshold";
}
export function isYThreshold(
  s: Highcharts.Series,
): s is Highcharts.Series & { options: ThresholdOptions<"y-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "y-threshold";
}

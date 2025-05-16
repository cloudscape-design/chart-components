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

  // By default, Highcharts highlights data points that are closest to the cursor. However, for charts that include column
  // series, we need the entire stack (everything matching x-coordinate) to be highlighted instead. This is achieved by enabling
  // the `shared=true` behavior, which is defined in Highcharts tooltip. The tooltip itself is then hidden with styles.
  const tooltip: Highcharts.TooltipOptions = {
    enabled: !!options.series.some((s) => s.type === "column"),
    shared: true,
    style: { opacity: 0 },
  };

  return { series, xPlotLines, yPlotLines, onChartRender, tooltip };
};

function updateSeriesData(chart: Highcharts.Chart) {
  // We search for min, max axes values instead of using axis.getExtremes() API because
  // Highcharts increases the extremes to exceed the actual data values sometimes, which
  // then leads to an infinite update cycle.
  let minX = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxY = Number.MIN_SAFE_INTEGER;
  for (const s of chart.series) {
    for (const p of s.data) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y ?? minY);
      maxY = Math.max(maxY, p.y ?? maxY);
    }
  }

  for (const s of chart.series) {
    if (isXThreshold(s) && minY !== Number.MAX_SAFE_INTEGER && maxY !== Number.MIN_SAFE_INTEGER) {
      updateDataIfNeeded(s, [
        { x: s.options.custom.awsui.threshold, y: minY },
        { x: s.options.custom.awsui.threshold, y: maxY },
      ]);
    }
    if (isYThreshold(s) && minX !== Number.MAX_SAFE_INTEGER && maxX !== Number.MIN_SAFE_INTEGER) {
      updateDataIfNeeded(s, [
        { x: minX, y: s.options.custom.awsui.threshold },
        { x: maxX, y: s.options.custom.awsui.threshold },
      ]);
    }
  }

  // The update only happens if the new coordinates are different from the old.
  function updateDataIfNeeded(series: Highcharts.Series, data: { x: number; y: number }[]) {
    if (!series.visible) {
      return;
    } else if (series.data.length !== 2) {
      series.setData(data);
    } else if (
      series.data[0].x !== data[0].x ||
      series.data[1].x !== data[1].x ||
      series.data[0].y !== data[0].y ||
      series.data[1].y !== data[1].y
    ) {
      series.setData(data);
    }
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
function isXThreshold(s: Highcharts.Series): s is Highcharts.Series & { options: ThresholdOptions<"x-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "x-threshold";
}
function isYThreshold(s: Highcharts.Series): s is Highcharts.Series & { options: ThresholdOptions<"y-threshold"> } {
  return typeof s.options.custom === "object" && s.options.custom.awsui?.type === "y-threshold";
}

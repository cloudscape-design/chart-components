// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { PointDataItemType, RangeDataItemOptions } from "../core/interfaces";
import { createThresholdMetadata, getOptionsId } from "../core/utils";
import * as Styles from "../internal/chart-styles";
import { Writeable } from "../internal/utils/utils";
import { CartesianChartProps } from "./interfaces";

// The utility transforms cartesian chart component's series to Highcharts series. This includes transforming
// custom x- and y-threshold series types, that are represented as a combination of invisible line series, and plot lines.
// The plot lines, unlike series, are rendered across the entire chart plot width or height.
export const transformCartesianSeries = (
  originalSeries: readonly CartesianChartProps.SeriesOptions[],
  visibleSeries: readonly string[],
) => {
  // The injected plot lines have IDs matching the IDs of the threshold series. This is used by the core chart
  // to manage visibility and highlight state for them, when the corresponding threshold series are toggled
  // or highlighted in the legend or filter.
  const xPlotLines: Highcharts.XAxisPlotLinesOptions[] = [];
  const yPlotLines: Highcharts.YAxisPlotLinesOptions[] = [];
  for (const s of originalSeries) {
    const seriesId = getOptionsId(s);
    const style = { ...Styles.thresholdPlotLine, color: s.color ?? Styles.thresholdPlotLine.color };
    if (s.type === "x-threshold" && visibleSeries.includes(seriesId)) {
      xPlotLines.push({ id: seriesId, value: s.value, ...style });
    }
    if (s.type === "y-threshold" && visibleSeries.includes(seriesId)) {
      yPlotLines.push({ id: seriesId, value: s.value, ...style });
    }
  }
  // The threshold series require data points to enable keyboard navigation and hover effects.
  const thresholdX = getThresholdX(originalSeries, visibleSeries);
  const thresholdY = getThresholdY(originalSeries, visibleSeries);
  function transformSeriesToHighcharts(s: CartesianChartProps.SeriesOptions): Highcharts.SeriesOptionsType {
    if (s.type === "x-threshold" || s.type === "y-threshold") {
      const data =
        s.type === "x-threshold"
          ? thresholdY.map((y) => ({ x: s.value, y }))
          : thresholdX.map((x) => ({ x, y: s.value }));
      const { custom } = createThresholdMetadata(s.type, s.value);
      const enableMouseTracking = s.type === "y-threshold";
      const style = { ...Styles.thresholdSeries, color: s.color ?? Styles.thresholdSeries.color };
      return { type: "line", id: s.id, name: s.name, data, custom, enableMouseTracking, ...style };
    }
    if (s.type === "errorbar") {
      // In Highcharts, the error-bar series graphic color is represented as stem-, and whisker colors.
      // We simplify that, and only expose a single color prop that sets both of those.
      const colors = s.color ? { stemColor: s.color, whiskerColor: s.color } : {};
      return { ...s, data: s.data as Writeable<RangeDataItemOptions[]>, ...colors };
    }
    return { ...s, data: s.data as Writeable<PointDataItemType[]> };
  }
  const series = originalSeries.map(transformSeriesToHighcharts);
  // We inject a fake empty series so that the empty state still shows axes, if defined.
  if (series.length === 0) {
    series.push({ type: "line", data: [], showInLegend: false });
  }
  return { series, xPlotLines, yPlotLines };
};

// For x-threshold the point-based navigation is disabled as irrelevant. However, we still need at least
// one data point for core chart to work correctly, so we find the first visible y value from other series.
function getThresholdY(series: readonly CartesianChartProps.SeriesOptions[], visibleSeries: readonly string[]) {
  for (const s of getVisibleDataSeries(series, visibleSeries)) {
    for (const d of s.data) {
      const y = d === null ? null : typeof d === "number" ? d : d.y;
      if (y !== null) {
        return [y];
      }
    }
  }
  return [];
}

// For y-threshold we find all defined x values from other series and use it those to create an array of
// data points. As result, the y-threshold series becomes properly navigable.
function getThresholdX(series: readonly CartesianChartProps.SeriesOptions[], visibleSeries: readonly string[]) {
  const allX = new Set<number>();
  for (const s of getVisibleDataSeries(series, visibleSeries)) {
    for (let i = 0; i < s.data.length; i++) {
      const d = s.data[i];
      const x = (typeof d === "object" ? d?.x : i) ?? i;
      allX.add(x);
    }
  }
  return [...allX].sort((a, b) => a - b);
}

function getVisibleDataSeries(series: readonly CartesianChartProps.SeriesOptions[], visibleSeries: readonly string[]) {
  const dataSeries: Exclude<
    CartesianChartProps.SeriesOptions,
    | CartesianChartProps.XThresholdSeriesOptions
    | CartesianChartProps.YThresholdSeriesOptions
    | CartesianChartProps.ErrorBarSeriesOptions
  >[] = [];
  for (const s of series) {
    if (
      s.type !== "x-threshold" &&
      s.type !== "y-threshold" &&
      s.type !== "errorbar" &&
      visibleSeries.includes(getOptionsId(s))
    ) {
      dataSeries.push(s);
    }
  }
  return dataSeries;
}

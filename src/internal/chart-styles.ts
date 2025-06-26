// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import {
  colorBackgroundContainerContent,
  colorChartsLineTick,
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
  colorChartsThresholdNeutral,
  colorTextBodyDefault,
  colorTextBodySecondary,
  fontFamilyBase,
  fontSizeBodyM,
  fontSizeBodyS,
  fontWeightHeadingS,
} from "@cloudscape-design/design-tokens";

import styles from "./styles.css.js";

// Here we define chart styles and colors, used across multiple components, including core chart, cartesian- and pie charts,
// series markers.

export const colors = [
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
];

export const chart: Highcharts.ChartOptions = {
  spacing: [10, 10, 0, 0],
  backgroundColor: "transparent",
};

export const axisTitleCss: Highcharts.CSSObject = {
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
  fontWeight: fontWeightHeadingS,
};

export const axisLabelsCss: Highcharts.CSSObject = {
  color: colorTextBodySecondary,
  fontSize: fontSizeBodyS,
};

export const xAxisOptions: Highcharts.XAxisOptions = {
  tickColor: colorChartsLineTick,
  lineColor: colorChartsLineTick,
  gridLineColor: colorChartsLineTick,
  lineWidth: 1,
  crosshair: false,
};

export const yAxisOptions: Highcharts.YAxisOptions = {
  tickColor: colorChartsLineTick,
  lineColor: colorChartsLineTick,
  gridLineColor: colorChartsLineTick,
  lineWidth: 0,
  crosshair: false,
};

export const chartPlotCss: Highcharts.CSSObject = {
  font: fontFamilyBase,
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
};

export const seriesBorderColor = colorBackgroundContainerContent;

export const hiddenSeriesMarker = { enabled: false, radius: 3, symbol: "circle" };

export const areaSeries = {
  fillOpacity: 0.4,
  marker: hiddenSeriesMarker,
};

export const lineSeries = {
  marker: hiddenSeriesMarker,
};

export const columnSeries = {
  groupPadding: 0.075,
  borderRadius: 4,
  borderWidth: 2,
  marker: hiddenSeriesMarker,
};

export const errorbarSeries = {
  color: colorChartsThresholdNeutral,
  stemColor: colorChartsThresholdNeutral,
  whiskerColor: colorChartsThresholdNeutral,
};

export const pieSeries = {
  borderWidth: 2,
  // This sets the color of the empty pie/donut ring.
  // See: https://github.com/highcharts/highcharts/issues/23073.
  color: "transparent",
  size: "60%",
};
export const donutSeries = {
  ...pieSeries,
  innerSize: "80%",
};

export const pieSeriesDataLabels = {
  connectorColor: colorChartsThresholdNeutral,
};

export const dimmedPlotLineOpacity = 0.4;

export const seriesDataLabelsCss: Highcharts.CSSObject = {
  font: fontFamilyBase,
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
  fontWeight: fontWeightHeadingS,
  textOutline: "",
};

export const seriesOpacityInactive = 0.2;

export const verticalAxisTitleBlockSize = 24;
export const verticalAxisTitleMargin = 4;

export const navigationFocusOutline = {
  class: styles["focus-outline"],
  "stroke-width": 2,
  rx: 4,
  zIndex: 10,
};

export const cursorLine = {
  fill: colorChartsLineTick,
  zIndex: 5,
  style: "pointer-events: none",
};

export const focusOutlineOffsets = {
  chart: -1,
  group: 4,
  point: 6,
  pointByType: { column: 2, pie: 2 } as Record<string, number | undefined>,
};

export const thresholdSeries: Partial<Highcharts.SeriesLineOptions> = {
  dashStyle: "ShortDash",
  lineWidth: 0,
  color: colorChartsThresholdNeutral,
};

export const thresholdPlotLine: Partial<Highcharts.XAxisPlotLinesOptions | Highcharts.YAxisPlotLinesOptions> = {
  width: 2,
  dashStyle: "ShortDash",
  zIndex: 3,
  color: colorChartsThresholdNeutral,
};

export const chatPlotBaseline: Partial<Highcharts.XAxisPlotLinesOptions> = {
  color: colorChartsLineTick,
  width: 2,
  zIndex: 2,
};

export const innerAreaTitleCss: Highcharts.CSSObject = {
  fontSize: "28",
  fontWeight: "bold",
};

export const innerAreaDescriptionCss: Highcharts.CSSObject = {
  fontSize: "18",
  fontWeight: "bold",
  color: colorTextBodySecondary,
};

export const segmentDescriptionCss: React.CSSProperties = {
  fontFamily: fontFamilyBase,
  fontWeight: "normal",
  fontSize: fontSizeBodyS,
  color: colorTextBodySecondary,
};

export const tooltipSnap = 4;

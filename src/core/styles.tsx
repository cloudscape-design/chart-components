// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import {
  colorBackgroundLayoutMain,
  colorBorderItemFocused,
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

export const chartPlotBackgroundColor = "transparent";

export const seriesBorderColor = colorBackgroundLayoutMain;

export const areaFillOpacity = 0.4;

export const columnGroupPadding = 0.075;

export const columnBorderRadius = 4;

export const columnBorderWidth = 2;

export const dimmedPlotLineOpacity = 0.4;

export const seriesDataLabelsCss: Highcharts.CSSObject = {
  font: fontFamilyBase,
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
  fontWeight: fontWeightHeadingS,
  textOutline: "",
};

export const seriesOpacityInactive = 0.2;

export const focusBorderCss: Highcharts.CSSObject = {
  color: colorBorderItemFocused,
};

export const noDataPosition: Highcharts.NoDataPositionOptions = { align: "left", verticalAlign: "top" };

export const noDataCss: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const verticalAxisTitleBlockSize = 24;
export const verticalAxisTitleMargin = 4;

export const errorBarSeriesColor = colorChartsThresholdNeutral;

export const navigationFocusOutlineStyle = {
  class: styles["focus-outline"],
  "stroke-width": 2,
  rx: 4,
  zIndex: 10,
};

export const defaultMarker = {
  enabled: false,
  radius: 2,
  symbol: "circle",
  fillColor: "transparent",
  lineColor: "transparent",
};

export const colorChartCursor = colorChartsLineTick;

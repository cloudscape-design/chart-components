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
  colorTextBodyDefault,
  colorTextBodySecondary,
  fontFamilyBase,
  fontSizeBodyM,
  fontSizeBodyS,
  fontWeightHeadingS,
} from "@cloudscape-design/design-tokens";

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

const axisOptions: Highcharts.XAxisOptions & Highcharts.YAxisOptions = {
  tickColor: colorChartsLineTick,
  lineColor: colorChartsLineTick,
  gridLineColor: colorChartsLineTick,
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
  ...axisOptions,
  lineWidth: 1,
  crosshair: true,
};

export const yAxisOptions: Highcharts.YAxisOptions = {
  ...axisOptions,
  lineWidth: 0,
  crosshair: false,
};

export const legendTitleCss: Highcharts.CSSObject = {
  fontSize: fontSizeBodyM,
  fontFamily: fontFamilyBase,
};

export const legendItemCss: Highcharts.CSSObject = {
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
};

export const legendBackgroundColor = colorBackgroundLayoutMain;

export const legendSymbolPadding = 8;

export const chartPlotCss: Highcharts.CSSObject = {
  font: fontFamilyBase,
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
};

export const chartPlotBackgroundColor = "transparent";

export const seriesBorderColor = colorBackgroundLayoutMain;

export const seriesDataLabelsCss: Highcharts.CSSObject = {
  font: fontFamilyBase,
  color: colorTextBodyDefault,
  fontSize: fontSizeBodyM,
  fontWeight: fontWeightHeadingS,
  textOutline: "",
};

export const seriesOpacityInactive = 0.4;

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

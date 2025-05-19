// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorChartsLineTick, colorChartsThresholdNeutral } from "@cloudscape-design/design-tokens";

export const thresholdSeriesOptions: Partial<Highcharts.SeriesLineOptions> = {
  dashStyle: "ShortDash",
  lineWidth: 0,
};

export const thresholdSeriesDefaultColor = colorChartsThresholdNeutral;

export const thresholdPlotLineOptions: Partial<Highcharts.XAxisPlotLinesOptions | Highcharts.YAxisPlotLinesOptions> = {
  width: 2,
  dashStyle: "ShortDash",
  zIndex: 5,
};

export const chatPlotBaselineOptions: Partial<Highcharts.XAxisPlotLinesOptions> = {
  color: colorChartsLineTick,
  width: 2,
  zIndex: 3,
};

export const colorChartCursor = colorChartsLineTick;

export const defaultMarker = { enabled: false, radius: 2, symbol: "circle", fillColor: "transparent" };

export const defaultMarkerHoverHalo = { enabled: false, opacity: 0 };

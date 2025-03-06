// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorChartsLineTick, colorChartsThresholdNeutral } from "@cloudscape-design/design-tokens";

export const thresholdSeriesOptions = ({ color }: { color?: string }): Partial<Highcharts.SeriesLineOptions> => ({
  color: color ?? colorChartsThresholdNeutral,
  dashStyle: "ShortDash",
});

export const thresholdPlotLineOptions = ({
  color,
}: {
  color?: string;
}): Partial<Highcharts.XAxisPlotLinesOptions | Highcharts.YAxisPlotLinesOptions> => ({
  color: color ?? colorChartsThresholdNeutral,
  width: 2,
  dashStyle: "ShortDash",
  zIndex: 5,
});

export const chatPlotBaselineOptions: Partial<Highcharts.XAxisPlotLinesOptions> = {
  color: colorChartsLineTick,
  width: 2,
  zIndex: 5,
};

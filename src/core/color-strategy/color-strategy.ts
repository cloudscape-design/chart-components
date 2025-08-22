// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { getDefaultSeriesColor } from "./default-color-strategy";
import { getSolidGaugeSeriesColor } from "./solid-gauge-color-strategy";

/**
 * Gets the color for a Highcharts series based on its type
 * @param series The Highcharts series object to get the color for
 * @returns The color string to use for the series
 */
export const getColor = (series: Highcharts.Series): string => {
  switch (series?.type) {
    case "solidgauge":
      return getSolidGaugeSeriesColor(series);
    default:
      return getDefaultSeriesColor(series);
  }
};

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_COLOR } from "./constants";

// Highcharts supports color objects to represent gradients and more, but we only support string
// colors in our markers. In case a non-string color is defined, we use black color as as fallback.
/**
 * Gets the color for a Highcharts series, with fallback to default color
 * @param series - The Highcharts series object to get color from
 * @returns The series color as a string, or default color if series color is not a string
 */
export const getDefaultSeriesColor = (series: Highcharts.Series): string => {
  return typeof series?.color === "string" ? series.color : DEFAULT_COLOR;
};

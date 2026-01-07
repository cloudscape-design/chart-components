// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { CoreChartProps } from "./interfaces";

// Takes value formatter from the axis options (InternalXAxisOptions.valueFormatter or InternalYAxisOptions.valueFormatter),
// or provides a default formatter for numeric and datetime values.
export function getFormatter(locale: string, axis?: Highcharts.Axis) {
  return (value: unknown): string => {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value !== "number") {
      return "";
    }
    if (!axis) {
      return `${value}`;
    }
    if (axis.options.type === "category") {
      return axis.categories?.[value] ?? value.toString();
    }
    const axisOptions = axis.userOptions as CoreChartProps.XAxisOptions | CoreChartProps.YAxisOptions;
    if (axisOptions.valueFormatter) {
      return axisOptions.valueFormatter(value);
    }
    if (axis.options.type === "datetime") {
      const extremes = axis.getExtremes();
      const formatter = getDefaultDatetimeFormatter([extremes.dataMin, extremes.dataMax]);
      return formatter(value, locale);
    }
    return numberFormatter(value, locale);
  };
}

function getDefaultDatetimeFormatter(extremes: [number, number]): (value: number, locale: string) => string {
  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  if (extremes[1] - extremes[0] > 5 * year) {
    return yearFormatter;
  }
  if (extremes[1] - extremes[0] > 2 * month) {
    return monthFormatter;
  }
  if (extremes[1] - extremes[0] > 3 * day) {
    return dayFormatter;
  }
  if (extremes[1] - extremes[0] > 12 * hour) {
    return hourFormatter;
  }
  if (extremes[1] - extremes[0] > 3 * hour) {
    return minuteFormatter;
  }
  return secondFormatter;
}

function yearFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
  });
}

function monthFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
}

function dayFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function hourFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
  });
}

function minuteFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    hour: "numeric",
    minute: "numeric",
  });
}

function secondFormatter(value: number, locale: string) {
  return new Date(value).toLocaleDateString(locale, {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

/**
 * @see https://www.unicode.org/cldr/cldr-aux/charts/29/verify/numbers/en.html
 */
export function numberFormatter(value: number | null, locale: string): string {
  if (value === null) {
    return "";
  }

  const absValue = Math.abs(value);

  if (absValue === 0) {
    return "0";
  }

  // Use scientific notation for very small numbers
  if (absValue < 10e-3) {
    return new Intl.NumberFormat(locale, {
      notation: "scientific",
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Use compact notation for normal range
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(value);
}

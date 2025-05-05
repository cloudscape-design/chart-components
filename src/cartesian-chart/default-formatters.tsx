// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CartesianChartProps } from "./interfaces-cartesian";

export function getDefaultFormatter(
  axis: CartesianChartProps.XAxisOptions | CartesianChartProps.YAxisOptions,
  extremes: [number, number],
) {
  return (value: unknown): string => {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value !== "number") {
      return "";
    }
    if (axis.valueFormatter) {
      return axis.valueFormatter(value);
    }
    if (axis.type === "category") {
      return axis.categories?.[value] ?? value.toString();
    }
    if (axis.type === "datetime") {
      const formatter = getDefaultDatetimeFormatter(extremes);
      return formatter(value);
    }
    return numberFormatter(value, axis.valueDecimals);
  };
}

function getDefaultDatetimeFormatter(extremes: [number, number]): (value: number) => string {
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

function yearFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
  });
}

function monthFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

function dayFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function hourFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  });
}

function minuteFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });
}

function secondFormatter(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

function numberFormatter(value: number, valueDecimals = 2) {
  return Math.abs(value) >= 1e9
    ? (value / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
    : Math.abs(value) >= 1e6
      ? (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
      : Math.abs(value) >= 1e3
        ? (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
        : value.toFixed(valueDecimals);
}

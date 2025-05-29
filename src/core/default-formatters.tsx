// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalXAxisOptions, InternalYAxisOptions } from "./interfaces-core";

export function getDefaultFormatter(axis: InternalXAxisOptions | InternalYAxisOptions, extremes: [number, number]) {
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
    return numberFormatter(value);
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

function numberFormatter(value: number): string {
  const format = (num: number) => parseFloat(num.toFixed(2)).toString(); // trims unnecessary decimals
  return Math.abs(value) >= 1e9
    ? format(value / 1e9) + "G"
    : Math.abs(value) >= 1e6
      ? format(value / 1e6) + "M"
      : Math.abs(value) >= 1e3
        ? format(value / 1e3) + "K"
        : format(value);
}

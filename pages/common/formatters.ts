// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function dateFormatter(value: number | string) {
  if (typeof value === "string") {
    return value;
  }
  return new Date(value)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: !1,
    })
    .split(",")
    .join("\n");
}

export function numberFormatter(value: number | string) {
  if (typeof value === "string") {
    return value;
  }
  return Math.abs(value) >= 1e9
    ? (value / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
    : Math.abs(value) >= 1e6
      ? (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
      : Math.abs(value) >= 1e3
        ? (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
        : value.toFixed(2);
}

export function moneyFormatter(value: string | number) {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function priceFormatter(value: number) {
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function percentageFormatter(value: string | number) {
  return typeof value === "number" ? `${(100 * value).toFixed(0)}%` : value;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function dateFormatter(value: null | number) {
  if (value === null) {
    return "";
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

export function numberFormatter(value: null | number) {
  if (value === null) {
    return "";
  }
  return Math.abs(value) >= 1e9
    ? (value / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
    : Math.abs(value) >= 1e6
      ? (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
      : Math.abs(value) >= 1e3
        ? (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
        : value.toFixed(2);
}

export function moneyFormatter(value: null | number) {
  if (value === null) {
    return "";
  }
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function priceFormatter(value: null | number) {
  if (value === null) {
    return "";
  }
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function percentageFormatter(value: null | number) {
  if (value === null) {
    return "";
  }
  return `${(100 * value).toFixed(0)}%`;
}

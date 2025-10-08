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

  const format = (num: number) => parseFloat(num.toFixed(2)).toString(); // trims unnecessary decimals

  const absValue = Math.abs(value);

  if (absValue === 0) {
    return "0";
  }

  if (absValue < 0.01) {
    return value.toExponential(0);
  }

  if (absValue >= 1e9) {
    return format(value / 1e9) + "G";
  }

  if (absValue >= 1e6) {
    return format(value / 1e6) + "M";
  }

  if (absValue >= 1e3) {
    return format(value / 1e3) + "K";
  }

  return format(value);
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

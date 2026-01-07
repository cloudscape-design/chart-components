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

/**
 * @see https://www.unicode.org/cldr/cldr-aux/charts/29/verify/numbers/en.html
 */
export function numberFormatter(value: number | null, locale: string = "en-US"): string {
  if (value === null) {
    return "";
  }

  const absValue = Math.abs(value);

  if (absValue === 0) {
    return "0";
  }

  // Use scientific notation for very small numbers
  if (absValue < 1e-9) {
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

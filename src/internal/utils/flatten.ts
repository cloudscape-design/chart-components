// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Flattens array a single level deep
 */
export default function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...val);
    } else {
      acc.push(val);
    }
    return acc;
  }, []);
}

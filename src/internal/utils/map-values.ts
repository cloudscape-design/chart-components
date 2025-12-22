// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Creates an object with the same keys as object and values generated
 * by running each own enumerable string keyed property of object thru iteratee
 */
export default function mapValues<T, U>(
  object: Record<string, T>,
  iteratee: (value: T, key: string) => U,
): Record<string, U> {
  const result: Record<string, U> = {};

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = iteratee(object[key], key);
    }
  }

  return result;
}

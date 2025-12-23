// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Creates an object composed of the own and inherited enumerable property paths
 * of object that are not omitted
 */
export default function omit<T extends Record<string, unknown>, K extends keyof T>(object: T, keyToOmit: K) {
  const result = {} as Partial<T>;

  for (const key in object) {
    if ((key as string as K) !== keyToOmit && Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
  }

  return result as Omit<T, K>;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Creates an object composed of the own and inherited enumerable property paths
 * of object that are not omitted
 */
export default function omit<T extends Record<string, any>, K extends keyof T>(object: T, keys: K[] | K): Omit<T, K> {
  const keysToOmit = Array.isArray(keys) ? keys : [keys];
  const result = {} as Omit<T, K>;

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && !keysToOmit.includes(key as any)) {
      (result as any)[key] = object[key];
    }
  }

  return result;
}

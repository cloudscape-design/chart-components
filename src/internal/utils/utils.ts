// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type SomeRequired<Type, Keys extends keyof Type> = Type & {
  [Key in Keys]-?: Type[Key];
};

// Highcharts series and data arrays are not marked as readonly in TS, but are readonly effectively.
// This creates a conflict with Cloudscape type definitions as we use readonly arrays on input.
// To resolve the conflict, we cast out readonly types to writeable.
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export function castArray<T>(valueOrArray?: T | T[]): undefined | T[] {
  if (!valueOrArray) {
    return undefined;
  }
  if (Array.isArray(valueOrArray)) {
    return valueOrArray;
  }
  return [valueOrArray];
}

export function isEqualArrays<T>(a: readonly T[], b: readonly T[], eq: (a: T, b: T) => boolean) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

export function mergeDeep<T extends object>(defaultOptions?: T, consumerOptions?: T, overrideOptions?: T): T {
  const merged: Partial<T> = {};
  for (const key of getAllKeys(defaultOptions, consumerOptions, overrideOptions)) {
    const defaultValue = defaultOptions?.[key];
    const consumerValue = consumerOptions?.[key];
    const overrideValue = overrideOptions?.[key];
    if (overrideValue !== undefined) {
      merged[key] = overrideValue;
    } else if (defaultValue !== undefined && consumerValue === undefined) {
      merged[key] = defaultValue;
    } else if (defaultValue && typeof defaultValue === "object" && consumerValue && typeof consumerValue === "object") {
      merged[key] = mergeDeep(defaultValue, consumerValue);
    } else {
      merged[key] = consumerValue;
    }
  }
  return merged as T;
}

export function getAllKeys<T extends object>(...objects: (undefined | T)[]): (keyof T)[] {
  const keysSet = new Set<keyof T>();
  for (const obj of objects) {
    for (const key of Object.keys(obj ?? {})) {
      keysSet.add(key as keyof T);
    }
  }
  return [...keysSet];
}

export class DebouncedCall {
  private timeoutRef = setTimeout(() => {}, 0);

  public call(callback: () => void, delay: number) {
    this.cancelPrevious();
    this.timeoutRef = setTimeout(callback, delay);
  }

  public cancelPrevious() {
    clearTimeout(this.timeoutRef);
  }
}

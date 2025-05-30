// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const getAllowedProps = <T extends Record<string, any>>(props?: T): undefined | T => {
  if (!props) {
    return undefined;
  }
  return Object.keys(props).reduce<Partial<T>>((acc: Partial<T>, propName: keyof T) => {
    if (typeof propName === "string" && propName.startsWith("__")) {
      return acc;
    }
    acc[propName] = props[propName];
    return acc;
  }, {}) as T;
};

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

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

export class DebouncedCall {
  private locked = false;
  private lockTimeoutRef = setTimeout(() => {}, 0);
  private timeoutRef = setTimeout(() => {}, 0);

  public call(callback: () => void, delay = -1) {
    if (!this.locked) {
      this.cancelPrevious();
      if (delay === -1) {
        callback();
      } else {
        this.timeoutRef = setTimeout(callback, delay);
      }
    }
  }

  public cancelPrevious() {
    clearTimeout(this.timeoutRef);
  }

  public lock(timeout: number) {
    clearTimeout(this.lockTimeoutRef);
    this.locked = true;
    this.lockTimeoutRef = setTimeout(() => (this.locked = false), timeout);
  }
}

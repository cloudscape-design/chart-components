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

export class SVGRendererPool {
  private circles: Highcharts.SVGElement[] = [];
  private circleIndex = 0;
  private rects: Highcharts.SVGElement[] = [];
  private rectIndex = 0;
  private paths: Highcharts.SVGElement[] = [];
  private pathIndex = 0;

  public hideAll() {
    this.circles.forEach((c) => c.hide());
    this.circleIndex = 0;
    this.rects.forEach((c) => c.hide());
    this.rectIndex = 0;
    this.paths.forEach((c) => c.hide());
    this.pathIndex = 0;
  }

  public destroyAll() {
    this.circles.forEach((c) => c.destroy());
    this.rects.forEach((c) => c.destroy());
    this.paths.forEach((c) => c.destroy());
  }

  public circle(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.circles[this.circleIndex]) {
      return this.circles[this.circleIndex++].attr(attr).show();
    }
    const newCircle = rr.circle().add();
    this.circles.push(newCircle);
    return this.circle(rr, attr);
  }

  public rect(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.rects[this.rectIndex]) {
      return this.rects[this.rectIndex++].attr(attr).show();
    }
    const newRect = rr.rect().add();
    this.rects.push(newRect);
    return this.rect(rr, attr);
  }

  public path(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.paths[this.pathIndex]) {
      return this.paths[this.pathIndex++].attr(attr).show();
    }
    const newPath = rr.path().add();
    this.paths.push(newPath);
    return this.path(rr, attr);
  }
}

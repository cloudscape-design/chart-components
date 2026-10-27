// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll } from "vitest";

// The zoom is drawn and hit-tested against the plot area, so the chart needs a plot area with a real size.
// Highcharts derives it from two browser APIs that jsdom does not implement faithfully: SVGElement.getBBox, which
// jsdom does not provide, and the computed font size of the axis labels, which jsdom returns as an unresolved
// `var(--token, fallback)`. Both make chart.plotHeight NaN. The stubs bring jsdom's geometry in line with a browser.
export function stubPlotGeometry() {
  const nativeGetComputedStyle = window.getComputedStyle.bind(window);
  const nativeGetBBox = (SVGElement.prototype as { getBBox?: () => DOMRect }).getBBox;

  function resolveCustomProperty(value: string) {
    const customPropertyWithFallback = /^var\(\s*--[\w-]+\s*,\s*([^)]+)\)$/.exec(value.trim());
    return customPropertyWithFallback ? customPropertyWithFallback[1].trim() : value;
  }

  beforeAll(() => {
    (SVGElement.prototype as { getBBox?: () => object }).getBBox = () => ({ x: 0, y: 0, width: 20, height: 12 });
    window.getComputedStyle = ((element: Element, pseudoElement?: null | string) => {
      const style = nativeGetComputedStyle(element, pseudoElement);
      return new Proxy(style, {
        get(target, property) {
          if (property === "getPropertyValue") {
            return (name: string) => resolveCustomProperty(target.getPropertyValue(name));
          }
          const value = Reflect.get(target, property, target);
          if (typeof value === "function") {
            return value.bind(target);
          }
          return typeof value === "string" ? resolveCustomProperty(value) : value;
        },
      });
    }) as typeof window.getComputedStyle;
  });

  afterAll(() => {
    if (nativeGetBBox) {
      (SVGElement.prototype as { getBBox?: unknown }).getBBox = nativeGetBBox;
    } else {
      delete (SVGElement.prototype as { getBBox?: unknown }).getBBox;
    }
    window.getComputedStyle = nativeGetComputedStyle;
  });
}

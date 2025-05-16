// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

export class HighchartsTestHelper {
  highcharts: typeof Highcharts;

  constructor(highcharts: typeof Highcharts) {
    this.highcharts = highcharts;
  }

  public getChart() {
    return this.highcharts.charts.filter(Boolean)[0]!;
  }

  public getChartSeries(seriesIndex: number) {
    return this.getChart().series[seriesIndex] as Highcharts.Series & { state: "" };
  }

  public getChartPoint(seriesIndex: number, pointIndex: number) {
    return this.getChart().series[seriesIndex].data[pointIndex] as Highcharts.Point & { state: "" };
  }

  public highlightChartPoint(seriesIndex: number, index: number) {
    this.getChartPoint(seriesIndex, index).onMouseOver();
  }

  public leaveChartPoint(seriesIndex: number, index: number) {
    this.getChartPoint(seriesIndex, index).onMouseOut();
  }

  public clickChartPoint(seriesIndex: number, index: number) {
    this.getChartPoint(seriesIndex, index).graphic!.element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  }

  public getPlotLinesById(id: string) {
    return this.getChart()
      .axes.flatMap((axis) => (axis as any).plotLinesAndBands)
      .filter((plotLine) => plotLine.options.id === id);
  }
}

export function createProxyRenderer(originalRenderer: Highcharts.SVGRenderer) {
  const calls = {
    rect: new Array<{ x?: number; y?: number; width?: number; height?: number }>(),
  };
  const proxy = new Proxy(originalRenderer, {
    get: (target, prop) => {
      if (prop === "rect") {
        return (x?: number, y?: number, width?: number, height?: number) => {
          calls.rect.push({ x, y, width, height });
          return target.rect(x, y, width, height);
        };
      }
      return target[prop];
    },
  });
  return [proxy, calls];
}

export class ChartRendererStub {
  rect() {
    return this;
  }

  attr() {
    return this;
  }

  path() {
    return this;
  }

  add() {
    return null;
  }
}

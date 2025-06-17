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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Chart helper that implements hover interactions for chart plot and points.
export class ChartExtraHover {
  // The chart is only initialized in the render event. Using any methods before that is not expected.
  private _chart: null | Highcharts.Chart = null;
  public get chart(): Highcharts.Chart {
    if (!this._chart) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return this._chart;
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    this._chart = chart;
  };
}

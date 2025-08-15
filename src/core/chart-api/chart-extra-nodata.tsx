// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import AsyncStore from "../../internal/utils/async-store";
import { getChartSeries } from "../../internal/utils/chart-series";
import { ChartExtraContext } from "./chart-extra-context";

// The reactive state is used to propagate updates to the corresponding no-data React component.
// It can be used by other components to assert if the chart is in no-data state (by checking if container is present).
export interface ReactiveNodataState {
  visible: boolean;
  style: React.CSSProperties;
  noMatch: boolean;
}

// Chart helper that implements custom nodata behaviors.
export class ChartExtraNodata extends AsyncStore<ReactiveNodataState> {
  private context: ChartExtraContext;

  constructor(context: ChartExtraContext) {
    super({ visible: false, style: {}, noMatch: false });
    this.context = context;
  }

  public onChartRender = () => {
    if (!this.context.settings.noDataEnabled) {
      return;
    }
    const allSeriesWithData = findAllSeriesWithData(this.chart);
    const visibleSeries = findAllVisibleSeries(this.chart);
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this.set(() => ({ visible: false, style: {}, noMatch: false }));
    } else {
      this.set(() => ({ visible: true, style: this.getContainerStyle(), noMatch: allSeriesWithData.length > 0 }));
    }
  };

  private getContainerStyle(): React.CSSProperties {
    const blockOffset = this.chart.chartHeight - this.chart.plotHeight;
    return { insetBlockEnd: `${blockOffset}px` };
  }

  private get chart() {
    return this.context.chart();
  }
}

function findAllSeriesWithData(chart: Highcharts.Chart) {
  // When a series becomes hidden, Highcharts no longer computes the data array, so the series.data is empty.
  // That is why we assert the data from series.options instead.
  return getChartSeries(chart.series).filter((s) => {
    const data = "data" in s.options && s.options.data && Array.isArray(s.options.data) ? s.options.data : [];
    return data.some((i) => i !== null && (typeof i === "object" && "y" in i ? i.y !== null : true));
  });
}

function findAllVisibleSeries(chart: Highcharts.Chart) {
  const allSeriesWithData = findAllSeriesWithData(chart);
  return allSeriesWithData.filter(
    (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
  );
}

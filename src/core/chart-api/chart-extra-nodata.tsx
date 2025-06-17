// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import AsyncStore from "../../internal/utils/async-store";
import { ChartExtraContext } from "./chart-extra-context";

import styles from "../styles.css.js";

// The reactive state is used to propagate updates to the corresponding no-data React component.
// It can be used by other components to assert if the chart is in no-data state (by checking if container is present).
export interface ReactiveNodataState {
  container: null | Element;
  noMatch: boolean;
}

// Chart helper that implements custom nodata behaviors.
export class ChartExtraNodata extends AsyncStore<ReactiveNodataState> {
  private context: ChartExtraContext;
  private noDataContainer: HTMLElement;

  constructor(context: ChartExtraContext) {
    super({ container: null, noMatch: false });
    this.context = context;
    this.noDataContainer = document.createElement("div");
    this.noDataContainer.className = styles["no-data-container"];
  }

  public onChartRender = () => {
    if (!this.context.settings.noDataEnabled) {
      return;
    }
    const allSeriesWithData = findAllSeriesWithData(this.chart);
    const visibleSeries = findAllVisibleSeries(this.chart);
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this.removeContainer();
      this.set(() => ({ container: null, noMatch: false }));
    } else {
      this.appendContainer();
      this.set(() => ({ container: this.noDataContainer, noMatch: allSeriesWithData.length > 0 }));
    }
  };

  private appendContainer() {
    if (!this.chart.container.contains(this.noDataContainer)) {
      this.chart.container.appendChild(this.noDataContainer);
    }
    this.noDataContainer.style.left = `${this.chart.plotLeft}px`;
    this.noDataContainer.style.bottom = `${this.chart.chartHeight - this.chart.plotHeight}px`;
  }

  private removeContainer() {
    if (this.chart.container.contains(this.noDataContainer)) {
      this.chart.container.removeChild(this.noDataContainer);
    }
  }

  private get chart() {
    return this.context.chart();
  }
}

function findAllSeriesWithData(chart: Highcharts.Chart) {
  return chart.series.filter((s) => {
    switch (s.type) {
      case "pie":
        return s.data && s.data.filter((d) => d.y !== null).length > 0;
      default:
        return s.data && s.data.length > 0;
    }
  });
}

function findAllVisibleSeries(chart: Highcharts.Chart) {
  const allSeriesWithData = findAllSeriesWithData(chart);
  return allSeriesWithData.filter(
    (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import AsyncStore from "../../internal/utils/async-store";
import * as Styles from "../styles";
import { ChartExtraContext } from "./chart-extra-context";

// The reactive state is used to propagate updates to the corresponding no-data React component.
// It can be used by other components to assert if the chart is in no-data state (by checking if container is present).
export interface ReactiveNodataState {
  container: null | Element;
  noMatch: boolean;
}

// Chart helper that implements custom nodata behaviors.
export class ChartExtraNodata extends AsyncStore<ReactiveNodataState> {
  private context: ChartExtraContext;
  constructor(context: ChartExtraContext) {
    super({ container: null, noMatch: false });
    this.context = context;
  }

  public onChartRender = () => {
    if (!this.context.settings.noDataEnabled) {
      return;
    }
    const chart = this.context.chart();
    const allSeriesWithData = findAllSeriesWithData(chart);
    const visibleSeries = findAllVisibleSeries(chart);
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this.set(() => ({ container: null, noMatch: false }));
    }
    // Otherwise, we rely on the Highcharts to render the no-data node, for which the no-data module must be available.
    // We use timeout to make sure the no-data container is ready before the React no-data component renders.
    else {
      setTimeout(() => {
        const noDataContainer = chart.container?.querySelector(`[id="${this.noDataId}"]`) as null | HTMLElement;
        if (noDataContainer) {
          noDataContainer.style.width = `${chart.plotWidth}px`;
          noDataContainer.style.height = `${chart.plotHeight}px`;
        }
        this.set(() => ({ container: noDataContainer, noMatch: allSeriesWithData.length > 0 }));
      }, 0);
    }
  };

  // The related Highcharts options to make the no-data work.
  // This relies on the Highcharts no-data module to be available.
  public get options() {
    if (!this.context.settings.noDataEnabled) {
      return {};
    }
    const noData: Highcharts.NoDataOptions = { position: Styles.noDataPosition, useHTML: true };
    const langNoData = renderToStaticMarkup(<div style={Styles.noDataCss} id={this.noDataId}></div>);
    return { noData, langNoData };
  }

  private get noDataId() {
    return `${this.context.settings.chartId}-nodata`;
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

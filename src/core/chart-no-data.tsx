// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import AsyncStore from "../internal/utils/async-store";
import { useUniqueId } from "../internal/utils/unique-id";
import { InternalCoreChartNoDataAPI } from "./interfaces-core";
import * as Styles from "./styles";

// The custom no-data implementation relies on the Highcharts noData module.
// We render a custom empty DIV as `lang.noData` and then provide actual content using React portal.

export function useNoData() {
  const noDataId = useUniqueId("no-data");
  const noDataStore = useRef(new NoDataStore(noDataId)).current;

  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    noDataStore.onChartRender(this);
  };
  const noData: Highcharts.NoDataOptions = { position: Styles.noDataPosition, useHTML: true };
  const langNoData = renderToStaticMarkup(<div style={Styles.noDataCss} id={noDataId}></div>);

  const noDataAPI: InternalCoreChartNoDataAPI = { store: noDataStore };

  return { options: { onChartRender, noData, langNoData }, api: noDataAPI };
}

class NoDataStore extends AsyncStore<{ container: null | Element; noMatch: boolean }> {
  private noDataId: string;

  constructor(noDataId: string) {
    super({ container: null, noMatch: false });
    this.noDataId = noDataId;
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    const allSeriesWithData = chart.series.filter((s) => {
      switch (s.type) {
        case "pie":
          return s.data && s.data.filter((d) => d.y !== null).length > 0;
        default:
          return s.data && s.data.length > 0;
      }
    });
    const visibleSeries = allSeriesWithData.filter(
      (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
    );
    // The no-data is not shown when there is at least one series or point (for pie series) non-empty and visible.
    if (visibleSeries.length > 0) {
      this.set(() => ({ container: null, noMatch: false }));
    }
    // Otherwise, we rely on the Highcharts to render the no-data node, for which the no-data module must be available.
    // We use timeout to make sure the no-data container is rendered.
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
}

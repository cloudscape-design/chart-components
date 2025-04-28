// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import AsyncStore from "../internal/utils/async-store";
import { castArray } from "../internal/utils/utils";
import { InternalCoreVerticalAxisTitleAPI } from "./interfaces-core";

// The custom no-data implementation relies on the Highcharts noData module.
// We render a custom empty DIV as `lang.noData` and then provide actual content using React portal.

export function useChartVerticalAxisTitle() {
  const verticalAxisTitleStore = useRef(new VerticalAxisTitleStore()).current;

  const chartRender: Highcharts.ChartRenderCallbackFunction = function () {
    verticalAxisTitleStore.onChartRender(this);
  };

  const api: InternalCoreVerticalAxisTitleAPI = { store: verticalAxisTitleStore };

  return { options: { chartRender }, api };
}

class VerticalAxisTitleStore extends AsyncStore<{ visible: boolean; titles: string[] }> {
  constructor() {
    super({ visible: false, titles: [] });
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    const isInverted = !!chart.options.chart?.inverted;

    let titles: string[] = [];
    if (isInverted) {
      titles = (castArray(chart.options.xAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }
    if (!isInverted) {
      titles = (castArray(chart.options.yAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }

    this.set(() => ({ visible: titles.length > 0, titles }));
  };
}

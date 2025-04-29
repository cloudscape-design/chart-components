// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import AsyncStore from "../internal/utils/async-store";
import { castArray } from "../internal/utils/utils";
import { InternalCoreAxesAPI } from "./interfaces-core";
import * as Styles from "./styles";

// In Highcharts, the title of the vertical axis (can be either y or x) is titled by 90 degrees and displayed along the axis.
// The utility allows to hide this title to then render it above the chart instead.

export function useChartAxes({
  inverted,
  verticalAxisTitlePlacement,
}: {
  inverted: boolean;
  verticalAxisTitlePlacement: "top" | "side";
}) {
  const verticalAxisTitleStore = useRef(new VerticalAxisTitleStore()).current;

  const chartRender: Highcharts.ChartRenderCallbackFunction = function () {
    verticalAxisTitleStore.onChartRender(this);
  };

  const api: InternalCoreAxesAPI = { store: verticalAxisTitleStore };

  const xAxisTitle: Highcharts.XAxisTitleOptions = {
    style: {
      ...Styles.axisTitleCss,
      opacity: inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
    },
    reserveSpace: inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
  };

  const yAxisTitle: Highcharts.XAxisTitleOptions = {
    style: {
      ...Styles.axisTitleCss,
      opacity: !inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
    },
    reserveSpace: !inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
  };

  return { options: { chartRender, xAxisTitle, yAxisTitle }, api };
}

class VerticalAxisTitleStore extends AsyncStore<{ visible: boolean; titles: string[] }> {
  constructor() {
    super({ visible: false, titles: [] });
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    const isInverted = !!chart.options.chart?.inverted;
    const hasSeries = chart.series.filter((s) => s.type !== "pie").length > 0;

    // We extract multiple titles as there can be multiple axes. This supports up to 2 axes by
    // using space-between placement of the labels in the corresponding component.
    let titles: string[] = [];
    if (hasSeries && isInverted) {
      titles = (castArray(chart.options.xAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }
    if (hasSeries && !isInverted) {
      titles = (castArray(chart.options.yAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }

    this.set(() => ({ visible: titles.length > 0, titles }));
  };
}

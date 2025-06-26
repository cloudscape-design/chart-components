// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AsyncStore from "../../internal/utils/async-store";
import { castArray, isEqualArrays } from "../../internal/utils/utils";
import { ChartExtraContext } from "./chart-extra-context";

// The reactive state is used to propagate changes to the corresponding vertical axis titles React component.
export interface ReactiveAxisTitlesState {
  verticalAxesTitles: readonly string[];
}

// Chart helper to fetch chart vertical axis labels for them to be rendered in a slot above the chart.
// See: https://github.com/highcharts/highcharts/issues/23174.
export class ChartExtraAxisTitles extends AsyncStore<ReactiveAxisTitlesState> {
  private context: ChartExtraContext;
  constructor(context: ChartExtraContext) {
    super({ verticalAxesTitles: [] });
    this.context = context;
  }

  public onChartRender = () => {
    const nextTitles = getVerticalAxesTitles(this.context.chart());
    const currentTitles = this.get().verticalAxesTitles;
    if (!isEqualArrays(currentTitles, nextTitles, (s1, s2) => s1 === s2)) {
      this.set(() => ({ verticalAxesTitles: nextTitles }));
    }
  };
}

function getVerticalAxesTitles(chart: Highcharts.Chart) {
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
  return titles;
}

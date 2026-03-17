// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper, { BaseChartLegendWrapper } from "../internal/base";
import { CartesianChartTooltipWrapper } from "./tooltip";

import testClasses from "../../../cartesian-chart/test-classes/styles.selectors.js";
import coreTestClasses from "../../../core/test-classes/styles.selectors.js";

export default class CartesianChartWrapper extends BaseChartWrapper {
  static rootSelector: string = testClasses.root;

  /**
   * Finds chart's tooltip when visible.
   */
  public findTooltip(): null | CartesianChartTooltipWrapper {
    return this.findComponent(`.${CartesianChartTooltipWrapper.rootSelector}`, CartesianChartTooltipWrapper);
  }

  /**
   * Finds series elements. Use this to assert the number of visible series.
   */
  public findSeries(): Array<ElementWrapper> {
    return this.findAllByClassName("highcharts-series");
  }

  /**
   * Finds chart's secondary legend when using dual-axis charts.
   */
  public findSecondaryLegend(): null | BaseChartLegendWrapper {
    return this.findComponent(
      `.${BaseChartLegendWrapper.rootSelector}.${coreTestClasses["legend-secondary"]}`,
      BaseChartLegendWrapper,
    );
  }

  /**
   * Finds visible title of the secondary y axis in dual-axis charts.
   */
  public findSecondaryYAxisTitle(): null | ElementWrapper {
    const titles = this.findAll(`.highcharts-axis.${coreTestClasses["axis-y"]} > .highcharts-axis-title`);
    return titles[1] ?? null;
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper from "../internal/base";
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
   * Finds the navigator area when `chartNavigator` is enabled.
   * The navigator is the Highcharts built-in mini chart below the main chart
   * that provides drag handles for panning and zooming.
   */
  public findNavigator(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["chart-navigator"]);
  }

  /**
   * Finds the reset zoom button when the chart is zoomed in.
   * The button is rendered when `zoom` is enabled and the user has zoomed into a range.
   */
  public findResetZoomButton(): null | ElementWrapper {
    return this.findByClassName(testClasses["reset-zoom-button"]);
  }
}

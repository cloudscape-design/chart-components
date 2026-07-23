// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper from "../internal/base";
import { CartesianChartTooltipWrapper } from "./tooltip";

import testClasses from "../../../cartesian-chart/test-classes/styles.selectors.js";

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
   * Finds the "Zoom" button that enters zoom mode.
   * Visible when zoom is enabled and the chart is in idle state (not zoomed, not in zoom mode).
   */
  public findZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the "Exit zoom" button that exits zoom mode without applying zoom.
   * Visible when the chart is in zoom mode (waiting for start/end point selection).
   */
  public findExitZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["exit-zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the "Reset" button that resets zoom to show the full data range.
   * Visible when the chart is zoomed in.
   */
  public findResetZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["reset-zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }
}

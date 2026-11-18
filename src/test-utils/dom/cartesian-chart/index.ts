// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
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
   * Finds the zoom button that enters zoom mode.
   */
  public findZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the pressed zoom button that exits zoom mode, shown while a range is being selected.
   */
  public findExitZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["exit-zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the reset button, shown when the chart is zoomed in.
   */
  public findResetZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["reset-zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the zoom cursor, which holds the keyboard focus while a range is being selected.
   */
  public findZoomCursor(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["zoom-cursor"]);
  }
}

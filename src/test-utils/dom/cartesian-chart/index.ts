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
   * Finds the "Zoom" button that enters zoom mode.
   * Visible when zoom is enabled and no range is being selected.
   */
  public findZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the "Exit zoom" button that exits zoom mode without applying zoom.
   * Visible while a zoom range is being selected.
   */
  public findExitZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["exit-zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the "Reset" button that resets zoom to show the full data range.
   * Visible when the chart is zoomed in.
   */
  public findResetZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${coreTestClasses["reset-zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the zoom range cursor. It is a slider, holding the keyboard focus while a range is being selected.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursor(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["zoom-cursor"]);
  }

  /**
   * Finds the button that moves the zoom cursor to the previous data point.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorPreviousButton(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["zoom-cursor-previous-button"]);
  }

  /**
   * Finds the button that moves the zoom cursor to the next data point.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorNextButton(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["zoom-cursor-next-button"]);
  }

  /**
   * Finds the button that sets the start or the end of the zoom range at the cursor.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorCommitButton(): null | ElementWrapper {
    return this.findByClassName(coreTestClasses["zoom-cursor-commit-button"]);
  }
}

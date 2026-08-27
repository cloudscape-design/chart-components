// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper, { BaseChartLegendWrapper } from "./base";

import testClasses from "../../../core/test-classes/styles.selectors.js";

export default class CoreChartWrapper extends BaseChartWrapper {
  public findHeader(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-header"]);
  }

  public findFooter(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-footer"]);
  }

  public findNavigator(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-navigator"]);
  }

  public findLegend({ axisId }: { axisId?: string } = {}): null | CoreChartLegendWrapper {
    const selector = axisId
      ? `.${CoreChartLegendWrapper.rootSelector}[data-axisid="${axisId}"]`
      : `.${CoreChartLegendWrapper.rootSelector}.${testClasses["legend-primary"]}`;
    return this.findComponent(selector, CoreChartLegendWrapper);
  }

  public findVerticalAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-vertical-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-vertical"]} > .highcharts-axis-title`)
    );
  }

  public findHorizontalAxisTitle(): null | ElementWrapper {
    return this.find(`.highcharts-axis.${testClasses["axis-horizontal"]} > .highcharts-axis-title`);
  }

  /**
   * Finds the "Zoom" button that enters zoom mode.
   * Visible when zoom is enabled and no range is being selected.
   */
  public findZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["zoom-button"]} .${ButtonWrapper.rootSelector}`, ButtonWrapper);
  }

  /**
   * Finds the "Exit zoom" button that exits zoom mode without applying zoom.
   * Visible while a zoom range is being selected.
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

  /**
   * Finds the zoom range cursor. It is a slider, holding the keyboard focus while a range is being selected.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursor(): null | ElementWrapper {
    return this.findByClassName(testClasses["zoom-cursor"]);
  }

  /**
   * Finds the button that moves the zoom cursor to the previous data point.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorPreviousButton(): null | ElementWrapper {
    return this.findByClassName(testClasses["zoom-cursor-previous-button"]);
  }

  /**
   * Finds the button that moves the zoom cursor to the next data point.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorNextButton(): null | ElementWrapper {
    return this.findByClassName(testClasses["zoom-cursor-next-button"]);
  }

  /**
   * Finds the button that sets the start or the end of the zoom range at the cursor.
   * Present whenever zoom is enabled, and only shown while a range is being selected.
   */
  public findZoomCursorCommitButton(): null | ElementWrapper {
    return this.findByClassName(testClasses["zoom-cursor-commit-button"]);
  }
}

export class CoreChartLegendWrapper extends BaseChartLegendWrapper {
  public findItemTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }
}

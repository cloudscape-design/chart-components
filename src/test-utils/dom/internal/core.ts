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
   * Finds the zoom button that enters zoom mode.
   */
  public findZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the pressed zoom button that exits zoom mode, shown while a range is being selected.
   */
  public findExitZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["exit-zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the reset button, shown when the chart is zoomed in.
   */
  public findResetZoomButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["reset-zoom-button"]}`, ButtonWrapper);
  }

  /**
   * Finds the zoom cursor, which holds the keyboard focus while a range is being selected.
   */
  public findZoomCursor(): null | ElementWrapper {
    return this.findByClassName(testClasses["zoom-cursor"]);
  }
}

export class CoreChartLegendWrapper extends BaseChartLegendWrapper {
  public findItemTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }
}

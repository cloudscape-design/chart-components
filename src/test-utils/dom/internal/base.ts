// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import testClasses from "../../../core/test-classes/styles.selectors.js";
import legendTestClasses from "../../../internal/components/chart-legend/test-classes/styles.selectors.js";

export default class BaseChartWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses.root;

  /**
   * Finds chart's filters area when default series filter or additional filters are defined.
   */
  public findFilter(): null | BaseChartFilterWrapper {
    return this.findComponent(`.${BaseChartFilterWrapper.rootSelector}`, BaseChartFilterWrapper);
  }

  /**
   * Finds chart's legend when defined.
   */
  public findLegend(): null | BaseChartLegendWrapper {
    return this.findComponent(`.${BaseChartLegendWrapper.rootSelector}`, BaseChartLegendWrapper);
  }

  /**
   * Finds chart's tooltip when visible.
   */
  public findTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }

  /**
   * Finds chart's no-data when the chart is in no-data state.
   */
  public findNoData(): null | BaseChartNoDataWrapper {
    return this.findComponent(`.${testClasses["no-data"]}`, BaseChartNoDataWrapper);
  }

  /**
   * Finds fallback slot, rendered when highcharts=`null`.
   */
  public findFallback(): null | ElementWrapper {
    return this.findByClassName(testClasses.fallback);
  }

  /**
   * Finds focusable chart application element. When focused, it renders a focus outline around the chart,
   * and accepts keyboard commands. The application element is not available in empty charts.
   */
  public findApplication(): null | ElementWrapper {
    return this.findByClassName(testClasses.application);
  }

  /**
   * Finds visible title of the x axis.
   */
  public findXAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-x-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-x"]} > .highcharts-axis-title`)
    );
  }

  /**
   * Finds visible title of the y axis.
   */
  public findYAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-y-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-y"]} > .highcharts-axis-title`)
    );
  }
}

export class BaseChartFilterWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses["chart-filters"];

  /**
   * Finds default series filter when defined.
   */
  public findSeriesFilter(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-series"]);
  }

  /**
   * Finds custom additional filters slot when defined.
   */
  public findAdditionalFilters(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-additional"]);
  }
}

export class BaseChartNoDataWrapper extends ComponentWrapper {
  /**
   * Finds no-data empty slot when the chart is in empty state.
   */
  public findEmpty(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-empty"]);
  }

  /**
   * Finds no-data no-match slot when the chart is in no-match state.
   */
  public findNoMatch(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-no-match"]);
  }

  /**
   * Finds no-data loading slot when the chart is in loading state.
   */
  public findLoading(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-loading"]);
  }

  /**
   * Finds no-data error slot when the chart is in error state.
   */
  public findError(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-error"]);
  }

  /**
   * Finds no-data retry button when the chart is in error state, and uses the default recovery button.
   */
  public findRetryButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["no-data-retry"]}`, ButtonWrapper);
  }
}

interface LegendItemOptions {
  active?: boolean;
}

export class BaseChartLegendWrapper extends ComponentWrapper {
  static rootSelector: string = legendTestClasses.root;

  /**
   * Finds legend's visible title element when defined.
   */
  findTitle(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.title);
  }

  /**
   * Finds legend's actions slot when defined.
   */
  findActions(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.actions);
  }

  /**
   * Finds legend items that match given options:
   * * `active` (optional, boolean) - Matches only active legend items when `true`, and only inactive when `false`.
   * When options are not set, the function matches all legend items.
   */
  findItems(options?: LegendItemOptions): Array<ElementWrapper> {
    let selector = `.${legendTestClasses.item}`;
    if (options?.active === true) {
      selector += `:not(.${legendTestClasses["hidden-item"]})`;
    }
    if (options?.active === false) {
      selector += `.${legendTestClasses["hidden-item"]}`;
    }
    return this.findAll(selector);
  }
}

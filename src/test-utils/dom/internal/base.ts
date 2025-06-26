// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import testClasses from "../../../core/test-classes/styles.selectors.js";
import legendTestClasses from "../../../internal/components/chart-legend/test-classes/styles.selectors.js";

export default class BaseChartWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses.root;

  public findFilter(): null | BaseChartFilterWrapper {
    return this.findComponent(`.${BaseChartFilterWrapper.rootSelector}`, BaseChartFilterWrapper);
  }

  public findLegend(): null | BaseChartLegendWrapper {
    return this.findComponent(`.${BaseChartLegendWrapper.rootSelector}`, BaseChartLegendWrapper);
  }

  public findTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }

  public findNoData(): null | BaseChartNoDataWrapper {
    return this.findComponent(`.${testClasses["no-data"]}`, BaseChartNoDataWrapper);
  }

  public findFallback(): null | ElementWrapper {
    return this.findByClassName(testClasses.fallback);
  }

  public findApplication(): null | ElementWrapper {
    return this.findByClassName(testClasses.application);
  }

  public findChartPlot(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-plot"]);
  }

  public findXAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-x-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-x"]} > .highcharts-axis-title`)
    );
  }

  public findYAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-y-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-y"]} > .highcharts-axis-title`)
    );
  }
}

export class BaseChartFilterWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses["chart-filters"];

  public findSeriesFilter(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-series"]);
  }

  public findAdditionalFilters(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-additional"]);
  }
}

export class BaseChartNoDataWrapper extends ComponentWrapper {
  public findEmpty(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-empty"]);
  }

  public findNoMatch(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-no-match"]);
  }

  public findLoading(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-loading"]);
  }

  public findError(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data-error"]);
  }

  public findRetryButton(): null | ButtonWrapper {
    return this.findComponent(`.${testClasses["no-data-retry"]}`, ButtonWrapper);
  }
}

interface LegendItemOptions {
  active?: boolean;
}

export class BaseChartLegendWrapper extends ComponentWrapper {
  static rootSelector: string = legendTestClasses.root;

  findTitle(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.title);
  }

  findActions(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.actions);
  }

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

  public findItemTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }
}

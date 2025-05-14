// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import testClasses from "../../../core/test-classes/styles.selectors.js";
import legendTestClasses from "../../../internal/components/chart-legend/test-classes/styles.selectors.js";

export default class CoreChartWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses.root;

  public findHeader(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-header"]);
  }

  public findFooter(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-footer"]);
  }

  public findFilter(): null | CoreChartFilterWrapper {
    return this.findComponent(`.${CoreChartFilterWrapper.rootSelector}`, CoreChartFilterWrapper);
  }

  public findLegend(): null | CoreChartLegendWrapper {
    return this.findComponent(`.${CoreChartLegendWrapper.rootSelector}`, CoreChartLegendWrapper);
  }

  public findTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }

  public findNoData(): null | ElementWrapper {
    return this.findByClassName(testClasses["no-data"]);
  }

  public findFallback(): null | ElementWrapper {
    return this.findByClassName(testClasses.fallback);
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

  public findVerticalAxisTitle(): null | ElementWrapper {
    return (
      this.findByClassName(testClasses["axis-vertical-title"]) ??
      this.find(`.highcharts-axis.${testClasses["axis-vertical"]} > .highcharts-axis-title`)
    );
  }

  public findHorizontalAxisTitle(): null | ElementWrapper {
    return this.find(`.highcharts-axis.${testClasses["axis-horizontal"]} > .highcharts-axis-title`);
  }
}

export class CoreChartFilterWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses["chart-filters"];

  findSeriesFilter(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-series"]);
  }

  findAdditionalFilters(): null | ElementWrapper {
    return this.findByClassName(testClasses["chart-filters-additional"]);
  }
}

// TODO: replace `hidden` with `active` and remove `dimmed` as irrelevant for consumers.
interface LegendItemOptions {
  hidden?: boolean;
  dimmed?: boolean;
}

export class CoreChartLegendWrapper extends ComponentWrapper {
  static rootSelector: string = legendTestClasses.root;

  findTitle(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.title);
  }

  findActions(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.actions);
  }

  findItems(options?: LegendItemOptions): Array<ElementWrapper> {
    let selector = `.${legendTestClasses.item}`;
    if (options?.hidden === true) {
      selector += `.${legendTestClasses["hidden-item"]}`;
    }
    if (options?.hidden === false) {
      selector += `:not(.${legendTestClasses["hidden-item"]})`;
    }
    if (options?.dimmed === true) {
      selector += `.${legendTestClasses["dimmed-item"]}`;
    }
    if (options?.dimmed === false) {
      selector += `:not(.${legendTestClasses["dimmed-item"]})`;
    }
    return this.findAll(selector);
  }
}

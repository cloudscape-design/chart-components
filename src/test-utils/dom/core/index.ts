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

  public findXAxis(): null | CoreChartAxisWrapper {
    return this.findComponent(`.${testClasses["axis-x"]}`, CoreChartAxisWrapper);
  }

  public findYAxis(): null | CoreChartAxisWrapper {
    return this.findComponent(`.${testClasses["axis-y"]}`, CoreChartAxisWrapper);
  }
}

export class CoreChartAxisWrapper extends ComponentWrapper {
  public findTicks(): Array<ElementWrapper> {
    return this.findAll("text");
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

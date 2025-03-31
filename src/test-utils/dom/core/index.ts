// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import testClasses from "../../../core/test-classes/styles.selectors.js";
import legendTestClasses from "../../../internal/components/chart-legend/test-classes/styles.selectors.js";

export default class CoreChartWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses.root;

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
}

interface ItemOptions {
  hidden?: boolean;
  status?: "normal" | "warning";
}

export class CoreChartLegendWrapper extends ComponentWrapper {
  static rootSelector: string = legendTestClasses.root;

  findTitle(): ElementWrapper | null {
    return this.findByClassName(legendTestClasses.title);
  }

  findItems(options?: ItemOptions): Array<ElementWrapper> {
    let selector = `.${legendTestClasses.item}`;
    if (options?.hidden) {
      selector += `.${legendTestClasses["hidden-item"]}`;
    }
    if (options?.status) {
      selector += `.${legendTestClasses[`item-status-${options.status}`]}`;
    }
    return this.findAll(selector);
  }
}

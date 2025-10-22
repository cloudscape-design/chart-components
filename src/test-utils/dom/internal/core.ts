// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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

  public findLegend(): null | CoreChartLegendWrapper {
    return this.findComponent(`.${CoreChartLegendWrapper.rootSelector}`, CoreChartLegendWrapper);
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

export class CoreChartLegendWrapper extends BaseChartLegendWrapper {
  public findItemTooltip(): null | ChartTooltipWrapper {
    return this.findComponent(`.${ChartTooltipWrapper.rootSelector}`, ChartTooltipWrapper);
  }
}

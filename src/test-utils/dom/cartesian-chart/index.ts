// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper from "../internal/base";
import { CartesianChartTooltipWrapper } from "./tooltip";

import testClasses from "../../../cartesian-chart/test-classes/styles.selectors.js";

export default class CartesianChartWrapper extends BaseChartWrapper {
  static rootSelector: string = testClasses.root;

  public findTooltip(): null | CartesianChartTooltipWrapper {
    return this.findComponent(`.${CartesianChartTooltipWrapper.rootSelector}`, CartesianChartTooltipWrapper);
  }

  public findSeries(): Array<ElementWrapper> {
    return this.findAllByClassName("highcharts-series");
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CoreChartWrapper, { CoreChartAxisWrapper } from "../core";
import { CartesianChartTooltipWrapper } from "./tooltip";

import testClasses from "../../../cartesian-chart/test-classes/styles.selectors.js";

export default class CartesianChartWrapper extends CoreChartWrapper {
  static rootSelector: string = testClasses.root;

  public findTooltip(): null | CartesianChartTooltipWrapper {
    return this.findComponent(`.${CartesianChartTooltipWrapper.rootSelector}`, CartesianChartTooltipWrapper);
  }

  public findXAxis(): CoreChartAxisWrapper {
    return super.findXAxis()!;
  }

  public findYAxis(): CoreChartAxisWrapper {
    return super.findYAxis()!;
  }
}

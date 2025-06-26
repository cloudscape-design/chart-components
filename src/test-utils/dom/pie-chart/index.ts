// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper from "../internal/base";

import testClasses from "../../../pie-chart/test-classes/styles.selectors.js";

export default class PieChartWrapper extends BaseChartWrapper {
  static rootSelector: string = testClasses.root;

  public findSegments(): Array<ElementWrapper> {
    return this.findAllByClassName("highcharts-point");
  }

  public findInnerValue(): null | ElementWrapper {
    return this.findByClassName(testClasses["inner-value"]);
  }

  public findInnerDescription(): null | ElementWrapper {
    return this.findByClassName(testClasses["inner-description"]);
  }
}

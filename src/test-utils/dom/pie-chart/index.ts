// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import BaseChartWrapper from "../internal/base";

import testClasses from "../../../pie-chart/test-classes/styles.selectors.js";

export default class PieChartWrapper extends BaseChartWrapper {
  static rootSelector: string = testClasses.root;

  /**
   * Finds segments elements. Use this to assert the number of visible segments.
   */
  public findSegments(): Array<ElementWrapper> {
    return this.findAllByClassName("highcharts-point");
  }

  /**
   * Finds donut chart's inner area title when defined.
   */
  public findInnerAreaTitle(): null | ElementWrapper {
    return this.findByClassName(testClasses["inner-value"]);
  }

  /**
   * Finds donut chart's inner area description when defined.
   */
  public findInnerAreaDescription(): null | ElementWrapper {
    return this.findByClassName(testClasses["inner-description"]);
  }
}

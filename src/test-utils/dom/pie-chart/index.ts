// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CoreChartWrapper from "../core";

import testClasses from "../../../pie-chart/test-classes/styles.selectors.js";

export default class PieChartWrapper extends CoreChartWrapper {
  static rootSelector: string = testClasses.root;
}

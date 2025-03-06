// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import testClasses from "../../../cartesian-chart/test-classes/styles.selectors.js";

export default class CartesianChartWrapper extends ComponentWrapper {
  static rootSelector: string = testClasses.root;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/selectors";
import { appendSelector } from "@cloudscape-design/test-utils-core/utils";

export { ElementWrapper };

import CartesianChartWrapper from "./cartesian-chart";
import PieChartWrapper from "./pie-chart";

export { CartesianChartWrapper, PieChartWrapper };

declare module "@cloudscape-design/test-utils-core/dist/selectors" {
  interface ElementWrapper {
    /**
     * Returns a wrapper that matches charts of the given type with the specified CSS selector.
     * If no CSS selector is specified, returns a wrapper that matches charts.
     *
     * @param {"cartesian" | "pie"} [type] Chart type
     * @param {string} [selector] CSS Selector
     * @returns {CartesianChartWrapper | PieChartWrapper}
     */
    findChart(type: "cartesian", selector?: string): CartesianChartWrapper | null;
    findChart(type: "pie", selector?: string): PieChartWrapper | null;

    /**
     * Returns a multi-element wrapper that matches charts of the given type with the specified CSS selector.
     * If no CSS selector is specified, returns a multi-element wrapper that matches charts.
     *
     * @param {"cartesian" | "pie"} [type] Chart type
     * @param {string} [selector] CSS Selector
     * @returns {MultiElementWrapper<CartesianChartWrapper> | MultiElementWrapper<PieChartWrapper>}
     */
    findAllCharts(type: "cartesian", selector?: string): Array<CartesianChartWrapper>;
    findAllCharts(type: "pie", selector?: string): Array<PieChartWrapper>;
  }
}

ElementWrapper.prototype.findChart = function (type, selector) {
  switch (type) {
    case "cartesian":
      return (this as any).findComponent(getComponentSelector(CartesianChartWrapper, selector), CartesianChartWrapper);
    case "pie":
      return (this as any).findComponent(getComponentSelector(PieChartWrapper, selector), PieChartWrapper);
  }
};

ElementWrapper.prototype.findAllCharts = function (type, selector) {
  switch (type) {
    case "cartesian":
      return (this as any).findAllComponents(CartesianChartWrapper, selector);
    case "pie":
      return (this as any).findAllComponents(PieChartWrapper, selector);
  }
};

function getComponentSelector(wrapper: { rootSelector: string }, selector?: string) {
  return selector ? appendSelector(selector, `.${wrapper.rootSelector}`) : `.${wrapper.rootSelector}`;
}

export default function wrapper(root: string = "body") {
  return new ElementWrapper(root);
}

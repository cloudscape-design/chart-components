// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";
import { appendSelector } from "@cloudscape-design/test-utils-core/utils";

export { ElementWrapper };

import CartesianChartWrapper from "./cartesian-chart";
import PieChartWrapper from "./pie-chart";

export { CartesianChartWrapper, PieChartWrapper };

declare module "@cloudscape-design/test-utils-core/dist/dom" {
  interface ElementWrapper {
    /**
     * Returns the wrapper of the first chart of the given type that matches the specified CSS selector.
     * If no CSS selector is specified, returns the wrapper of the first chart of the given type.
     * If no matching chart is found, returns `null`.
     *
     * @param {"cartesian" | "pie"} [type] Chart type
     * @param {string} [selector] CSS Selector
     * @returns {CartesianChartWrapper | PieChartWrapper | null}
     */
    findChart(type: "cartesian", selector?: string): CartesianChartWrapper | null;
    findChart(type: "pie", selector?: string): PieChartWrapper | null;

    /**
     * Returns an array of chart wrapper of the given type that matches the specified CSS selector.
     * If no CSS selector is specified, returns all of the charts of the given type inside the current wrapper.
     * If no matching chart is found, returns an empty array.
     *
     * @param {"cartesian" | "pie"} [type] Chart type
     * @param {string} [selector] CSS Selector
     * @returns {CartesianChartWrapper[] | PieChartWrapper[] | null}
     */
    findAllCharts(type: "cartesian", selector?: string): Array<CartesianChartWrapper>;
    findAllCharts(type: "pie", selector?: string): Array<PieChartWrapper>;
  }
}

ElementWrapper.prototype.findChart = function (type, selector) {
  switch (type) {
    case "cartesian":
      return (this as any).findComponent(getComponentSelector(CartesianChartWrapper, selector), CartesianChartWrapper);
    case "pie": {
      return (this as any).findComponent(getComponentSelector(PieChartWrapper, selector), PieChartWrapper);
    }
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

export default function wrapper(root: Element = document.body) {
  if (document && document.body && !document.body.contains(root)) {
    console.warn(
      "[AwsUi] [test-utils] provided element is not part of the document body, interactions may work incorrectly",
    );
  }
  return new ElementWrapper(root);
}

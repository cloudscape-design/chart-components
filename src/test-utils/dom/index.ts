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
     * Returns the wrapper of the first cartesian chart that matches the specified CSS selector.
     * If no CSS selector is specified, returns the wrapper of the first cartesian chart.
     * If no matching chart is found, returns `null`.
     *
     * @param {string} [selector] CSS Selector
     * @returns {CartesianChartWrapper | null}
     */
    findCartesianHighcharts(selector?: string): CartesianChartWrapper | null;
    /**
     * Returns the wrapper of the first pie chart that matches the specified CSS selector.
     * If no CSS selector is specified, returns the wrapper of the first pie chart.
     * If no matching chart is found, returns `null`.
     *
     * @param {string} [selector] CSS Selector
     * @returns {PieChartWrapper | null}
     */
    findPieHighcharts(selector?: string): PieChartWrapper | null;
    /**
     * Returns an array of cartesian chart wrappers that matches the specified CSS selector.
     * If no CSS selector is specified, returns all cartesian charts inside the current wrapper.
     * If no matching chart is found, returns an empty array.
     *
     * @param {string} [selector] CSS Selector
     * @returns {CartesianChartWrapper[]}
     */
    findAllCartesianHighcharts(selector?: string): Array<CartesianChartWrapper>;
    /**
     * Returns an array of pie chart wrappers that matches the specified CSS selector.
     * If no CSS selector is specified, returns all pie charts inside the current wrapper.
     * If no matching chart is found, returns an empty array.
     *
     * @param {string} [selector] CSS Selector
     * @returns {PieChartWrapper[]}
     */
    findAllPieHighcharts(selector?: string): Array<PieChartWrapper>;
  }
}

ElementWrapper.prototype.findCartesianHighcharts = function (selector) {
  return (this as any).findComponent(getComponentSelector(CartesianChartWrapper, selector), CartesianChartWrapper);
};
ElementWrapper.prototype.findPieHighcharts = function (selector) {
  return (this as any).findComponent(getComponentSelector(PieChartWrapper, selector), PieChartWrapper);
};
ElementWrapper.prototype.findAllCartesianHighcharts = function (selector) {
  return (this as any).findAllComponents(CartesianChartWrapper, selector);
};
ElementWrapper.prototype.findAllPieHighcharts = function (selector) {
  return (this as any).findAllComponents(PieChartWrapper, selector);
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

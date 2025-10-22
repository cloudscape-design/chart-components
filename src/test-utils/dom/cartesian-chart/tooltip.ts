// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import seriesDetailsTestClasses from "../../../internal/components/series-details/test-classes/styles.selectors.js";

export class CartesianChartTooltipWrapper extends ChartTooltipWrapper {
  /**
   * Finds matched tooltip points.
   */
  findPoints() {
    return this.findAll(`.${seriesDetailsTestClasses["list-item"]}`).map(
      (wrapper) => new PointDetailsItemWrapper(wrapper.getElement()),
    );
  }
}

export class PointDetailsSubItemWrapper extends ComponentWrapper {
  /**
   * Finds tooltip point key.
   */
  findKey(): ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.key)!;
  }

  /**
   * Finds tooltip point value.
   */
  findValue(): ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.value)!;
  }

  /**
   * Finds tooltip point description when defined.
   */
  findDescription(): null | ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.description);
  }
}

export class PointDetailsItemWrapper extends PointDetailsSubItemWrapper {
  /**
   * Finds point sub-items when defined.
   */
  findSubItems(): Array<PointDetailsSubItemWrapper> {
    return this.findAll(`.${seriesDetailsTestClasses["inner-list-item"]}`).map(
      (wrapper) => new PointDetailsSubItemWrapper(wrapper.getElement()),
    );
  }
}

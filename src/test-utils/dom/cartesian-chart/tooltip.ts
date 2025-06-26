// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ChartTooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/chart-tooltip";
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";

import seriesDetailsTestClasses from "../../../internal/components/series-details/test-classes/styles.selectors.js";

export class CartesianChartTooltipWrapper extends ChartTooltipWrapper {
  findSeries() {
    return this.findAll(`.${seriesDetailsTestClasses["list-item"]}`).map(
      (wrapper) => new SeriesDetailsItemWrapper(wrapper.getElement()),
    );
  }
}

export class SeriesDetailsSubItemWrapper extends ComponentWrapper {
  findKey(): ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.key)!;
  }

  findValue(): ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.value)!;
  }

  findDescription(): ElementWrapper {
    return this.findByClassName(seriesDetailsTestClasses.description)!;
  }
}

export class SeriesDetailsItemWrapper extends SeriesDetailsSubItemWrapper {
  findSubItems(): Array<SeriesDetailsSubItemWrapper> {
    return this.findAll(`.${seriesDetailsTestClasses["inner-list-item"]}`).map(
      (wrapper) => new SeriesDetailsSubItemWrapper(wrapper.getElement()),
    );
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import tooltipTestClasses from "../../../lib/components/internal/components/popover/test-classes/styles.selectors";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

export class CloudscapeHighchartsWrapper extends ElementWrapper {
  findLegendItems = () => this.findAllByClassName("highcharts-legend-item");
  findHiddenLegendItems = () => this.findAllByClassName("highcharts-legend-item-hidden");
  findLegendItemsWithWarning = () => {
    const items = this.findAllByClassName("highcharts-legend-item");
    return items.filter((wrapper) => wrapper.findByClassName(testClasses["legend-item-warning"]));
  };
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
  findTooltip = () => {
    const wrapper = this.findByClassName(testClasses.tooltip);
    return wrapper ? new TooltipTestWrapper(wrapper.getElement()) : null;
  };
  findNoData = () => this.findByClassName(testClasses["no-data"]);
}

class TooltipTestWrapper extends ComponentWrapper {
  findHeader = () => this.findByClassName(tooltipTestClasses.header);
  findBody = () => this.findByClassName(tooltipTestClasses.body);
  findFooter = () => this.findByClassName(tooltipTestClasses.footer);
}

export function StatefulChart(props: CloudscapeHighchartsProps) {
  const [visibleSeries, setVisibleSeries] = useState<null | string[]>(props.visibleSeries ?? null);
  const [visibleItems, setVisibleItems] = useState<null | string[]>(props.visibleItems ?? null);
  return (
    <CloudscapeHighcharts
      {...props}
      visibleSeries={visibleSeries}
      onToggleVisibleSeries={(state) => {
        setVisibleSeries(state);
        props.onToggleVisibleSeries?.(state);
      }}
      visibleItems={visibleItems}
      onToggleVisibleItems={(state) => {
        setVisibleItems(state);
        props.onToggleVisibleItems?.(state);
      }}
    />
  );
}

type TestProps = Partial<CloudscapeHighchartsProps> & { highcharts: null | typeof Highcharts };

export function renderChart(props: TestProps, Component = CloudscapeHighcharts) {
  const { rerender } = render(<Component options={{}} className="test-chart" {...props} />);
  return {
    wrapper: new CloudscapeHighchartsWrapper(createWrapper().findByClassName("test-chart")!.getElement()),
    rerender: (props: TestProps) => rerender(<Component options={{}} className="test-chart" {...props} />),
  };
}

export function renderStatefulChart(props: TestProps) {
  return renderChart(props, StatefulChart);
}

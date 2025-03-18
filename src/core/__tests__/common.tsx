// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts } from "../../../lib/components/core/chart-core";
import { CloudscapeHighchartsProps } from "../../../lib/components/core/interfaces-core";
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
  findDismissButton = () => this.findComponent(`.${tooltipTestClasses["dismiss-button"]}`, ButtonWrapper) ?? null;
}

export function StatefulChart(props: CloudscapeHighchartsProps) {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>(props.hiddenSeries ?? []);
  const [hiddenItems, setHiddenItems] = useState<string[]>(props.hiddenItems ?? []);
  return (
    <CloudscapeHighcharts
      {...props}
      hiddenSeries={hiddenSeries}
      onLegendSeriesClick={(seriesId, visible) => {
        setHiddenSeries(visible ? hiddenSeries.filter((id) => id !== seriesId) : [...hiddenSeries, seriesId]);
        props.onLegendSeriesClick?.(seriesId, visible);
        return false;
      }}
      hiddenItems={hiddenItems}
      onLegendItemClick={(itemId, visible) => {
        setHiddenItems(visible ? hiddenItems.filter((id) => id !== itemId) : [...hiddenItems, itemId]);
        props.onLegendItemClick?.(itemId, visible);
        return false;
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

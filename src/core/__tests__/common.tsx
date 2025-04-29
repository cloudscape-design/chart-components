// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChart } from "../../../lib/components/core/chart-core";
import { CoreChartProps } from "../../../lib/components/core/interfaces-core";
import createWrapper from "../../../lib/components/test-utils/dom";
import CoreChartWrapper from "../../../lib/components/test-utils/dom/core";

export class ExtendedTestWrapper extends CoreChartWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
}

export function StatefulChart(props: CoreChartProps) {
  const [hiddenItems, setHiddenItems] = useState<readonly string[]>(props.hiddenItems ?? []);
  return (
    <CoreChart
      {...props}
      hiddenItems={hiddenItems}
      onItemVisibilityChange={(hiddenItems) => {
        setHiddenItems(hiddenItems);
        props.onItemVisibilityChange?.(hiddenItems);
      }}
    />
  );
}

type TestProps = Partial<CoreChartProps> & { highcharts: null | typeof Highcharts };

export function renderChart(props: TestProps, Component = CoreChart) {
  const { rerender } = render(<Component options={{}} className="test-chart" {...props} />);
  return {
    wrapper: createChartWrapper(),
    rerender: (props: TestProps) => rerender(<Component options={{}} className="test-chart" {...props} />),
  };
}

export function createChartWrapper() {
  return new ExtendedTestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
}

export function renderStatefulChart(props: TestProps) {
  return renderChart(props, StatefulChart);
}

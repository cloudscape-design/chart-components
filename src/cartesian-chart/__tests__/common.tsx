// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import CartesianChart, { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import createWrapper from "../../../lib/components/test-utils/dom";
import CartesianChartWrapper from "../../../lib/components/test-utils/dom/cartesian-chart";

export {
  findChart,
  findChartPoint,
  findChartSeries,
  highlightChartPoint,
  leaveChartPoint,
  clickChartPoint,
  findPlotLinesById,
} from "../../core/__tests__/common";

export const StatefulChart = forwardRef((props: CartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
  const [visibleSeries, setVisibleSeries] = useState<readonly string[]>(props.visibleSeries ?? []);
  return (
    <CartesianChart
      ref={ref}
      {...props}
      visibleSeries={visibleSeries}
      onToggleVisibleSeries={(event) => {
        setVisibleSeries(event.detail.visibleSeries);
        props.onToggleVisibleSeries?.(event);
      }}
    />
  );
});

type TestProps = Partial<CartesianChartProps> & {
  highcharts: null | typeof Highcharts;
  i18nProvider?: Record<string, Record<string, string>>;
};

export function renderCartesianChart({ i18nProvider, ...props }: TestProps, Component = CartesianChart) {
  const ComponentWrapper = (props: CartesianChartProps) => {
    return i18nProvider ? (
      <TestI18nProvider messages={i18nProvider}>
        <Component data-testid="test-chart" {...props} />
      </TestI18nProvider>
    ) : (
      <Component data-testid="test-chart" {...props} />
    );
  };
  const { rerender } = render(<ComponentWrapper {...props} />);
  return {
    wrapper: createChartWrapper(),
    rerender: (props: TestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

export function renderStatefulCartesianChart(props: TestProps) {
  return renderCartesianChart(props, StatefulChart);
}

export function createChartWrapper() {
  return new CartesianChartWrapper(createWrapper().find('[data-testid="test-chart"]')!.getElement());
}

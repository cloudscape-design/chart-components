// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createRef, forwardRef, useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import CartesianChart, { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import createWrapper from "../../../lib/components/test-utils/dom";

export const ref = createRef<CartesianChartProps.Ref>();

export const StatefulChart = forwardRef((props: CartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
  const [visibleSeries, setVisibleSeries] = useState<readonly string[]>(props.visibleSeries ?? []);
  return (
    <CartesianChart
      ref={ref}
      {...props}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={(event) => {
        setVisibleSeries(event.detail.visibleSeries);
        props.onVisibleSeriesChange?.(event);
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
        <Component ref={ref} {...props} />
      </TestI18nProvider>
    ) : (
      <Component ref={ref} {...props} />
    );
  };
  const { rerender } = render(<ComponentWrapper {...props} />);
  return {
    wrapper: createWrapper().findCartesianHighcharts()!,
    rerender: (props: TestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

export function renderStatefulCartesianChart(props: TestProps) {
  return renderCartesianChart(props, StatefulChart);
}

export const getChart = () => createWrapper().findCartesianHighcharts()!;
export const getTooltip = () => getChart().findTooltip()!;
export const getTooltipHeader = () => getChart().findTooltip()!.findHeader()!;
export const getTooltipBody = () => getChart().findTooltip()!.findBody()!;
export const getTooltipFooter = () => getChart().findTooltip()!.findFooter()!;
export const getAllTooltipSeries = () => getChart().findTooltip()!.findPoints();
export const getTooltipSeries = (index: number) => getAllTooltipSeries()[index];

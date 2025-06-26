// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createRef, forwardRef, useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import PieChart, { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";

export const ref = createRef<PieChartProps.Ref>();

export const StatefulChart = forwardRef((props: PieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  const [visibleSegments, setVisibleSegments] = useState<readonly string[]>(props.visibleSegments ?? []);
  return (
    <PieChart
      ref={ref}
      {...props}
      visibleSegments={visibleSegments}
      onChangeVisibleSegments={(event) => {
        setVisibleSegments(event.detail.visibleSegments);
        props.onChangeVisibleSegments?.(event);
      }}
    />
  );
});

type TestProps = Partial<PieChartProps> & {
  highcharts: null | typeof Highcharts;
  i18nProvider?: Record<string, Record<string, string>>;
};

export function renderPieChart({ i18nProvider, ...props }: TestProps, Component = PieChart) {
  const ComponentWrapper = (props: PieChartProps) => {
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
    wrapper: createWrapper().findPieHighcharts()!,
    rerender: (props: TestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

export function renderStatefulPieChart(props: TestProps) {
  return renderPieChart(props, StatefulChart);
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";
import type Highcharts from "highcharts";
import highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces-core";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import CoreChart from "../../../lib/components/internal-do-not-use/core-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import CoreChartWrapper from "../../../lib/components/test-utils/dom/core";

export class ExtendedTestWrapper extends CoreChartWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
}

export function StatefulChart(props: CoreChartProps) {
  const [visibleItems, setVisibleItems] = useState<readonly string[]>(props.visibleItems ?? []);
  return (
    <CoreChart
      {...props}
      visibleItems={visibleItems}
      onLegendItemsChange={(legendItems) => {
        const visibleItems = legendItems.filter((i) => i.visible).map((i) => i.id);
        setVisibleItems(visibleItems);
        props.onLegendItemsChange?.(legendItems);
      }}
    />
  );
}

type TestProps = Partial<CoreChartProps> & {
  highcharts: null | typeof Highcharts;
  i18nProvider?: Record<string, Record<string, string>>;
};

export function renderChart({ i18nProvider, ...props }: TestProps, Component = CoreChart) {
  const ComponentWrapper = (props: CoreChartProps) => {
    return i18nProvider ? (
      <TestI18nProvider messages={i18nProvider}>
        <Component options={{}} className="test-chart" {...props} />
      </TestI18nProvider>
    ) : (
      <Component options={{}} className="test-chart" {...props} />
    );
  };
  const { rerender } = render(<ComponentWrapper {...props} />);
  return {
    wrapper: createChartWrapper(),
    rerender: (props: TestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

export function renderStatefulChart(props: TestProps) {
  return renderChart(props, StatefulChart);
}

export function createChartWrapper() {
  return new ExtendedTestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
}

export function findChart() {
  return highcharts.charts.find((c) => c)!;
}
export function findChartSeries(seriesIndex: number) {
  return findChart().series[seriesIndex] as Highcharts.Series & { state: "" };
}
export function findChartPoint(seriesIndex: number, pointIndex: number) {
  return findChart().series[seriesIndex].data[pointIndex] as Highcharts.Point & { state: "" };
}
export function highlightChartPoint(seriesIndex: number, index: number) {
  findChartPoint(seriesIndex, index).onMouseOver();
}
export function leaveChartPoint(seriesIndex: number, index: number) {
  findChartPoint(seriesIndex, index).onMouseOut();
}
export function clickChartPoint(seriesIndex: number, index: number) {
  findChartPoint(seriesIndex, index).graphic!.element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}
export function findPlotLinesById(id: string) {
  return findChart()
    .axes.flatMap((axis) => (axis as any).plotLinesAndBands)
    .filter((plotLine) => plotLine.options.id === id);
}

export class TestChartRenderer {
  public _rect: unknown[] = [];
  public _attr: unknown[] = [];

  rect(...args: unknown[]) {
    this._rect.push(args);
    return this;
  }

  attr(...args: unknown[]) {
    this._attr.push(args);
    return this;
  }

  add() {
    return null;
  }
}

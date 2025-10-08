// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act, useState } from "react";
import { fireEvent, render } from "@testing-library/react";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { fireNonCancelableEvent } from "../../../lib/components/internal/events";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import CoreChart from "../../../lib/components/internal-do-not-use/core-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import BaseChartWrapper from "../../../lib/components/test-utils/dom/internal/base";
import CoreChartWrapper from "../../../lib/components/test-utils/dom/internal/core";

export class ExtendedTestWrapper extends CoreChartWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
}

export function StatefulChart(props: CoreChartProps) {
  const [visibleItems, setVisibleItems] = useState<readonly string[]>(props.visibleItems ?? []);
  return (
    <CoreChart
      {...props}
      visibleItems={visibleItems}
      onVisibleItemsChange={({ detail: { items: legendItems, isApiCall } }) => {
        const visibleItems = legendItems.filter((i) => i.visible).map((i) => i.id);
        setVisibleItems(visibleItems);
        fireNonCancelableEvent(props.onVisibleItemsChange, { items: legendItems, isApiCall });
      }}
    />
  );
}

export type CoreChartTestProps = Partial<CoreChartProps> & {
  onLegendItemHighlight?: () => void;
  i18nProvider?: Record<string, Record<string, string>>;
};

export function renderChart({ i18nProvider, ...props }: CoreChartTestProps, Component = CoreChart) {
  const ComponentWrapper = (props: CoreChartProps) => {
    return i18nProvider ? (
      <TestI18nProvider messages={i18nProvider}>
        <Component options={{}} {...props} />
      </TestI18nProvider>
    ) : (
      <Component options={{}} {...props} />
    );
  };
  const { rerender } = render(<ComponentWrapper {...props} />);
  return {
    wrapper: createChartWrapper(),
    rerender: (props: CoreChartTestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

export function renderStatefulChart(props: CoreChartTestProps) {
  return renderChart(props, StatefulChart);
}

export function createChartWrapper() {
  return new ExtendedTestWrapper(createWrapper().findByClassName(testClasses.root)!.getElement());
}

export function objectContainingDeep(root: object) {
  function isJestMatcher(value: object): boolean {
    return "asymmetricMatch" in value;
  }
  function transformLevel(obj: object) {
    const transformed: object = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object" && !isJestMatcher(value)) {
        transformed[key] = expect.objectContaining(transformLevel(value));
      } else {
        transformed[key] = value;
      }
    }
    return transformed;
  }
  return expect.objectContaining(transformLevel(root));
}

export function selectLegendItem(index: number, wrapper: BaseChartWrapper = createChartWrapper()) {
  act(() => wrapper.findLegend()!.findItems()[index].click());
}
export function toggleLegendItem(index: number, wrapper: BaseChartWrapper = createChartWrapper()) {
  const modifier = Math.random() > 0.5 ? { metaKey: true } : { ctrlKey: true };
  act(() => wrapper.findLegend()!.findItems()[index].click(modifier));
}
export function hoverLegendItem(index: number, wrapper: BaseChartWrapper = createChartWrapper()) {
  act(() => {
    fireEvent.mouseOver(wrapper.findLegend()!.findItems()[index].getElement());
  });
}

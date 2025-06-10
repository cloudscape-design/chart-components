// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
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
      onVisibleItemsChange={(legendItems) => {
        const visibleItems = legendItems.filter((i) => i.visible).map((i) => i.id);
        setVisibleItems(visibleItems);
        props.onVisibleItemsChange?.(legendItems);
      }}
    />
  );
}

type TestProps = Partial<CoreChartProps> & {
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

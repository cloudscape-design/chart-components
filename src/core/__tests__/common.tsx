// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act, useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { fireNonCancelableEvent } from "../../../lib/components/internal/events";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import CoreChart from "../../../lib/components/internal-do-not-use/core-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import BaseChartWrapper from "../../../lib/components/test-utils/dom/internal/base";
import CoreChartWrapper from "../../../lib/components/test-utils/dom/internal/core";
import { getTestZoom } from "./zoom-variants";

export class ExtendedTestWrapper extends CoreChartWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
}

export function StatefulChart(props: CoreChartProps) {
  const [visibleItems, setVisibleItems] = useState<readonly string[]>(props.visibleItems ?? []);
  const [zoomRange, setZoomRange] = useState(props.zoomRange);
  return (
    <CoreChart
      {...props}
      visibleItems={visibleItems}
      onVisibleItemsChange={({ detail }) => {
        const visibleItems = detail.items.filter((i) => i.visible).map((i) => i.id);
        setVisibleItems(visibleItems);
        fireNonCancelableEvent(props.onVisibleItemsChange, detail);
      }}
      zoomRange={zoomRange}
      onZoomRangeChange={({ detail }) => {
        setZoomRange(detail.zoomRange);
        fireNonCancelableEvent(props.onZoomRangeChange, detail);
      }}
    />
  );
}

export type CoreChartTestProps = Partial<CoreChartProps> & {
  onLegendItemHighlight?: () => void;
  i18nProvider?: Record<string, Record<string, string>>;
};

export function renderChart(
  { i18nProvider, ...props }: CoreChartTestProps,
  Component: React.ComponentType<CoreChartProps> = CoreChart,
) {
  const ComponentWrapper = (props: CoreChartProps) => {
    const chartProps = { zoom: getTestZoom(), ...props, options: withZoomAxis(props.options ?? {}, getTestZoom()) };
    return i18nProvider ? (
      <TestI18nProvider messages={i18nProvider}>
        <Component {...chartProps} />
      </TestI18nProvider>
    ) : (
      <Component {...chartProps} />
    );
  };
  const { rerender } = render(<ComponentWrapper {...props} />);
  return {
    wrapper: createChartWrapper(),
    rerender: (props: CoreChartTestProps) => rerender(<ComponentWrapper {...props} />),
  };
}

function withZoomAxis(options: CoreChartProps.ChartOptions, zoom: undefined | CoreChartProps.ZoomOptions) {
  const cartesian = (options.series ?? []).some((series) => series.type !== "pie" && series.type !== "solidgauge");
  return zoom?.enabled && cartesian && !options.xAxis ? { ...options, xAxis: {} } : options;
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
export function leaveLegendItem(index: number, wrapper: BaseChartWrapper = createChartWrapper()) {
  act(() => {
    fireEvent.mouseLeave(wrapper.findLegend()!.findItems()[index].getElement());
  });
}

export function selectSecondaryLegendItem(index: number, wrapper: ExtendedTestWrapper = createChartWrapper()) {
  act(() => wrapper.findLegend({ axisId: "secondary" })!.findItems()[index].click());
}

export function toggleSecondaryLegendItem(index: number, wrapper: ExtendedTestWrapper = createChartWrapper()) {
  const modifier = Math.random() > 0.5 ? { metaKey: true } : { ctrlKey: true };
  act(() => wrapper.findLegend({ axisId: "secondary" })!.findItems()[index].click(modifier));
}

export function hoverSecondaryLegendItem(index: number, wrapper: ExtendedTestWrapper = createChartWrapper()) {
  act(() => {
    fireEvent.mouseOver(wrapper.findLegend({ axisId: "secondary" })!.findItems()[index].getElement());
  });
}

export function getCurrentChart() {
  return [...highcharts.charts].reverse().find((c) => c)!;
}

export function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

export function renderInRtl() {
  const getComputedStyle = window.getComputedStyle;
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudoElement) => {
    const style = getComputedStyle(element, pseudoElement);
    return new Proxy(style, {
      get: (target, property) => (property === "direction" ? "rtl" : Reflect.get(target, property, target)),
    });
  });
}

export function focusOutsideChart() {
  const button = document.createElement("button");
  button.setAttribute("data-testid", "outside");
  document.body.appendChild(button);
  act(() => button.focus());
  return button;
}

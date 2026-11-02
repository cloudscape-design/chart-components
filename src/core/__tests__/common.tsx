// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act, useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";
import { ButtonWrapper } from "@cloudscape-design/components/test-utils/dom";

import "@cloudscape-design/components/test-utils/dom";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { InternalZoomProps } from "../../../lib/components/core/internal-interfaces";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { fireNonCancelableEvent } from "../../../lib/components/internal/events";
import { TestI18nProvider } from "../../../lib/components/internal/utils/test-i18n-provider";
import CoreChart from "../../../lib/components/internal-do-not-use/core-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import BaseChartWrapper from "../../../lib/components/test-utils/dom/internal/base";
import CoreChartWrapper from "../../../lib/components/test-utils/dom/internal/core";

export class ExtendedTestWrapper extends CoreChartWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
  findZoomButton = () => this.findComponent(`.${testClasses["zoom-button"]}`, ButtonWrapper);
  findExitZoomButton = () => this.findComponent(`.${testClasses["exit-zoom-button"]}`, ButtonWrapper);
  findResetZoomButton = () => this.findComponent(`.${testClasses["reset-zoom-button"]}`, ButtonWrapper);
  findZoomCursor = () => this.findByClassName(testClasses["zoom-cursor"]);
  findZoomCursorPreviousButton = () => this.findByClassName(testClasses["zoom-cursor-previous-button"]);
  findZoomCursorNextButton = () => this.findByClassName(testClasses["zoom-cursor-next-button"]);
}

// The core chart accepts the internal zoom properties, which are not part of its public interface yet.
const CoreChartWithZoom = CoreChart as React.ComponentType<CoreChartProps & InternalZoomProps>;

export function StatefulChart(props: CoreChartProps & InternalZoomProps) {
  const [visibleItems, setVisibleItems] = useState<readonly string[]>(props.visibleItems ?? []);
  const [zoomRange, setZoomRange] = useState(props.zoomRange);
  return (
    <CoreChartWithZoom
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

export type CoreChartTestProps = Partial<CoreChartProps> &
  InternalZoomProps & {
    onLegendItemHighlight?: () => void;
    i18nProvider?: Record<string, Record<string, string>>;
  };

export function renderChart(
  { i18nProvider, ...props }: CoreChartTestProps,
  Component: React.ComponentType<CoreChartProps & InternalZoomProps> = CoreChartWithZoom,
) {
  const ComponentWrapper = (props: CoreChartProps & InternalZoomProps) => {
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

export function enterZoomMode() {
  createChartWrapper().findZoomButton()!.click();
}

export function pressCursorKey(keyCode: number, times = 1) {
  for (let i = 0; i < times; i++) {
    createChartWrapper().findZoomCursor()!.keydown(keyCode);
  }
}

// Drives a full keyboard zoom over the visible points, by index: the cursor starts at the first visible point, so
// stepping right N times lands on the N-th visible point.
export function keyboardZoomToIndexes(startIndex: number, endIndex: number) {
  enterZoomMode();
  pressCursorKey(KeyCode.right, startIndex);
  pressCursorKey(KeyCode.enter);
  pressCursorKey(KeyCode.right, endIndex - startIndex);
  pressCursorKey(KeyCode.enter);
}

// Targets the most recently rendered chart: highcharts.charts accumulates entries across tests, and disposed charts
// remain as holes.
export function getCurrentChart() {
  return [...highcharts.charts].reverse().find((c) => c)!;
}

export function getXExtremes() {
  const { min, max } = getCurrentChart().xAxis[0].getExtremes();
  return { min, max };
}

// The zoomed range and the selection are drawn on the chart SVG, and lose their class names when hidden.
export function findZoomSvg(className: string): null | SVGElement {
  return createChartWrapper().getElement().querySelector(`.${testClasses[className]}`);
}

// The zoomed range is marked with a band and a border at each end, drawn on the plot and read back as x values.
export function getZoomRangeAffordance() {
  const xAxis = getCurrentChart().xAxis[0];
  const band = findZoomSvg("zoom-range");
  const borders = findZoomSvg("zoom-range-borders");
  const toValue = (pixel: number) => Math.round(xAxis.toValue(pixel) * 1000) / 1000;
  return {
    present: !!band && !!borders,
    band: band && {
      from: toValue(Number(band.getAttribute("x"))),
      to: toValue(Number(band.getAttribute("x")) + Number(band.getAttribute("width"))),
    },
    boundaries:
      borders &&
      (borders.getAttribute("d") ?? "")
        .split("M")
        .filter((part) => part.trim())
        .map((part) => toValue(Number(part.trim().split(" ")[0]))),
  };
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { createChartWrapper, renderChart } from "./common";

import legendTestClasses from "../../../lib/components/internal/components/chart-legend/test-classes/styles.selectors.js";

const series: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "L1",
    data: [1],
  },
  {
    type: "line",
    name: "L2",
    data: [2],
  },
  {
    type: "line",
    id: "L3",
    name: "Line 3",
    data: [3],
  },
];

const getItemSelector = (options?: { active?: boolean; dimmed?: boolean }) => {
  let selector = `.${legendTestClasses.item}`;
  if (options?.active === true) {
    selector += `:not(.${legendTestClasses["hidden-item"]})`;
  }
  if (options?.active === false) {
    selector += `.${legendTestClasses["hidden-item"]}`;
  }
  if (options?.dimmed === true) {
    selector += `.${legendTestClasses["dimmed-item"]}`;
  }
  if (options?.dimmed === false) {
    selector += `:not(.${legendTestClasses["dimmed-item"]})`;
  }
  return selector;
};

const getItem = (index: number, options?: { active?: boolean; dimmed?: boolean }) =>
  createChartWrapper().findLegend()!.findAll(getItemSelector(options))[index];

const mouseOver = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
const mouseOut = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 100));

describe("CoreChart: legend events", () => {
  test("calls onLegendItemHighlightExit when leaving a legend item", async () => {
    const onLegendItemHighlightExit = vi.fn();
    renderChart({ highcharts, options: { series }, onLegendItemHighlightExit });

    // Hover over a legend item first
    act(() => mouseOver(getItem(0).getElement()));
    expect(onLegendItemHighlightExit).not.toHaveBeenCalled();

    // Leave the legend item
    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();

    expect(onLegendItemHighlightExit).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {},
      }),
    );
  });

  test("calls onLegendItemHighlightExit when pressing escape on a focused legend item", () => {
    const onLegendItemHighlightExit = vi.fn();
    renderChart({ highcharts, options: { series }, onLegendItemHighlightExit });

    // Focus on a legend item first
    getItem(0).focus();
    expect(onLegendItemHighlightExit).not.toHaveBeenCalled();

    // Press escape to clear highlight
    getItem(0).keydown({ keyCode: KeyCode.escape });

    expect(onLegendItemHighlightExit).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {},
      }),
    );
  });

  test("calls onLegendItemHighlightExit only once when multiple legend items are involved", async () => {
    const onLegendItemHighlightExit = vi.fn();
    renderChart({ highcharts, options: { series }, onLegendItemHighlightExit });

    // Hover over first legend item
    act(() => mouseOver(getItem(0).getElement()));
    expect(onLegendItemHighlightExit).not.toHaveBeenCalled();

    // Move to second legend item (should not trigger onLegendItemHighlightExit)
    act(() => mouseOut(getItem(0).getElement()));
    act(() => mouseOver(getItem(1).getElement()));
    expect(onLegendItemHighlightExit).not.toHaveBeenCalled();

    // Leave the second legend item (should trigger onLegendItemHighlightExit)
    act(() => mouseOut(getItem(1).getElement()));
    await clearHighlightPause();

    expect(onLegendItemHighlightExit).toHaveBeenCalledTimes(1);
    expect(onLegendItemHighlightExit).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {},
      }),
    );
  });

  test("does not call onLegendItemHighlightExit when onLegendItemHighlightExit prop is not provided", async () => {
    // This test ensures the component doesn't crash when the event handler is not provided
    renderChart({ highcharts, options: { series } });

    // Hover over a legend item first
    act(() => mouseOver(getItem(0).getElement()));

    // Leave the legend item - should not crash
    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();

    // Test passes if no error is thrown
    expect(true).toBe(true);
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { createChartWrapper, renderChart } from "./common";

const series: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "L1",
    data: [],
  },
  {
    type: "line",
    name: "L2",
    data: [],
  },
  {
    type: "line",
    id: "L3",
    name: "Line 3",
    data: [],
  },
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 30 },
      { id: "P3", name: "Pie 3", y: 60 },
    ],
    showInLegend: true,
  },
];

const getItems = (options?: { hidden?: boolean; dimmed?: boolean }) =>
  createChartWrapper().findLegend()!.findItems(options);
const getItem = (index: number, options?: { hidden?: boolean; dimmed?: boolean }) =>
  createChartWrapper().findLegend()!.findItems(options)[index];
const mouseOver = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
const mouseOut = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("CoreChart: legend", () => {
  test("renders no legend when legend.enabled=false", () => {
    renderChart({ highcharts, options: { series }, legend: { enabled: false } });
    expect(createChartWrapper().findLegend()).toBe(null);
  });

  test.each([undefined, true])("renders legend when legend.enabled=undefined or legend.enabled=true", (enabled) => {
    renderChart({ highcharts, options: { series }, legend: { enabled } });
    expect(createChartWrapper().findLegend()).not.toBe(null);
  });

  test("renders expected legend items", () => {
    renderChart({ highcharts, options: { series }, hiddenItems: ["L2", "L3", "P2", "P3"] });

    expect(getItems().map((w) => w.getElement().textContent)).toEqual(["L1", "L2", "Line 3", "P1", "P2", "Pie 3"]);
    expect(getItems({ hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "P1"]);
    expect(getItems({ hidden: true }).map((w) => w.getElement().textContent)).toEqual(["L2", "Line 3", "P2", "Pie 3"]);
  });

  test("does not render title by default", () => {
    renderChart({ highcharts, options: { series: series } });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(createChartWrapper().findLegend()!.findTitle()).toBe(null);
  });

  test("renders legend title if specified", () => {
    renderChart({ highcharts, options: { series: series }, legend: { title: "Legend title" } });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(createChartWrapper().findLegend()!.findTitle()!.getElement().textContent).toBe("Legend title");
  });

  test("does not render action slot by default", () => {
    renderChart({ highcharts, options: { series: series }, legend: { title: "Legend title" } });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(createChartWrapper().findLegend()!.findActions()).toBe(null);
  });

  test("renders action slot if specified with expected render props", () => {
    const renderActions = vi.fn().mockReturnValue("Legend actions");
    renderChart({
      highcharts,
      options: { series },
      hiddenItems: ["L2", "L3", "P2", "P3"],
      legend: { actions: { render: renderActions } },
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(createChartWrapper().findLegend()!.findActions()!.getElement().textContent).toBe("Legend actions");
    expect(renderActions).toHaveBeenCalledWith({
      legendItems: [
        { id: "L1", name: "L1", marker: expect.anything(), visible: true },
        { id: "L2", name: "L2", marker: expect.anything(), visible: false },
        { id: "L3", name: "Line 3", marker: expect.anything(), visible: false },
        { id: "P1", name: "P1", marker: expect.anything(), visible: true },
        { id: "P2", name: "P2", marker: expect.anything(), visible: false },
        { id: "P3", name: "Pie 3", marker: expect.anything(), visible: false },
      ],
    });
  });

  test("legend items can be highlighted on hover", async () => {
    renderChart({
      highcharts,
      options: { series },
      hiddenItems: ["L2", "L3", "P2", "P3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "P1"]);

    act(() => mouseOver(getItem(0).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1"]);

    act(() => mouseOut(getItem(0).getElement()));
    act(() => mouseOver(getItem(3).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1"]);

    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "P1"]);
  });
});

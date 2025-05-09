// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { fireEvent } from "@testing-library/react";
import highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import {
  createChartWrapper,
  findChartPoint,
  findChartSeries,
  findPlotLinesById,
  highlightChartPoint,
  leaveChartPoint,
  renderChart,
} from "./common";

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
const mouseLeavePause = () => new Promise((resolve) => setTimeout(resolve, 300));

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
    renderChart({ highcharts, options: { series }, visibleItems: ["L1", "P1"] });

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
    renderChart({
      highcharts,
      options: { series },
      legend: { actions: "Legend actions" },
      visibleItems: ["L1", "P1"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(createChartWrapper().findLegend()!.findActions()!.getElement().textContent).toBe("Legend actions");
  });

  test("legend items are highlighted on hover in cartesian chart", async () => {
    renderChart({
      highcharts,
      options: {
        series: series.filter((s) => s.type === "line"),
        xAxis: { plotLines: [{ id: "L3", value: 0 }] },
        yAxis: { plotLines: [{ id: "L3", value: 0 }] },
      },
      visibleItems: ["L1", "L3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
    expect(findChartSeries(0).state).toBe("");
    expect(findChartSeries(2).state).toBe("");
    expect(findPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);

    act(() => mouseOver(getItem(0).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1"]);
    expect(findChartSeries(0).state).toBe("normal");
    expect(findChartSeries(2).state).toBe("inactive");
    expect(findPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([0.4, 0.4]);

    act(() => mouseOut(getItem(0).getElement()));
    act(() => mouseOver(getItem(2).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["Line 3"]);
    expect(findChartSeries(0).state).toBe("inactive");
    expect(findChartSeries(2).state).toBe("normal");
    expect(findPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);

    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
    expect(findChartSeries(0).state).toBe("normal");
    expect(findChartSeries(2).state).toBe("normal");
    expect(findPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);
  });

  test("legend items are highlighted on hover in pie chart", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "pie") },
      visibleItems: ["P1", "P3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
    expect(findChartPoint(0, 0).state).toBe(undefined);
    expect(findChartPoint(0, 2).state).toBe(undefined);

    act(() => mouseOver(getItem(0).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1"]);
    expect(findChartPoint(0, 0).state).toBe("normal");
    expect(findChartPoint(0, 2).state).toBe("inactive");

    act(() => mouseOut(getItem(0).getElement()));
    act(() => mouseOver(getItem(2).getElement()));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["Pie 3"]);
    expect(findChartPoint(0, 0).state).toBe("inactive");
    expect(findChartPoint(0, 2).state).toBe("normal");

    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
    expect(findChartPoint(0, 0).state).toBe("normal");
    expect(findChartPoint(0, 2).state).toBe("normal");
  });

  test("legend items are highlighted when cartesian chart series point is highlighted", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "line") },
      visibleItems: ["L1", "L3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);

    act(() => highlightChartPoint(0, 0));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1"]);

    act(() => highlightChartPoint(2, 0));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["Line 3"]);

    act(() => leaveChartPoint(2, 0));
    await mouseLeavePause();
    await clearHighlightPause();
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
  });

  test("legend items are highlighted when pie chart segment is highlighted", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "pie") },
      visibleItems: ["P1", "P3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);

    act(() => highlightChartPoint(0, 0));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1"]);

    act(() => highlightChartPoint(0, 2));
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["Pie 3"]);

    act(() => leaveChartPoint(0, 2));
    await mouseLeavePause();
    await clearHighlightPause();
    expect(getItems({ dimmed: false, hidden: false }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
  });

  test("legend items are navigable with keyboard", () => {
    renderChart({
      highcharts,
      options: {
        series: series.filter((s) => s.type === "line"),
      },
      visibleItems: ["L1", "L2", "L3"],
    });

    act(() => getItem(0).focus());
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    fireEvent.keyDown(getItem(0).getElement(), { keyCode: KeyCode.right });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(1).getElement());

    fireEvent.keyDown(getItem(1).getElement(), { keyCode: KeyCode.down });
    expect(getItem(2).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(2).getElement());

    fireEvent.keyDown(getItem(2).getElement(), { keyCode: KeyCode.left });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(1).getElement());

    fireEvent.keyDown(getItem(1).getElement(), { keyCode: KeyCode.up });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    fireEvent.keyDown(getItem(0).getElement(), { keyCode: KeyCode.end });
    expect(getItem(2).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(2).getElement());

    fireEvent.keyDown(getItem(2).getElement(), { keyCode: KeyCode.home });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    fireEvent.keyDown(getItem(0).getElement(), { keyCode: KeyCode.left });
    expect(getItem(2).getElement()).toHaveFocus();

    fireEvent.keyDown(getItem(2).getElement(), { keyCode: KeyCode.right });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(findChartSeries(0).state).toBe("normal");
    expect(findChartSeries(1).state).toBe("inactive");
    expect(findChartSeries(2).state).toBe("inactive");

    fireEvent.keyDown(getItem(0).getElement(), { keyCode: KeyCode.escape });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(findChartSeries(0).state).toBe("normal");
    expect(findChartSeries(1).state).toBe("normal");
    expect(findChartSeries(2).state).toBe("normal");

    fireEvent.keyDown(getItem(0).getElement(), { keyCode: KeyCode.right });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(findChartSeries(0).state).toBe("inactive");
    expect(findChartSeries(1).state).toBe("normal");
    expect(findChartSeries(2).state).toBe("inactive");
  });
});

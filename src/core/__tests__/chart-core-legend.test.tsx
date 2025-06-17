// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { createChartWrapper, renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

import legendTestClasses from "../../../lib/components/internal/components/chart-legend/test-classes/styles.selectors.js";

const hc = new HighchartsTestHelper(highcharts);

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
const getItems = (options?: { active?: boolean; dimmed?: boolean }) =>
  createChartWrapper().findLegend()!.findAll(getItemSelector(options));
const getItem = (index: number, options?: { active?: boolean; dimmed?: boolean }) =>
  createChartWrapper().findLegend()!.findAll(getItemSelector(options))[index];
const mouseOver = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
const mouseOut = (element: HTMLElement) => element.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
const clearHighlightPause = () => new Promise((resolve) => setTimeout(resolve, 100));
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
    expect(getItems({ active: true }).map((w) => w.getElement().textContent)).toEqual(["L1", "P1"]);
    expect(getItems({ active: false }).map((w) => w.getElement().textContent)).toEqual(["L2", "Line 3", "P2", "Pie 3"]);
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
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
    expect(hc.getPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);

    act(() => mouseOver(getItem(0).getElement()));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1"]);
    expect(hc.getChartSeries(0).state).toBe("normal");
    expect(hc.getChartSeries(2).state).toBe("inactive");
    expect(hc.getPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([0.4, 0.4]);

    act(() => mouseOut(getItem(0).getElement()));
    act(() => mouseOver(getItem(2).getElement()));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["Line 3"]);
    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(2).state).toBe("normal");
    expect(hc.getPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);

    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
    expect(hc.getChartSeries(0).state).toBe("normal");
    expect(hc.getChartSeries(2).state).toBe("normal");
    expect(hc.getPlotLinesById("L3").map((l) => l.svgElem.opacity)).toEqual([1, 1]);
  });

  test("legend items are highlighted on hover in pie chart", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "pie") },
      visibleItems: ["P1", "P3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
    expect(hc.getChartPoint(0, 0).state).toBe(undefined);
    expect(hc.getChartPoint(0, 2).state).toBe(undefined);

    act(() => mouseOver(getItem(0).getElement()));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1"]);
    expect(getItems({ dimmed: true, active: true }).map((w) => w.getElement().textContent)).toEqual(["Pie 3"]);
    expect(hc.getChartPoint(0, 0).state).toBe("hover");
    expect(hc.getChartPoint(0, 2).state).toBe(undefined);

    act(() => mouseOut(getItem(0).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
    expect(hc.getChartPoint(0, 0).state).toBe("normal");
    expect(hc.getChartPoint(0, 2).state).toBe("normal");

    act(() => mouseOver(getItem(2).getElement()));
    expect(getItems({ dimmed: true, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1"]);
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["Pie 3"]);
    expect(hc.getChartPoint(0, 0).state).toBe("normal");
    expect(hc.getChartPoint(0, 2).state).toBe("hover");

    act(() => mouseOut(getItem(2).getElement()));
    await clearHighlightPause();
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
    expect(hc.getChartPoint(0, 0).state).toBe("normal");
    expect(hc.getChartPoint(0, 2).state).toBe("normal");
  });

  test("legend items are highlighted when cartesian chart series point is highlighted", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "line") },
      visibleItems: ["L1", "L3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);

    act(() => hc.highlightChartPoint(0, 0));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1"]);

    act(() => hc.highlightChartPoint(2, 0));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["Line 3"]);

    act(() => hc.leaveChartPoint(2, 0));
    await mouseLeavePause();
    await clearHighlightPause();
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["L1", "Line 3"]);
  });

  test("legend items are highlighted when pie chart segment is highlighted", async () => {
    renderChart({
      highcharts,
      options: { series: series.filter((s) => s.type === "pie") },
      visibleItems: ["P1", "P3"],
    });

    expect(createChartWrapper().findLegend()).not.toBe(null);
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);

    act(() => hc.highlightChartPoint(0, 0));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1"]);

    act(() => hc.highlightChartPoint(0, 2));
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["Pie 3"]);

    act(() => hc.leaveChartPoint(0, 2));
    await mouseLeavePause();
    await clearHighlightPause();
    expect(getItems({ dimmed: false, active: true }).map((w) => w.getElement().textContent)).toEqual(["P1", "Pie 3"]);
  });

  test("legend items are navigable with keyboard", () => {
    renderChart({
      highcharts,
      options: {
        series: series.filter((s) => s.type === "line"),
      },
      visibleItems: ["L1", "L2", "L3"],
    });

    getItem(0).focus();
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    getItem(0).keydown({ keyCode: KeyCode.right });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(1).getElement());

    getItem(1).keydown({ keyCode: KeyCode.down });
    expect(getItem(2).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(2).getElement());

    getItem(2).keydown({ keyCode: KeyCode.left });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(1).getElement());

    getItem(1).keydown({ keyCode: KeyCode.up });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    getItem(0).keydown({ keyCode: KeyCode.end });
    expect(getItem(2).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(2).getElement());

    getItem(2).keydown({ keyCode: KeyCode.home });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(getItems({ dimmed: false })).toHaveLength(1);
    expect(getItems({ dimmed: false })[0].getElement()).toBe(getItem(0).getElement());

    getItem(0).keydown({ keyCode: KeyCode.left });
    expect(getItem(2).getElement()).toHaveFocus();

    getItem(2).keydown({ keyCode: KeyCode.right });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(hc.getChartSeries(0).state).toBe("normal");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(hc.getChartSeries(2).state).toBe("inactive");

    getItem(0).keydown({ keyCode: KeyCode.escape });
    expect(getItem(0).getElement()).toHaveFocus();
    expect(hc.getChartSeries(0).state).toBe("normal");
    expect(hc.getChartSeries(1).state).toBe("normal");
    expect(hc.getChartSeries(2).state).toBe("normal");

    getItem(0).keydown({ keyCode: KeyCode.right });
    expect(getItem(1).getElement()).toHaveFocus();
    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("normal");
    expect(hc.getChartSeries(2).state).toBe("inactive");
  });
});

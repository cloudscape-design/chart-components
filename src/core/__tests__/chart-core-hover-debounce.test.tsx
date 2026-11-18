// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { fireEvent } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CoreChartProps } from "../../../lib/components/core/interfaces";
import {
  createChartWrapper,
  hoverLegendItem,
  leaveLegendItem,
  renderChart,
  renderStatefulChart,
  toggleLegendItem,
} from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";
import { enterZoomMode, renderZoomChart } from "./zoom-test-utils";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors.js";
import legendTestClasses from "../../../lib/components/internal/components/chart-legend/test-classes/styles.selectors.js";

const hc = new HighchartsTestHelper(highcharts);

const series: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "L1", data: [1, 2, 3] },
  { type: "line", name: "L2", data: [4, 5, 6] },
];

const getTooltipContent: CoreChartProps.GetTooltipContent = ({ point }) => ({
  header: () => `${point?.series.name} ${point?.x}`,
  body: () => "Body",
});

const getLegendTooltipContent: CoreChartProps.GetLegendTooltipContent = ({ legendItem }) => ({
  header: <div>{legendItem.name}</div>,
  body: <>Body</>,
});

const dimmedLegendItems = () =>
  createChartWrapper()
    .findLegend()!
    .findAll(`.${legendTestClasses["dimmed-item"]}`)
    .map((w) => w.getElement().textContent);

function mockPointCoordinates() {
  hc.getChart().series.forEach((s, sIndex) => {
    s.points.forEach((p) => {
      p.plotX = p.index;
      p.plotY = 1 + sIndex;
    });
  });
}

const highlightMarkers = () => createChartWrapper().findAllByClassName(testClasses["highlight-marker"]).length;
const selectedMarkers = () => createChartWrapper().findAllByClassName(testClasses["highlight-marker-selected"]).length;
const selectedMarkerFill = () =>
  createChartWrapper().findByClassName(testClasses["highlight-marker-selected"])?.getElement().getAttribute("fill") ??
  null;

const tooltipHeader = () => createChartWrapper().findTooltip()?.findHeader()?.getElement().textContent ?? null;
const legendTooltip = () => createChartWrapper().findLegend()!.findItemTooltip();
const pressEscape = () => act(() => fireEvent.keyDown(document.body, { key: "Escape", keyCode: 27 }));
const focusLegendItem = (index: number) => act(() => createChartWrapper().findLegend()!.findItems()[index].focus());

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CoreChart: hover debounce", () => {
  test("highlights the hovered series and cursor at once, and dims the others and shows the tooltip once the delay passes", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(99));

    expect(hc.getChartSeries(0).state).toBe("hover");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(highlightMarkers()).toBe(2);
    expect(selectedMarkers()).toBe(1);
    expect(dimmedLegendItems()).toEqual([]);
    expect(tooltipHeader()).toBe(null);
    expect(onHighlight).toHaveBeenCalledTimes(1);
    expect(onHighlight.mock.calls[0][0].detail.point).toBe(hc.getChartPoint(0, 1));

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));

    expect(tooltipHeader()).toBe("L1 1");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(dimmedLegendItems()).toEqual(["L2"]);
    expect(onHighlight).toHaveBeenCalledTimes(1);
  });

  test("drops a pending hover once the pointer leaves it, and restores the series and cursor", () => {
    const onClearHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onClearHighlight });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(99));
    act(() => hc.leaveChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));

    expect(tooltipHeader()).toBe(null);
    expect(dimmedLegendItems()).toEqual([]);

    act(() => vi.advanceTimersByTime(200));

    expect(highlightMarkers()).toBe(0);
    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(onClearHighlight).toHaveBeenCalled();
  });

  test("swaps the highlighted series at once once dimmed and applies the last target once it settles", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(100));
    act(() => hc.highlightChartPoint(1, 1));
    act(() => vi.advanceTimersByTime(60));
    act(() => hc.highlightChartPoint(1, 2));
    act(() => vi.advanceTimersByTime(60));

    expect(tooltipHeader()).toBe("L1 1");
    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(dimmedLegendItems()).toEqual(["L1"]);

    act(() => vi.advanceTimersByTime(40));

    expect(tooltipHeader()).toBe("L2 2");
    expect(onHighlight).toHaveBeenCalledTimes(3);
  });

  test.each([
    {
      type: "column",
      series: [
        { type: "column", name: "C1", data: [1, 2] },
        { type: "column", name: "C2", data: [3, 4] },
      ],
      first: [0, 0],
      second: [1, 1],
      dimmedAtOnce: ["C2"],
    },
    {
      type: "pie",
      series: [
        {
          type: "pie",
          name: "P",
          data: [
            { name: "A", y: 1 },
            { name: "B", y: 2 },
          ],
        },
      ],
      first: [0, 0],
      second: [0, 1],
      dimmedAtOnce: [],
    },
  ] as const)(
    "highlights a hovered $type point at once, dims the others at once for columns, and swaps it at once when dimmed",
    ({ series, first, second, dimmedAtOnce }) => {
      renderChart({ highcharts, options: { series: series as Highcharts.SeriesOptionsType[] }, hoverDebounce: 100 });

      act(() => hc.highlightChartPoint(...first));

      expect(hc.getChartPoint(...first).state).toBe("hover");
      expect(hc.getChartPoint(...second).state === "inactive").toBe(dimmedAtOnce.length > 0);
      expect(dimmedLegendItems()).toEqual(dimmedAtOnce);

      act(() => vi.advanceTimersByTime(100));

      expect(hc.getChartPoint(...second).state).toBe("inactive");

      act(() => hc.highlightChartPoint(...second));

      expect(hc.getChartPoint(...second).state).toBe("hover");
      expect(hc.getChartPoint(...first).state).toBe("inactive");
    },
  );

  test("uses a 150ms delay when hoverDebounce=true and ignores tooltip.debounce", () => {
    renderChart({
      highcharts,
      options: { series },
      hoverDebounce: true,
      tooltip: { debounce: 500 },
      getTooltipContent,
    });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(149));
    expect(tooltipHeader()).toBe(null);

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));
    expect(tooltipHeader()).toBe("L1 1");
  });

  test("applies the same effects at once with a zero delay", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 0, getLegendTooltipContent });

    hoverLegendItem(0);

    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(dimmedLegendItems()).toEqual(["L2"]);

    act(() => vi.advanceTimersByTime(1));

    expect(legendTooltip()).not.toBe(null);
  });

  test("drops a pending target when the pointer enters the tooltip", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(100));
    act(() => hc.highlightChartPoint(1, 2));
    act(() => {
      fireEvent.mouseEnter(createChartWrapper().findTooltip()!.getElement());
    });
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe("L1 1");
    expect(dimmedLegendItems()).toEqual(["L2"]);
  });

  test("pins the tooltip on click without waiting for the delay", () => {
    const data = [
      { name: "P1", y: 10 },
      { name: "P2", y: 30 },
    ];
    renderChart({
      highcharts,
      options: { series: [{ type: "pie", name: "Pie", data }] },
      hoverDebounce: 100,
      getTooltipContent: ({ point }) => ({ header: () => `${point?.name}`, body: () => "Body" }),
    });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => hc.clickChartPoint(0, 1));

    expect(tooltipHeader()).toBe("P2");
    expect(createChartWrapper().findTooltip()!.findDismissButton()).not.toBe(null);
  });

  test("skips a pending point that is no longer visible and clears its cursor", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));
    act(() => {
      hc.getChartPoint(0, 1).visible = false;
    });
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe(null);
    expect(highlightMarkers()).toBe(0);
    expect(hc.getChartSeries(0).state).toBe("");
  });

  test.each([
    {
      name: "the chart receives keyboard focus",
      action: () => act(() => createChartWrapper().findApplication()!.focus()),
    },
    { name: "Escape is pressed", action: pressEscape },
    { name: "series visibility changes", action: () => toggleLegendItem(1) },
  ])("drops a pending pointer hover when $name", ({ action }) => {
    const onHighlight = vi.fn();
    renderStatefulChart({
      highcharts,
      options: { series },
      hoverDebounce: 100,
      visibleItems: ["L1", "L2"],
      getTooltipContent,
      onHighlight,
    });

    act(() => hc.highlightChartPoint(0, 1));
    action();
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe(null);
    expect(dimmedLegendItems()).toEqual([]);
    expect(onHighlight).toHaveBeenCalledTimes(1);
  });

  test("drops a pending pointer hover when a zoom selection starts", () => {
    renderZoomChart({ zoom: { enabled: true }, hoverDebounce: 100, getTooltipContent });

    act(() => hc.highlightChartPoint(0, 1));
    enterZoomMode();
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe(null);
    expect(dimmedLegendItems()).toEqual([]);
  });

  describe("API", () => {
    test("lights the series at once and dims the others after the delay", () => {
      let api: null | CoreChartProps.ChartAPI = null;
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, callback: (chartApi) => (api = chartApi) });

      act(() => api!.highlightItems(["L1"]));

      expect(hc.getChartSeries(0).state).toBe("hover");
      expect(hc.getChartSeries(1).state).toBe("");
      expect(dimmedLegendItems()).toEqual([]);

      act(() => vi.advanceTimersByTime(100));

      expect(hc.getChartSeries(1).state).toBe("inactive");
      expect(dimmedLegendItems()).toEqual(["L2"]);

      act(() => api!.clearChartHighlight());

      expect(hc.getChartSeries(1).state).toBe("");
      expect(dimmedLegendItems()).toEqual([]);
    });

    test("replaces a pending pointer hover and its cursor", () => {
      let api: null | CoreChartProps.ChartAPI = null;
      renderChart({
        highcharts,
        options: { series },
        hoverDebounce: 100,
        getTooltipContent,
        callback: (chartApi) => (api = chartApi),
      });

      mockPointCoordinates();
      act(() => hc.highlightChartPoint(0, 1));
      act(() => api!.highlightChartPoint(hc.getChartPoint(1, 2)));

      expect(hc.getChartSeries(1).state).toBe("hover");
      expect(selectedMarkerFill()).toBe(hc.getChartSeries(1).color);

      act(() => vi.advanceTimersByTime(200));

      expect(tooltipHeader()).toBe("L2 2");
    });
  });

  describe("legend", () => {
    test("highlights a hovered item's series at once, and dims the others and shows the item tooltip once the delay passes", () => {
      const onLegendItemHighlight = vi.fn();
      renderChart({
        highcharts,
        options: { series },
        hoverDebounce: 100,
        getLegendTooltipContent,
        onLegendItemHighlight,
      });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(99));

      expect(hc.getChartSeries(0).state).toBe("hover");
      expect(hc.getChartSeries(1).state).toBe("");
      expect(dimmedLegendItems()).toEqual([]);
      expect(legendTooltip()).toBe(null);
      expect(onLegendItemHighlight).toHaveBeenCalledTimes(1);

      act(() => vi.advanceTimersByTime(1));

      expect(hc.getChartSeries(0).state).toBe("hover");
      expect(hc.getChartSeries(1).state).toBe("inactive");
      expect(dimmedLegendItems()).toEqual(["L2"]);
      expect(legendTooltip()).not.toBe(null);
      expect(onLegendItemHighlight).toHaveBeenCalledTimes(1);
    });

    test("drops a pending item highlight as soon as the pointer leaves it", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100 });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(90));
      leaveLegendItem(0);
      act(() => vi.advanceTimersByTime(15));

      expect(dimmedLegendItems()).toEqual([]);

      act(() => vi.advanceTimersByTime(500));

      expect(hc.getChartSeries(0).state).toBe("");
    });

    test("drops a pending item highlight when the item is toggled", () => {
      renderStatefulChart({ highcharts, options: { series }, hoverDebounce: 100, visibleItems: ["L1", "L2"] });

      hoverLegendItem(0);
      toggleLegendItem(0);
      act(() => vi.advanceTimersByTime(200));

      expect(hc.getChartSeries(1).state).toBe("");
    });

    test("lets Escape cancel a pending item highlight and tooltip, and clears the highlight it reported", () => {
      const onClearHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getLegendTooltipContent, onClearHighlight });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(50));
      pressEscape();
      act(() => vi.advanceTimersByTime(200));

      expect(legendTooltip()).toBe(null);
      expect(hc.getChartSeries(0).state).toBe("");
      expect(dimmedLegendItems()).toEqual([]);
      expect(onClearHighlight).toHaveBeenCalledTimes(1);
    });

    test("highlights a focused item at once, replacing pending pointer and legend hovers", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

      act(() => hc.highlightChartPoint(0, 1));
      hoverLegendItem(0);
      focusLegendItem(1);

      expect(dimmedLegendItems()).toEqual(["L1"]);

      act(() => vi.advanceTimersByTime(200));

      expect(dimmedLegendItems()).toEqual(["L1"]);
      expect(tooltipHeader()).toBe(null);
    });

    test("keeps a new item highlight when the plot hover is lost", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

      act(() => hc.highlightChartPoint(0, 1));
      act(() => hc.leaveChartPoint(0, 1));
      hoverLegendItem(1);
      act(() => vi.advanceTimersByTime(200));

      expect(dimmedLegendItems()).toEqual(["L1"]);
    });

    test("does not reopen the item tooltip after the delay changes and the pointer leaves", () => {
      const { rerender } = renderChart({
        highcharts,
        options: { series },
        hoverDebounce: 300,
        getLegendTooltipContent,
      });

      hoverLegendItem(0);
      rerender({ highcharts, options: { series }, hoverDebounce: 100, getLegendTooltipContent });
      leaveLegendItem(0);
      act(() => vi.advanceTimersByTime(500));

      expect(legendTooltip()).toBe(null);
    });
  });
});

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

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CoreChart: hover debounce", () => {
  test("applies series highlight, legend highlight, and tooltip together once the delay passes", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(99));

    expect(tooltipHeader()).toBe(null);
    expect(hc.getChartSeries(1).state).toBe("");
    expect(dimmedLegendItems()).toEqual([]);
    expect(onHighlight).not.toHaveBeenCalled();

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));

    expect(tooltipHeader()).toBe("L1 1");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(dimmedLegendItems()).toEqual(["L2"]);
    expect(onHighlight).toHaveBeenCalledTimes(1);
  });

  test("shows the datapoint cursor immediately while the series highlight and tooltip wait", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));

    expect(highlightMarkers()).toBe(2);
    expect(selectedMarkers()).toBe(1);
    expect(hc.getChartSeries(1).state).toBe("");
    expect(dimmedLegendItems()).toEqual([]);
    expect(tooltipHeader()).toBe(null);
  });

  test("drops a pending hover and its cursor when hover is lost before the delay passes", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));
    act(() => hc.leaveChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(200));

    expect(highlightMarkers()).toBe(0);
    expect(tooltipHeader()).toBe(null);
    expect(dimmedLegendItems()).toEqual([]);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  test("keeps the current highlight while targets change and applies the last one once it settles", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(100));
    act(() => hc.highlightChartPoint(1, 1));
    act(() => vi.advanceTimersByTime(60));
    act(() => hc.highlightChartPoint(1, 2));
    act(() => vi.advanceTimersByTime(60));

    expect(tooltipHeader()).toBe("L1 1");
    expect(dimmedLegendItems()).toEqual(["L2"]);

    act(() => vi.advanceTimersByTime(40));

    expect(tooltipHeader()).toBe("L2 2");
    expect(dimmedLegendItems()).toEqual(["L1"]);
    expect(onHighlight).toHaveBeenCalledTimes(2);
  });

  test("does not restart the delay when the same target is hovered again", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(60));
    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(40));

    expect(tooltipHeader()).toBe("L1 1");
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
    const pieSeries: Highcharts.SeriesOptionsType[] = [
      {
        type: "pie",
        name: "Pie",
        data: [
          { name: "P1", y: 10 },
          { name: "P2", y: 30 },
        ],
      },
    ];
    renderChart({
      highcharts,
      options: { series: pieSeries },
      hoverDebounce: 100,
      getTooltipContent: ({ point }) => ({ header: () => `${point?.name}`, body: () => "Body" }),
    });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => hc.clickChartPoint(0, 1));

    expect(tooltipHeader()).toBe("P2");
    expect(createChartWrapper().findTooltip()!.findDismissButton()).not.toBe(null);
  });

  test("uses a 300ms delay when hoverDebounce=true", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: true, getTooltipContent });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(299));
    expect(tooltipHeader()).toBe(null);

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));
    expect(tooltipHeader()).toBe("L1 1");
  });

  test("ignores tooltip.debounce when hoverDebounce is set", () => {
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, tooltip: { debounce: 500 }, getTooltipContent });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(100));

    expect(tooltipHeader()).toBe("L1 1");
  });

  test("skips a pending point that is no longer visible and clears its cursor", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    mockPointCoordinates();
    act(() => hc.highlightChartPoint(0, 1));
    expect(highlightMarkers()).toBe(2);

    act(() => {
      hc.getChartPoint(0, 1).visible = false;
    });
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe(null);
    expect(highlightMarkers()).toBe(0);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  describe("cancellation", () => {
    test("lets an API highlight replace a pending pointer hover", () => {
      let api: null | CoreChartProps.ChartAPI = null;
      renderChart({
        highcharts,
        options: { series },
        hoverDebounce: 100,
        getTooltipContent,
        callback: (chartApi) => (api = chartApi),
      });

      act(() => hc.highlightChartPoint(0, 1));
      act(() => api!.highlightChartPoint(hc.getChartPoint(1, 2)));

      expect(tooltipHeader()).toBe("L2 2");

      act(() => vi.advanceTimersByTime(200));

      expect(tooltipHeader()).toBe("L2 2");
    });

    test("removes the cursor preview of a pending hover when an API call cancels it", () => {
      let api: null | CoreChartProps.ChartAPI = null;
      renderChart({
        highcharts,
        options: { series },
        hoverDebounce: 100,
        getTooltipContent,
        callback: (chartApi) => (api = chartApi),
      });

      act(() => hc.highlightChartPoint(1, 1));
      act(() => vi.advanceTimersByTime(100));

      mockPointCoordinates();
      act(() => hc.highlightChartPoint(0, 2));
      expect(selectedMarkerFill()).toBe(hc.getChartSeries(0).color);

      act(() => api!.highlightItems(["L2"]));
      act(() => vi.advanceTimersByTime(200));

      expect(selectedMarkerFill()).not.toBe(hc.getChartSeries(0).color);
      expect(tooltipHeader()).toBe("L2 1");
    });

    test("drops a pending pointer hover when the chart receives keyboard focus", () => {
      const onHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

      act(() => hc.highlightChartPoint(0, 1));
      act(() => createChartWrapper().findApplication()!.focus());
      act(() => vi.advanceTimersByTime(200));

      expect(tooltipHeader()).toBe(null);
      expect(onHighlight).not.toHaveBeenCalled();
    });

    test("lets Escape cancel a pending hover before the tooltip appears", () => {
      const onHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

      mockPointCoordinates();
      act(() => hc.highlightChartPoint(0, 1));
      pressEscape();
      act(() => vi.advanceTimersByTime(200));

      expect(tooltipHeader()).toBe(null);
      expect(highlightMarkers()).toBe(0);
      expect(onHighlight).not.toHaveBeenCalled();
    });

    test("lets legend focus replace a pending pointer hover", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent });

      act(() => hc.highlightChartPoint(0, 1));
      act(() => {
        fireEvent.focus(createChartWrapper().findLegend()!.findItems()[1].getElement());
      });
      act(() => vi.advanceTimersByTime(200));

      expect(dimmedLegendItems()).toEqual(["L1"]);
      expect(tooltipHeader()).toBe(null);
    });

    test("drops a pending pointer hover when series visibility changes", () => {
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
      toggleLegendItem(1);
      act(() => vi.advanceTimersByTime(200));

      expect(tooltipHeader()).toBe(null);
      expect(onHighlight).not.toHaveBeenCalled();
    });
  });

  test("does not apply a pending hover once the pointer has left it", () => {
    const onHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(99));
    act(() => hc.leaveChartPoint(0, 1));
    act(() => vi.advanceTimersByTime(1));

    expect(tooltipHeader()).toBe(null);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  test("keeps a new legend item highlight when the plot hover is lost", () => {
    const onLegendItemHighlight = vi.fn();
    renderChart({ highcharts, options: { series }, hoverDebounce: 100, getTooltipContent, onLegendItemHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    act(() => hc.leaveChartPoint(0, 1));
    hoverLegendItem(1);
    act(() => vi.advanceTimersByTime(200));

    expect(dimmedLegendItems()).toEqual(["L1"]);
    expect(onLegendItemHighlight).toHaveBeenCalledTimes(1);
  });

  test("drops a pending pointer hover when a zoom selection starts", () => {
    const onHighlight = vi.fn();
    renderZoomChart({ zoom: { enabled: true }, hoverDebounce: 100, getTooltipContent, onHighlight });

    act(() => hc.highlightChartPoint(0, 1));
    enterZoomMode();
    act(() => vi.advanceTimersByTime(200));

    expect(tooltipHeader()).toBe(null);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  describe("legend", () => {
    test("delays series highlight when hovering a legend item", () => {
      const onLegendItemHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, onLegendItemHighlight });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(99));

      expect(hc.getChartSeries(1).state).toBe("");
      expect(dimmedLegendItems()).toEqual([]);
      expect(onLegendItemHighlight).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(1));

      expect(hc.getChartSeries(1).state).toBe("inactive");
      expect(dimmedLegendItems()).toEqual(["L2"]);
      expect(onLegendItemHighlight).toHaveBeenCalledTimes(1);
    });

    test("drops a pending legend item highlight when the pointer leaves before the delay passes", () => {
      const onLegendItemHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, onLegendItemHighlight });

      hoverLegendItem(0);
      leaveLegendItem(0);
      act(() => vi.advanceTimersByTime(200));

      expect(dimmedLegendItems()).toEqual([]);
      expect(onLegendItemHighlight).not.toHaveBeenCalled();
    });

    test("cancels a pending legend item highlight as soon as the pointer leaves it", () => {
      const onLegendItemHighlight = vi.fn();
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, onLegendItemHighlight });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(90));
      leaveLegendItem(0);
      act(() => vi.advanceTimersByTime(15));

      expect(dimmedLegendItems()).toEqual([]);
      expect(onLegendItemHighlight).not.toHaveBeenCalled();
    });

    test("lets Escape cancel a pending legend item tooltip", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getLegendTooltipContent });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(50));
      pressEscape();
      act(() => vi.advanceTimersByTime(200));

      expect(legendTooltip()).toBe(null);
    });

    test("drops a pending legend item highlight when the item is toggled", () => {
      const onLegendItemHighlight = vi.fn();
      renderStatefulChart({
        highcharts,
        options: { series },
        hoverDebounce: 100,
        visibleItems: ["L1", "L2"],
        onLegendItemHighlight,
      });

      hoverLegendItem(0);
      toggleLegendItem(0);
      act(() => vi.advanceTimersByTime(200));

      expect(hc.getChartSeries(1).state).toBe("");
      expect(onLegendItemHighlight).not.toHaveBeenCalled();
    });

    test("highlights immediately when a legend item receives focus", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100 });

      act(() => {
        fireEvent.focus(createChartWrapper().findLegend()!.findItems()[0].getElement());
      });

      expect(hc.getChartSeries(1).state).toBe("inactive");
      expect(dimmedLegendItems()).toEqual(["L2"]);
    });

    test("lets keyboard focus on a legend item replace a pending pointer hover on another item", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100 });

      hoverLegendItem(1);
      act(() => {
        fireEvent.focus(createChartWrapper().findLegend()!.findItems()[0].getElement());
      });
      act(() => vi.advanceTimersByTime(200));

      expect(dimmedLegendItems()).toEqual(["L2"]);
    });

    test("shows the legend item tooltip together with the series highlight", () => {
      renderChart({ highcharts, options: { series }, hoverDebounce: 100, getLegendTooltipContent });

      hoverLegendItem(0);
      act(() => vi.advanceTimersByTime(99));

      expect(legendTooltip()).toBe(null);
      expect(dimmedLegendItems()).toEqual([]);

      act(() => vi.advanceTimersByTime(1));

      expect(legendTooltip()).not.toBe(null);
      expect(dimmedLegendItems()).toEqual(["L2"]);
    });

    test("does not reopen the legend item tooltip after the delay changes and the pointer leaves", () => {
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

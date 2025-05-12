// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CoreChartAPI } from "../../../lib/components/core/interfaces-core";
import {
  clickChartPoint,
  createChartWrapper,
  findChart,
  findChartPoint,
  highlightChartPoint,
  leaveChartPoint,
  renderChart,
  TestChartRenderer,
} from "./common";

function hoverTooltip() {
  const tooltipElement = createChartWrapper().findTooltip()!.getElement();
  tooltipElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
}
function leaveTooltip() {
  const tooltipElement = createChartWrapper().findTooltip()!.getElement();
  tooltipElement.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, cancelable: true }));
}

const data = [
  { name: "P1", y: 10 },
  { name: "P2", y: 30 },
  { name: "P3", y: 60 },
];

const series: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data,
  },
];

const lineSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "Line series",
    data: [
      { x: 1, y: 11 },
      { x: 2, y: 12 },
      { x: 3, y: 13 },
    ],
  },
];

describe("CoreChart: tooltip", () => {
  test("renders highcharts tooltip", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series, tooltip: { enabled: true, formatter: () => "Custom content" } },
      tooltip: { enabled: false },
    });

    act(() => highlightChartPoint(0, 0));

    expect(wrapper.findTooltip()).toBe(null);
    expect(wrapper.findHighchartsTooltip()).not.toBe(null);
    expect(wrapper.findHighchartsTooltip()!.getElement().textContent).toBe("Custom content");
  });

  test("shows tooltip on hover", async () => {
    const onPointHighlight = vi.fn();
    const onClearHighlight = vi.fn();
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      onPointHighlight,
      onClearHighlight,
      getTooltipContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }),
    });

    act(() => highlightChartPoint(0, 0));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 0),
      target: expect.objectContaining({ x: 0, y: 10, height: expect.any(Number), width: expect.any(Number) }),
    });
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Tooltip title");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Tooltip body");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Tooltip footer");
    });

    act(() => leaveChartPoint(0, 0));

    await waitFor(() => {
      expect(onClearHighlight).toHaveBeenCalled();
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("shows tooltip with api", async () => {
    let api: null | CoreChartAPI = null;
    const onPointHighlight = vi.fn();
    const onClearHighlight = vi.fn();
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      onPointHighlight,
      onClearHighlight,
      getTooltipContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }),
      callback: (apiRef) => (api = apiRef),
    });

    act(() => api!.highlightChartPoint(findChartPoint(0, 0)));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 0),
      target: expect.objectContaining({ x: 0, y: 10, height: expect.any(Number), width: expect.any(Number) }),
    });
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Tooltip title");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Tooltip body");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Tooltip footer");
    });

    act(() => api!.clearChartHighlight());

    await waitFor(() => {
      expect(onClearHighlight).toHaveBeenCalled();
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("shows tooltip on hover with custom target", () => {
    const mockRenderer = new TestChartRenderer();
    renderChart({
      highcharts,
      options: { series },
      getTooltipContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }),
      onPointHighlight: () => ({ target: { x: 1001, y: 1002, width: 1003, height: 1004 } }),
    });

    const originalRenderer = findChart().renderer;
    findChart().renderer = mockRenderer as unknown as Highcharts.SVGRenderer;

    try {
      act(() => highlightChartPoint(0, 0));
      expect(mockRenderer._rect).toEqual([[1001, 1002, 1003, 1004]]);
    } finally {
      findChart().renderer = originalRenderer;
    }
  });

  test("keeps showing tooltip when cursor is over the tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      getTooltipContent: () => ({ header: "", body: "" }),
    });

    act(() => highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    act(() => {
      hoverTooltip();
      leaveChartPoint(0, 0);
    });

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    act(() => leaveTooltip());

    await waitFor(() => {
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("pins and unpins tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      getTooltipContent: ({ point }) => ({ header: `y${point.y}`, body: "" }),
    });

    // Hover point 1 to show the popover.
    act(() => highlightChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });

    // Make popover pinned on point 1.
    act(() => clickChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
    });

    // Hover and click on point 0.
    // Clicking outside the tooltip also dismisses the tooltip, so we imitate that.
    act(() => {
      highlightChartPoint(0, 0);
      wrapper.findTooltip()!.findDismissButton()!.click();
      clickChartPoint(0, 0);
    });

    // The tooltip moves to point 0, but it is no longer pinned.
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y10");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });
  });

  test("provides point for tooltip.getContent", async () => {
    const getTooltipContent = vi.fn();
    renderChart({ highcharts, options: { series }, getTooltipContent });

    for (let i = 0; i < data.length; i++) {
      act(() => highlightChartPoint(0, i));

      await waitFor(() => {
        expect(getTooltipContent).toHaveBeenCalledWith({ point: findChartPoint(0, i) });
      });
    }
  });

  test("uses target placement", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries },
      tooltip: { placement: "target" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotTop = 15;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10 + 3, y: 15 + 5, height: 1, width: 4 },
    });
  });

  test("uses target placement on inverted chart", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries, chart: { inverted: true } },
      tooltip: { placement: "target" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotWidth = 100;
    findChart().plotTop = 15;
    findChart().plotHeight = 150;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10 + 100 - 5, y: 15 + 150 - 3, height: 4, width: 1 },
    });
  });

  test("uses middle placement", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries },
      tooltip: { placement: "middle" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotWidth = 100;
    findChart().plotTop = 15;
    findChart().plotHeight = 150;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10 + 3, y: 15 + 150 / 2, height: 1, width: 4 },
    });
  });

  test("uses middle placement on inverted chart", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries, chart: { inverted: true } },
      tooltip: { placement: "middle" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotWidth = 100;
    findChart().plotTop = 15;
    findChart().plotHeight = 150;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10 + 100 / 2, y: 15 + 150 - 3, height: 4, width: 1 },
    });
  });

  test("uses outside placement", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries },
      tooltip: { placement: "outside" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotWidth = 100;
    findChart().plotTop = 15;
    findChart().plotHeight = 150;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10 + 3, y: 15, height: 150, width: 1 },
    });
  });

  test("uses outside placement on inverted chart", () => {
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series: lineSeries, chart: { inverted: true } },
      tooltip: { placement: "outside" },
      onPointHighlight,
    });

    findChart().plotLeft = 10;
    findChart().plotWidth = 100;
    findChart().plotTop = 15;
    findChart().plotHeight = 150;
    findChartPoint(0, 1).plotX = 3;
    findChartPoint(0, 1).plotY = 5;

    act(() => highlightChartPoint(0, 1));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 1),
      target: { x: 10, y: 150 + 15 - 3, height: 1, width: 100 },
    });
  });

  test("uses unsupported placement on inverted chart", () => {
    renderChart({ highcharts, options: { series }, tooltip: { placement: "xxx" as any } });

    expect(() => highlightChartPoint(0, 1)).toThrow("Invariant violation: unsupported tooltip placement option.");
  });
});

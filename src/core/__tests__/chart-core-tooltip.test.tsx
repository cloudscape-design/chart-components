// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import {
  clickChartPoint,
  createChartWrapper,
  findChartPoint,
  highlightChartPoint,
  leaveChartPoint,
  renderChart,
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
      tooltip: {
        getTooltipContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }),
        onPointHighlight,
        onClearHighlight,
      },
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

  test("shows tooltip on hover with custom target", () => {
    const getTargetFromPoint = () => ({ x: 1001, y: 1002, width: 1003, height: 1004 });
    const onPointHighlight = vi.fn();
    renderChart({
      highcharts,
      options: { series },
      tooltip: {
        getTooltipContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }),
        getTargetFromPoint,
        onPointHighlight,
      },
    });

    act(() => highlightChartPoint(0, 0));

    expect(onPointHighlight).toHaveBeenCalledWith({
      point: findChartPoint(0, 0),
      target: expect.objectContaining({ x: 1001, y: 1002, width: 1003, height: 1004 }),
    });
  });

  test("keeps showing tooltip when cursor is over the tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      tooltip: {
        getTooltipContent: () => ({ header: "", body: "" }),
      },
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
      tooltip: {
        getTooltipContent: ({ point }) => ({ header: `y${point.y}`, body: "" }),
      },
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
    renderChart({ highcharts, options: { series }, tooltip: { getTooltipContent } });

    for (let i = 0; i < data.length; i++) {
      act(() => highlightChartPoint(0, i));

      await waitFor(() => {
        expect(getTooltipContent).toHaveBeenCalledWith({ point: findChartPoint(0, i) });
      });
    }
  });
});

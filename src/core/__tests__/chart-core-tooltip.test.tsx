// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { createChartWrapper, renderChart } from "./common";

function findChart() {
  return highcharts.charts.find((c) => c)!;
}
function findPoint(seriesIndex: number, pointIndex: number) {
  return findChart().series[seriesIndex].data[pointIndex];
}
function hoverPoint(index: number) {
  findPoint(0, index).onMouseOver();
}
function leavePoint(index: number) {
  findPoint(0, index).onMouseOut();
}
function clickPoint(index: number) {
  findPoint(0, index).graphic!.element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}
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
    });

    hoverPoint(0);

    expect(wrapper.findHighchartsTooltip()).not.toBe(null);
    expect(wrapper.findHighchartsTooltip()!.getElement().textContent).toBe("Custom content");
  });

  test("shows tooltip on hover", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      tooltip: { getContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }) },
    });

    hoverPoint(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Tooltip title");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Tooltip body");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Tooltip footer");
    });

    leavePoint(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("keeps showing tooltip when cursor is over the tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      tooltip: {
        getContent: () => ({ header: "", body: "" }),
      },
    });

    hoverPoint(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    hoverTooltip();
    leavePoint(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    leaveTooltip();

    await waitFor(() => {
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("pins and unpins tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      tooltip: {
        getContent: (point) => ({ header: `y${point.y}`, body: "" }),
      },
    });

    // Hover point 1 to show the popover.
    hoverPoint(1);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });

    // Make popover pinned on point 1.
    clickPoint(1);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
    });

    // Hover and click on point 0.
    // Clicking outside the tooltip also dismisses the tooltip, so we imitate that.
    hoverPoint(0);
    wrapper.findTooltip()!.findDismissButton()!.click();
    clickPoint(0);

    // The tooltip moves to point 0, but it is no longer pinned.
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y10");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });
  });

  test("provides point for tooltip.getContent", async () => {
    const getContent = vi.fn();
    renderChart({ highcharts, options: { series }, tooltip: { getContent } });

    for (let i = 0; i < data.length; i++) {
      hoverPoint(i);

      await waitFor(() => {
        expect(getContent).toHaveBeenCalledWith({ x: i, y: data[i].y });
      });
    }
  });
});

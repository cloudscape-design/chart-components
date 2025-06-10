// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CoreChartAPI } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

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

    act(() => hc.highlightChartPoint(0, 0));

    expect(wrapper.findTooltip()).toBe(null);
    expect(wrapper.findHighchartsTooltip()).not.toBe(null);
    expect(wrapper.findHighchartsTooltip()!.getElement().textContent).toBe("Custom content");
  });

  test("shows tooltip on hover", async () => {
    const onHighlight = vi.fn();
    const onClearHighlight = vi.fn();
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      onHighlight,
      onClearHighlight,
      getTooltipContent: () => ({
        header: () => "Tooltip title",
        body: () => "Tooltip body",
        footer: () => "Tooltip footer",
      }),
    });

    act(() => hc.highlightChartPoint(0, 0));

    expect(onHighlight).toHaveBeenCalledWith(expect.objectContaining({ point: hc.getChartPoint(0, 0) }));
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Tooltip title");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Tooltip body");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Tooltip footer");
    });

    act(() => hc.leaveChartPoint(0, 0));

    await waitFor(() => {
      expect(onClearHighlight).toHaveBeenCalled();
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test("shows tooltip with api", async () => {
    let api: null | CoreChartAPI = null;
    const onHighlight = vi.fn();
    const onClearHighlight = vi.fn();
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      onHighlight,
      onClearHighlight,
      getTooltipContent: () => ({
        header: () => "Tooltip title",
        body: () => "Tooltip body",
        footer: () => "Tooltip footer",
      }),
      callback: (apiRef) => (api = apiRef),
    });

    act(() => api!.highlightChartPoint(hc.getChartPoint(0, 0)));

    expect(onHighlight).toHaveBeenCalledWith(expect.objectContaining({ point: hc.getChartPoint(0, 0) }));
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

  test("keeps showing tooltip when cursor is over the tooltip", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      getTooltipContent: () => ({ header: () => "", body: () => "" }),
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    act(() => {
      hoverTooltip();
      hc.leaveChartPoint(0, 0);
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
      getTooltipContent: ({ point }) => ({ header: () => `y${point?.y}`, body: () => "" }),
    });

    // Hover point 1 to show the popover.
    act(() => hc.highlightChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });

    // Make popover pinned on point 1.
    act(() => hc.clickChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y30");
      expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
    });

    // Hover and click on point 0.
    // Clicking outside the tooltip also dismisses the tooltip, so we imitate that.
    act(() => {
      hc.highlightChartPoint(0, 0);
      wrapper.findTooltip()!.findDismissButton()!.click();
      hc.clickChartPoint(0, 0);
    });

    // The tooltip moves to point 0, but it is no longer pinned.
    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.getElement()).toHaveTextContent("y10");
      expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);
    });
  });

  test("provides point and group for onHighlight and getTooltipContent", async () => {
    const onHighlight = vi.fn();
    const getTooltipContent = vi.fn();
    renderChart({ highcharts, options: { series }, onHighlight, getTooltipContent });

    for (let i = 0; i < data.length; i++) {
      act(() => hc.highlightChartPoint(0, i));

      const point = hc.getChartPoint(0, i);
      await waitFor(() => {
        expect(onHighlight).toHaveBeenCalledWith({ point, group: expect.arrayContaining([point]) });
        expect(getTooltipContent).toHaveBeenCalledWith({ point, group: expect.arrayContaining([point]) });
      });
    }
  });

  test.each([
    { placement: "target", inverted: false },
    { placement: "target", inverted: true },
    { placement: "middle", inverted: false },
    { placement: "middle", inverted: true },
    { placement: "outside", inverted: false },
    { placement: "outside", inverted: true },
  ] as const)(
    "renders tooltip with different placement options, placement=$placement, inverted=$inverted",
    ({ placement, inverted }) => {
      const onHighlight = vi.fn();
      renderChart({
        highcharts,
        options: { chart: { inverted }, series: lineSeries },
        tooltip: { placement },
        onHighlight,
      });

      act(() => hc.highlightChartPoint(0, 1));
      expect(onHighlight).toHaveBeenCalledWith(expect.objectContaining({ point: hc.getChartPoint(0, 1) }));
    },
  );
});

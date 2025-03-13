// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { renderChart } from "./common";

function hoverPoint(index: number) {
  const chart = highcharts.charts.find((c) => c)!;
  chart.series[0].data[index].onMouseOver();
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

describe("CloudscapeHighcharts: tooltip", () => {
  test("renders highcharts tooltip", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series, tooltip: { enabled: true, formatter: () => "Custom content" } },
    });

    hoverPoint(0);

    expect(wrapper.findHighchartsTooltip()).not.toBe(null);
    expect(wrapper.findHighchartsTooltip()!.getElement().textContent).toBe("Custom content");
  });

  test("renders tooltip", async () => {
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

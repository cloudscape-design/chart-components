// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import { renderChart } from "./common";

function hoverLegendItem(index: number) {
  const chart = highcharts.charts.find((c) => c)!;
  const labelElement = (chart.legend.allItems[index] as any).legendItem.label.element;
  labelElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
}

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "P1", data: [1, 2, 3] },
  { type: "line", name: "P2", data: [4, 5, 6], id: "testid" },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 90, id: "testid" },
    ],
    showInLegend: true,
  },
];

describe("CloudscapeHighcharts: legend tooltip", () => {
  test.each(["line", "pie"])("renders legend tooltip for series type = %s", async (seriesType) => {
    const series = seriesType === "line" ? lineSeries : pieSeries;
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      legendTooltip: {
        getContent: (id) => ({ header: `Header ${id}`, body: `Body ${id}`, footer: `Footer ${id}` }),
      },
    });

    hoverLegendItem(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Header P1");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Body P1");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Footer P1");
    });

    hoverLegendItem(1);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Header testid");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Body testid");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Footer testid");
    });
  });
});

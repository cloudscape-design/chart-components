// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import { findChart, renderChart } from "./common";

function findByTextContent(matchedContent: string) {
  for (const element of document.querySelectorAll("*")) {
    if (element.textContent === matchedContent) {
      return element;
    }
  }
  return null;
}

describe("CoreChart: rendering", () => {
  test("renders default fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null });
    expect(wrapper.findFallback()).not.toBe(null);
    expect(wrapper.findFallback()!.findSpinner()).not.toBe(null);
  });

  test("renders custom fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null, fallback: "Custom fallback" });
    expect(wrapper.findFallback()).not.toBe(null);
    expect(wrapper.findFallback()!.getElement()).toHaveTextContent("Custom fallback");
  });

  test("renders chart with highcharts=Highcharts", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { title: { text: "Chart title" } },
    });
    expect(wrapper.getElement()).toHaveTextContent("Chart title");
    expect(wrapper.findFallback()).toBe(null);
  });

  test("renders chart header, filter, vertical axis title, chart plot, legend, and footer", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: {
        series: [{ type: "line" }],
        xAxis: { title: { text: "X-axis title" } },
        yAxis: { title: { text: "Y-axis title" } },
      },
      verticalAxisTitlePlacement: "top",
      header: { content: "Custom header" },
      filter: {
        seriesFilter: true,
        additionalFilters: "Additional filter",
      },
      legend: { title: "Legend title" },
      footer: { content: "Custom footer" },
      i18nStrings: { seriesFilterLabel: "Series filter" },
    });

    const header = wrapper.findHeader()!.getElement();
    expect(header).toHaveTextContent("Custom header");

    const seriesFilter = wrapper.findFilter()!.findSeriesFilter()!.getElement();
    expect(seriesFilter.textContent).toBe("Series filter");
    expect(seriesFilter.compareDocumentPosition(header)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const additionalFilters = wrapper.findFilter()!.findAdditionalFilters()!.getElement();
    expect(additionalFilters.textContent).toBe("Additional filter");
    expect(additionalFilters.compareDocumentPosition(seriesFilter)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const verticalAxisTitle = findByTextContent("Y-axis title")!;
    expect(verticalAxisTitle).not.toBe(null);
    expect(verticalAxisTitle.compareDocumentPosition(additionalFilters)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const chartPlot = wrapper.findChartPlot()!.getElement();
    expect(chartPlot).toHaveTextContent("X-axis title");
    expect(chartPlot.compareDocumentPosition(verticalAxisTitle)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const legend = wrapper.findLegend()!.getElement();
    expect(legend.textContent).toBe("Legend titleSeries 1");
    expect(legend.compareDocumentPosition(chartPlot)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const footer = wrapper.findFooter()!.getElement();
    expect(footer.textContent).toBe("Custom footer");
    expect(footer.compareDocumentPosition(legend)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
  });

  test("exposes chart api via callback prop", () => {
    const callback = vi.fn();
    renderChart({ highcharts, callback });

    expect(callback).toHaveBeenCalledWith({
      chart: findChart(),
      highcharts,
      showTooltipOnPoint: expect.any(Function),
      hideTooltip: expect.any(Function),
      registerLegend: expect.any(Function),
      unregisterLegend: expect.any(Function),
    });
  });
});

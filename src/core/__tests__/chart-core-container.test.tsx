// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { renderChart } from "./common";

describe("CoreChart: container", () => {
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

    const verticalAxisTitle = wrapper.findByClassName(testClasses["vertical-axis-title"])!.getElement();
    expect(verticalAxisTitle.textContent).toBe("Y-axis title");
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

  test("renders x-axis title in the vertical axis title slot when inverted=true", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: {
        chart: { inverted: true },
        series: [{ type: "line" }],
        xAxis: { title: { text: "X-axis title" } },
        yAxis: { title: { text: "Y-axis title" } },
      },
      verticalAxisTitlePlacement: "top",
    });
    const verticalAxisTitle = wrapper.findByClassName(testClasses["vertical-axis-title"])!.getElement();
    expect(verticalAxisTitle.textContent).toBe("X-axis title");
  });

  test.each([{ inverted: false }, { inverted: true }])(
    "does not render vertical axis title slot of side placement is selected, inverted=$inverted",
    ({ inverted }) => {
      const { wrapper } = renderChart({
        highcharts,
        options: {
          chart: { inverted },
          series: [{ type: "line" }],
          xAxis: { title: { text: "X-axis title" } },
          yAxis: { title: { text: "Y-axis title" } },
        },
        verticalAxisTitlePlacement: "side",
      });
      expect(wrapper.findByClassName(testClasses["vertical-axis-title"])).toBe(null);
    },
  );
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { renderChart } from "./common";

describe("CoreChart: container", () => {
  test("renders chart header, filter, vertical axis title, chart plot, navigator, legend, and footer", () => {
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
      navigator: <div>Navigator content</div>,
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

    const verticalAxisTitle = wrapper.findVerticalAxisTitle()!.getElement();
    expect(verticalAxisTitle.textContent).toBe("Y-axis title");
    expect(verticalAxisTitle.compareDocumentPosition(additionalFilters)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const chartPlot = wrapper.findByClassName(testClasses["chart-plot"])!.getElement();
    expect(chartPlot).toHaveTextContent("X-axis title");
    expect(chartPlot.compareDocumentPosition(verticalAxisTitle)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const navigator = wrapper.findNavigator()!.getElement();
    expect(navigator.textContent).toBe("Navigator content");
    expect(navigator.compareDocumentPosition(chartPlot)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const legend = wrapper.findLegend()!.getElement();
    expect(legend.textContent).toBe("Legend titleSeries 1");
    expect(legend.compareDocumentPosition(chartPlot)).toBe(Node.DOCUMENT_POSITION_PRECEDING);

    const footer = wrapper.findFooter()!.getElement();
    expect(footer.textContent).toBe("Custom footer");
    expect(footer.compareDocumentPosition(legend)).toBe(Node.DOCUMENT_POSITION_PRECEDING);
  });

  test.each([
    { verticalAxisTitlePlacement: "top", inverted: false },
    { verticalAxisTitlePlacement: "top", inverted: true },
    { verticalAxisTitlePlacement: "side", inverted: false },
    { verticalAxisTitlePlacement: "side", inverted: true },
  ] as const)(
    "does not render axis titles when not provided, verticalAxisTitlePlacement=$verticalAxisTitlePlacement, inverted=$inverted",
    ({ verticalAxisTitlePlacement, inverted }) => {
      const { wrapper } = renderChart({
        highcharts,
        options: {
          chart: { inverted },
          series: [{ type: "line" }],
          xAxis: { title: { text: "" } },
          yAxis: { title: { text: "" } },
        },
        verticalAxisTitlePlacement,
      });
      expect(wrapper.findXAxisTitle()).toBe(null);
      expect(wrapper.findYAxisTitle()).toBe(null);
      expect(wrapper.findVerticalAxisTitle()).toBe(null);
      expect(wrapper.findHorizontalAxisTitle()).toBe(null);
    },
  );

  test.each([
    { verticalAxisTitlePlacement: "top", inverted: false },
    { verticalAxisTitlePlacement: "top", inverted: true },
    { verticalAxisTitlePlacement: "side", inverted: false },
    { verticalAxisTitlePlacement: "side", inverted: true },
  ] as const)(
    "renders axis titles when provided, verticalAxisTitlePlacement=$verticalAxisTitlePlacement, inverted=$inverted",
    ({ verticalAxisTitlePlacement, inverted }) => {
      const { wrapper } = renderChart({
        highcharts,
        options: {
          chart: { inverted },
          series: [{ type: "line" }],
          xAxis: { title: { text: "X-title" } },
          yAxis: { title: { text: "Y-title" } },
        },
        verticalAxisTitlePlacement,
      });
      expect(wrapper.findXAxisTitle()!.getElement().textContent).toBe("X-title");
      expect(wrapper.findYAxisTitle()!.getElement().textContent).toBe("Y-title");
      expect(wrapper.findHorizontalAxisTitle()!.getElement().textContent).toBe(inverted ? "Y-title" : "X-title");
      expect(wrapper.findVerticalAxisTitle()!.getElement().textContent).toBe(inverted ? "X-title" : "Y-title");
    },
  );
});

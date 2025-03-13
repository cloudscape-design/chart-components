// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render, waitFor } from "@testing-library/react";
import Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

class TestWrapper extends ElementWrapper {
  findLegendItems = () => this.findAllByClassName("highcharts-legend-item");
  findLegendItemsWithWarning = () => {
    const items = this.findAllByClassName("highcharts-legend-item");
    return items.filter((wrapper) => wrapper.findByClassName(testClasses["legend-item-warning"]));
  };
}

function renderChart(props: Partial<CloudscapeHighchartsProps>) {
  const { rerender } = render(
    <CloudscapeHighcharts highcharts={Highcharts} className="test-chart" options={{}} {...props} />,
  );
  const wrapper = new TestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
  return {
    wrapper,
    rerender: (props: Partial<CloudscapeHighchartsProps>) =>
      rerender(<CloudscapeHighcharts highcharts={Highcharts} className="test-chart" options={{}} {...props} />),
  };
}
function getLegendItemsContent(wrapper: TestWrapper) {
  return wrapper.findLegendItems().map((w) => w.getElement().textContent);
}
function getWarningLegendItemsContent(wrapper: TestWrapper) {
  return wrapper.findLegendItemsWithWarning().map((w) => w.getElement().textContent);
}

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line series 1", data: [1, 2, 3] },
  { type: "line", name: "Line series 2", data: [4, 5, 6], id: "testid" },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 30 },
      { name: "P3", y: 60, id: "testid" },
    ],
    showInLegend: true,
  },
];

describe("CloudscapeHighcharts: legend markers", () => {
  test("renders legend warning for line series", async () => {
    const { wrapper, rerender } = renderChart({
      options: { series: lineSeries },
      legendMarkers: { getItemStatus: (id) => (id === "Line series 1" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["Line series 1"]);
    });

    rerender({
      options: { series: lineSeries },
      legendMarkers: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["Line series 2"]);
    });
  });

  test("renders legend warning for pie segments", async () => {
    const { wrapper, rerender } = renderChart({
      options: { series: pieSeries },
      legendMarkers: { getItemStatus: (id) => (id === "P2" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["P1", "P2", "P3"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["P2"]);
    });

    rerender({
      options: { series: pieSeries },
      legendMarkers: { getItemStatus: (id) => (id === "testid" ? "warning" : "normal") },
    });

    await waitFor(() => {
      expect(getLegendItemsContent(wrapper)).toEqual(["P1", "P2", "P3"]);
      expect(getWarningLegendItemsContent(wrapper)).toEqual(["P3"]);
    });
  });
});

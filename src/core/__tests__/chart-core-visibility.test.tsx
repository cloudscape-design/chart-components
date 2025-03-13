// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighchartsWrapper, renderChart, renderStatefulChart } from "./common";

function getLegendItemContent(wrapper: CloudscapeHighchartsWrapper) {
  return wrapper.findLegendItems().map((w) => w.getElement().textContent);
}
function getHiddenLegendItemContent(wrapper: CloudscapeHighchartsWrapper) {
  return wrapper.findHiddenLegendItems().map((w) => w.getElement().textContent);
}

const onToggleVisibleSeries = vi.fn();
const onToggleVisibleItems = vi.fn();

afterEach(() => {
  onToggleVisibleSeries.mockReset();
  onToggleVisibleItems.mockReset();
});

const defaultProps = { highcharts, onToggleVisibleSeries, onToggleVisibleItems };

describe("CloudscapeHighcharts: visibility", () => {
  test.each(["uncontrolled", "controlled"])("toggles series visibility by clicking on legend, %s", (mode) => {
    const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];
    const { wrapper } =
      mode === "uncontrolled"
        ? renderChart({ ...defaultProps, options: { series } })
        : renderStatefulChart({ ...defaultProps, options: { series }, visibleSeries: ["Line series"] });

    expect(wrapper.findLegendItems()).toHaveLength(1);
    expect(wrapper.findLegendItems()[0].getElement()).toHaveTextContent("Line series");
    expect(wrapper.findHiddenLegendItems()).toHaveLength(0);

    wrapper.findLegendItems()[0].click();

    expect(wrapper.findLegendItems()).toHaveLength(1);
    expect(wrapper.findHiddenLegendItems()).toHaveLength(1);
    expect(wrapper.findHiddenLegendItems()[0].getElement()).toHaveTextContent("Line series");

    if (mode === "controlled") {
      expect(onToggleVisibleSeries).toHaveBeenCalledWith(expect.arrayContaining([]));
    }
  });

  test("changes series visibility from the outside", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", name: "Line series 1", data: [1, 2, 3] },
      { type: "line", name: "Line series 2", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, visibleSeries: null });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, visibleSeries: ["Line series 1", "Line series 2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, visibleSeries: ["Line series 1"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 2"]);

    rerender({ ...defaultProps, options: { series }, visibleSeries: ["Line series 2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 1"]);

    rerender({ ...defaultProps, options: { series }, visibleSeries: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
  });

  test("prefers series id over series name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", id: "1", name: "Line", data: [1, 2, 3] },
      { type: "line", id: "2", name: "Line", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, visibleSeries: ["Line"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line", "Line"]);

    rerender({ ...defaultProps, options: { series }, visibleSeries: ["1", "2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    wrapper.findLegendItems()[0].click();

    expect(onToggleVisibleSeries).toHaveBeenCalledWith(expect.arrayContaining(["2"]));
  });

  test.each(["uncontrolled", "controlled"])("toggles items visibility by clicking on legend, %s", (mode) => {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "pie",
        name: "Pie series",
        data: [
          { name: "A", y: 20 },
          { name: "B", y: 80 },
        ],
        showInLegend: true,
      },
    ];
    const { wrapper } =
      mode === "uncontrolled"
        ? renderChart({ highcharts, options: { series } })
        : renderStatefulChart({ ...defaultProps, options: { series }, visibleItems: ["A", "B"] });

    expect(wrapper.findLegendItems()).toHaveLength(2);
    expect(wrapper.findLegendItems()[1].getElement()).toHaveTextContent("B");
    expect(wrapper.findHiddenLegendItems()).toHaveLength(0);

    wrapper.findLegendItems()[1].click();

    expect(wrapper.findLegendItems()).toHaveLength(2);
    expect(wrapper.findHiddenLegendItems()).toHaveLength(1);
    expect(wrapper.findHiddenLegendItems()[0].getElement()).toHaveTextContent("B");

    if (mode === "controlled") {
      expect(onToggleVisibleItems).toHaveBeenCalledWith(expect.arrayContaining(["A"]));
    }
  });

  test("changes items visibility from the outside", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "pie",
        name: "Pie series",
        data: [
          { name: "A", y: 20 },
          { name: "B", y: 80 },
        ],
        showInLegend: true,
      },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, visibleItems: null });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, visibleItems: ["A", "B"] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, visibleItems: ["A"] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["B"]);

    rerender({ ...defaultProps, options: { series }, visibleItems: ["B"] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["A"]);

    rerender({ ...defaultProps, options: { series }, visibleItems: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["A", "B"]);
  });

  test("prefers item id over item name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      {
        type: "pie",
        name: "Pie series",
        data: [
          { id: "1", name: "Segment", y: 20 },
          { id: "2", name: "Segment", y: 80 },
        ],
        showInLegend: true,
      },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, visibleItems: ["Segment"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Segment", "Segment"]);

    rerender({ ...defaultProps, options: { series }, visibleItems: ["1", "2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    wrapper.findLegendItems()[0].click();

    expect(onToggleVisibleItems).toHaveBeenCalledWith(expect.arrayContaining(["2"]));
  });
});

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

const onLegendSeriesClick = vi.fn();
const onLegendItemClick = vi.fn();

afterEach(() => {
  onLegendSeriesClick.mockReset();
  onLegendItemClick.mockReset();
});

const defaultProps = { highcharts, onLegendSeriesClick, onLegendItemClick };

describe("CloudscapeHighcharts: visibility", () => {
  test.each(["uncontrolled", "controlled"])("toggles series visibility by clicking on legend, %s", (mode) => {
    const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];
    const { wrapper } =
      mode === "uncontrolled"
        ? renderChart({ ...defaultProps, options: { series } })
        : renderStatefulChart({ ...defaultProps, options: { series }, hiddenSeries: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    wrapper.findLegendItems()[0].click();

    expect(getLegendItemContent(wrapper)).toEqual(["Line series"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series"]);

    expect(onLegendSeriesClick).toHaveBeenCalledWith("Line series", false);
  });

  test("changes series visibility from the outside", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", name: "Line series 1", data: [1, 2, 3] },
      { type: "line", name: "Line series 2", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, hiddenSeries: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, hiddenSeries: ["Line series 1"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 1"]);

    rerender({ ...defaultProps, options: { series }, hiddenSeries: ["Line series 2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 2"]);

    rerender({ ...defaultProps, options: { series }, hiddenSeries: ["Line series 1", "Line series 2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line series 1", "Line series 2"]);
  });

  test("prefers series id over series name", () => {
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", id: "1", name: "Line", data: [1, 2, 3] },
      { type: "line", id: "2", name: "Line", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, hiddenSeries: ["Line"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, hiddenSeries: ["1", "2"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Line", "Line"]);

    wrapper.findLegendItems()[0].click();

    expect(onLegendSeriesClick).toHaveBeenCalledWith("1", true);
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
        ? renderChart({ ...defaultProps, options: { series } })
        : renderStatefulChart({ ...defaultProps, options: { series }, hiddenItems: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    wrapper.findLegendItems()[1].click();

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["B"]);

    expect(onLegendItemClick).toHaveBeenCalledWith("B", false);
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
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, hiddenItems: [] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["A"] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["A"]);

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["B"] });

    expect(getLegendItemContent(wrapper)).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["B"]);

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["A", "B"] });

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
    const { wrapper, rerender } = renderChart({ ...defaultProps, options: { series }, hiddenItems: ["Segment"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual([]);

    rerender({ ...defaultProps, options: { series }, hiddenItems: ["1"] });

    expect(getLegendItemContent(wrapper)).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent(wrapper)).toEqual(["Segment"]);

    wrapper.findLegendItems()[0].click();

    expect(onLegendItemClick).toHaveBeenCalledWith("1", true);

    wrapper.findLegendItems()[1].click();

    expect(onLegendItemClick).toHaveBeenCalledWith("2", false);
  });
});

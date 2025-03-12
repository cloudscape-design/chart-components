// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { render } from "@testing-library/react";
import Highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

class TestWrapper extends ElementWrapper {
  findLegendItems = () => this.findAllByClassName("highcharts-legend-item");
  findHiddenLegendItems = () => this.findAllByClassName("highcharts-legend-item-hidden");
}

function StatefulChart(props: CloudscapeHighchartsProps) {
  const [visibleSeries, setVisibleSeries] = useState<null | string[]>(props.visibleSeries ?? null);
  const [visibleItems, setVisibleItems] = useState<null | string[]>(props.visibleItems ?? null);
  return (
    <CloudscapeHighcharts
      {...props}
      visibleSeries={visibleSeries}
      onToggleVisibleSeries={(state) => {
        setVisibleSeries(state);
        props.onToggleVisibleSeries?.(state);
      }}
      visibleItems={visibleItems}
      onToggleVisibleItems={(state) => {
        setVisibleItems(state);
        props.onToggleVisibleItems?.(state);
      }}
    />
  );
}

function renderChart(props: Partial<CloudscapeHighchartsProps>, Component = CloudscapeHighcharts) {
  const { rerender } = render(<Component highcharts={Highcharts} className="test-chart" options={{}} {...props} />);
  const wrapper = new TestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
  return {
    wrapper,
    rerender: (props: Partial<CloudscapeHighchartsProps>) =>
      rerender(<Component highcharts={Highcharts} className="test-chart" options={{}} {...props} />),
  };
}

function renderStatefulChart(props: Partial<CloudscapeHighchartsProps>) {
  return renderChart(props, StatefulChart);
}

describe("CloudscapeHighcharts: visibility", () => {
  test.each(["uncontrolled", "controlled"])("toggles series visibility by clicking on legend, %s", (mode) => {
    const onToggleVisibleSeries = vi.fn();
    const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];
    const { wrapper } =
      mode === "uncontrolled"
        ? renderChart({ options: { series } })
        : renderStatefulChart({ options: { series }, visibleSeries: ["Line series"], onToggleVisibleSeries });

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
    const onToggleVisibleSeries = vi.fn();
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", name: "Line series 1", data: [1, 2, 3] },
      { type: "line", name: "Line series 2", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ options: { series }, visibleSeries: null, onToggleVisibleSeries });
    const getLegendItemContent = () => wrapper.findLegendItems().map((w) => w.getElement().textContent);
    const getHiddenLegendItemContent = () => wrapper.findHiddenLegendItems().map((w) => w.getElement().textContent);

    expect(getLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    rerender({ options: { series }, visibleSeries: ["Line series 1", "Line series 2"], onToggleVisibleSeries });

    expect(getLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    rerender({ options: { series }, visibleSeries: ["Line series 1"], onToggleVisibleSeries });

    expect(getLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent()).toEqual(["Line series 2"]);

    rerender({ options: { series }, visibleSeries: ["Line series 2"], onToggleVisibleSeries });

    expect(getLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent()).toEqual(["Line series 1"]);

    rerender({ options: { series }, visibleSeries: [], onToggleVisibleSeries });

    expect(getLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
    expect(getHiddenLegendItemContent()).toEqual(["Line series 1", "Line series 2"]);
  });

  test("prefers series id over series name", () => {
    const onToggleVisibleSeries = vi.fn();
    const series: Highcharts.SeriesOptionsType[] = [
      { type: "line", id: "1", name: "Line", data: [1, 2, 3] },
      { type: "line", id: "2", name: "Line", data: [1, 2, 3] },
    ];
    const { wrapper, rerender } = renderChart({ options: { series }, visibleSeries: ["Line"], onToggleVisibleSeries });
    const getLegendItemContent = () => wrapper.findLegendItems().map((w) => w.getElement().textContent);
    const getHiddenLegendItemContent = () => wrapper.findHiddenLegendItems().map((w) => w.getElement().textContent);

    expect(getLegendItemContent()).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent()).toEqual(["Line", "Line"]);

    rerender({ options: { series }, visibleSeries: ["1", "2"], onToggleVisibleSeries });

    expect(getLegendItemContent()).toEqual(["Line", "Line"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    wrapper.findLegendItems()[0].click();

    expect(onToggleVisibleSeries).toHaveBeenCalledWith(expect.arrayContaining(["2"]));
  });

  test.each(["uncontrolled", "controlled"])("toggles items visibility by clicking on legend, %s", (mode) => {
    const onToggleVisibleItems = vi.fn();
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
        ? renderChart({ options: { series } })
        : renderStatefulChart({ options: { series }, visibleItems: ["A", "B"], onToggleVisibleItems });

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
    const onToggleVisibleItems = vi.fn();
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
    const { wrapper, rerender } = renderChart({ options: { series }, visibleItems: null, onToggleVisibleItems });
    const getLegendItemContent = () => wrapper.findLegendItems().map((w) => w.getElement().textContent);
    const getHiddenLegendItemContent = () => wrapper.findHiddenLegendItems().map((w) => w.getElement().textContent);

    expect(getLegendItemContent()).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    rerender({ options: { series }, visibleItems: ["A", "B"], onToggleVisibleItems });

    expect(getLegendItemContent()).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    rerender({ options: { series }, visibleItems: ["A"], onToggleVisibleItems });

    expect(getLegendItemContent()).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent()).toEqual(["B"]);

    rerender({ options: { series }, visibleItems: ["B"], onToggleVisibleItems });

    expect(getLegendItemContent()).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent()).toEqual(["A"]);

    rerender({ options: { series }, visibleItems: [], onToggleVisibleItems });

    expect(getLegendItemContent()).toEqual(["A", "B"]);
    expect(getHiddenLegendItemContent()).toEqual(["A", "B"]);
  });

  test("prefers item id over item name", () => {
    const onToggleVisibleItems = vi.fn();
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
    const { wrapper, rerender } = renderChart({ options: { series }, visibleItems: ["Segment"], onToggleVisibleItems });
    const getLegendItemContent = () => wrapper.findLegendItems().map((w) => w.getElement().textContent);
    const getHiddenLegendItemContent = () => wrapper.findHiddenLegendItems().map((w) => w.getElement().textContent);

    expect(getLegendItemContent()).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent()).toEqual(["Segment", "Segment"]);

    rerender({ options: { series }, visibleItems: ["1", "2"], onToggleVisibleItems });

    expect(getLegendItemContent()).toEqual(["Segment", "Segment"]);
    expect(getHiddenLegendItemContent()).toEqual([]);

    wrapper.findLegendItems()[0].click();

    expect(onToggleVisibleItems).toHaveBeenCalledWith(expect.arrayContaining(["2"]));
  });
});

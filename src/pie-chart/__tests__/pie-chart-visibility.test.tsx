// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import { ref, renderPieChart, renderStatefulPieChart } from "./common";

const getChart = () => createWrapper().findChart("pie")!;
const getLegend = () => getChart().findLegend()!;

function getVisibilityState() {
  const legend = getChart().findLegend();
  const chart = highcharts.charts.find((c) => c)!;
  const points = chart.series.flatMap((s) => s.data);
  const hiddenPoints = points.filter((p) => !p.visible);
  return {
    allLegendItems: legend?.findItems().map((w) => w.getElement().textContent) ?? [],
    hiddenLegendItems: legend?.findItems({ hidden: true }).map((w) => w.getElement().textContent) ?? [],
    allPoints: points.map((p) => p.options.id ?? p.name),
    hiddenPoints: hiddenPoints.map((p) => p.options.id ?? p.name),
  };
}

const onChangeVisibleSegments = vi.fn();

afterEach(() => {
  onChangeVisibleSegments.mockReset();
});

const defaultProps = { highcharts, onChangeVisibleSegments };

const series: PieChartProps.SeriesOptions = {
  name: "Pie",
  type: "pie",
  data: [
    { name: "P1", y: 10 },
    { name: "P2", y: 20 },
    { name: "P3", y: 70 },
  ],
};

describe("PieChart: visibility", () => {
  test("controls segments visibility", () => {
    renderStatefulPieChart({ ...defaultProps, series, visibleSegments: ["P1", "P2", "P3"] });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["P1", "P2", "P3"],
      hiddenLegendItems: [],
      allPoints: ["P1", "P2", "P3"],
      hiddenPoints: [],
    });

    act(() => getLegend()!.findItems()[0].click());

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["P1", "P2", "P3"],
      hiddenLegendItems: ["P1"],
      allPoints: ["P1", "P2", "P3"],
      hiddenPoints: ["P1"],
    });

    expect(onChangeVisibleSegments).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          visibleSegments: ["P2", "P3"],
        },
      }),
    );
  });

  test("changes segments visibility using ref", () => {
    renderPieChart({ ...defaultProps, series });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["P1", "P2", "P3"],
      hiddenLegendItems: [],
      allPoints: ["P1", "P2", "P3"],
      hiddenPoints: [],
    });

    act(() => ref.current!.setVisibleSegments([]));

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["P1", "P2", "P3"],
      hiddenLegendItems: ["P1", "P2", "P3"],
      allPoints: ["P1", "P2", "P3"],
      hiddenPoints: ["P1", "P2", "P3"],
    });
  });
});

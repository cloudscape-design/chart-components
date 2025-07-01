// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { toggleLegendItem } from "../../core/__tests__/common";
import { getChart, ref, renderCartesianChart, renderStatefulCartesianChart } from "./common";

function getVisibilityState() {
  const legend = getChart().findLegend();
  const chart = highcharts.charts.find((c) => c)!;
  const series = chart.series;
  const hiddenSeries = series.filter((s) => !s.visible);
  return {
    allLegendItems: legend?.findItems().map((w) => w.getElement().textContent) ?? [],
    hiddenLegendItems: legend?.findItems({ active: false }).map((w) => w.getElement().textContent) ?? [],
    allSeries: series.map((s) => s.options.id ?? s.name),
    hiddenSeries: hiddenSeries.map((s) => s.options.id ?? s.name),
  };
}

const onVisibleSeriesChange = vi.fn();

afterEach(() => {
  onVisibleSeriesChange.mockReset();
});

const defaultProps = { highcharts, onVisibleSeriesChange };

const lineSeries: CartesianChartProps.SeriesOptions[] = [
  {
    type: "line",
    name: "L1",
    data: [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    type: "line",
    name: "L2",
    data: [
      { x: 0, y: 3 },
      { x: 1, y: 4 },
    ],
  },
];

describe("CartesianChart: visibility", () => {
  test("controls series visibility", () => {
    renderStatefulCartesianChart({
      ...defaultProps,
      series: lineSeries,
      visibleSeries: ["L1", "L2"],
    });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: [],
      allSeries: ["L1", "L2"],
      hiddenSeries: [],
    });

    toggleLegendItem(0);

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: ["L1"],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L1"],
    });

    expect(onVisibleSeriesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          visibleSeries: ["L2"],
        },
      }),
    );
  });

  test("changes series visibility using ref", () => {
    renderCartesianChart({ ...defaultProps, series: lineSeries });

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: [],
      allSeries: ["L1", "L2"],
      hiddenSeries: [],
    });

    act(() => ref.current!.setVisibleSeries([]));

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["L1", "L2"],
      hiddenLegendItems: ["L1", "L2"],
      allSeries: ["L1", "L2"],
      hiddenSeries: ["L1", "L2"],
    });
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "@cloudscape-design/components/test-utils/dom";
import { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import { toggleLegendItem } from "../../core/__tests__/common";
import { ref, renderPieChart, renderStatefulPieChart } from "./common";

const getChart = () => createWrapper().findPieHighcharts()!;

function getVisibilityState() {
  const legend = getChart().findLegend();
  const chart = highcharts.charts.find((c) => c)!;
  const points = chart.series.flatMap((s) => s.data);
  const hiddenPoints = points.filter((p) => !p.visible);
  return {
    allLegendItems: legend?.findItems().map((w) => w.getElement().textContent) ?? [],
    hiddenLegendItems: legend?.findItems({ active: false }).map((w) => w.getElement().textContent) ?? [],
    allPoints: points.map((p) => p.options.id ?? p.name),
    hiddenPoints: hiddenPoints.map((p) => p.options.id ?? p.name),
  };
}

const onVisibleSegmentsChange = vi.fn();

afterEach(() => {
  onVisibleSegmentsChange.mockReset();
});

const defaultProps = { highcharts, onVisibleSegmentsChange };

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

    toggleLegendItem(0);

    expect(getVisibilityState()).toEqual({
      allLegendItems: ["P1", "P2", "P3"],
      hiddenLegendItems: ["P1"],
      allPoints: ["P1", "P2", "P3"],
      hiddenPoints: ["P1"],
    });

    expect(onVisibleSegmentsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          visibleSegments: ["P2", "P3"],
        },
      }),
    );
  });

  describe("changes segments visibility using imperative API", () => {
    test("setVisibleSegments", () => {
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

      act(() => ref.current!.setVisibleSegments(["P1"]));

      expect(getVisibilityState()).toEqual({
        allLegendItems: ["P1", "P2", "P3"],
        hiddenLegendItems: ["P2", "P3"],
        allPoints: ["P1", "P2", "P3"],
        hiddenPoints: ["P2", "P3"],
      });
    });

    test("showAllSegments", () => {
      renderPieChart({ ...defaultProps, series });

      expect(getVisibilityState()).toEqual({
        allLegendItems: ["P1", "P2", "P3"],
        hiddenLegendItems: [],
        allPoints: ["P1", "P2", "P3"],
        hiddenPoints: [],
      });

      act(() => ref.current!.showAllSegments());

      expect(getVisibilityState()).toEqual({
        allLegendItems: ["P1", "P2", "P3"],
        hiddenLegendItems: [],
        allPoints: ["P1", "P2", "P3"],
        hiddenPoints: [],
      });
    });
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { highlightChartPoint, leaveChartPoint, renderCartesianChart } from "./common";

const lineSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

describe("CartesianChart: tooltip", () => {
  test("renders tooltip on point highlight", async () => {
    const { wrapper } = renderCartesianChart({
      highcharts,
      series: lineSeries,
    });

    act(() => highlightChartPoint(1, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("1.00");
      expect(wrapper.findTooltip()!.findSeries()).toHaveLength(3);
      expect(wrapper.findTooltip()!.findSeries()![0].findKey().getElement().textContent).toBe("Line 1");
      expect(wrapper.findTooltip()!.findSeries()![0].findValue().getElement().textContent).toBe("2.00");
      expect(wrapper.findTooltip()!.findSeries()![1].findKey().getElement().textContent).toBe("Line 2");
      expect(wrapper.findTooltip()!.findSeries()![1].findValue().getElement().textContent).toBe("5.00");
      expect(wrapper.findTooltip()!.findSeries()![2].findKey().getElement().textContent).toBe("Line 3");
      expect(wrapper.findTooltip()!.findSeries()![2].findValue().getElement().textContent).toBe("8.00");
      expect(wrapper.findTooltip()!.findFooter()).toBe(null);
    });

    act(() => leaveChartPoint(1, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).toBe(null);
    });
  });

  test.each([{ x: 0.01 }, { x: 1 }, { x: 999 }])(
    "renders all supported series types in tooltip details, x=$x",
    async ({ x }) => {
      const { wrapper } = renderCartesianChart({
        highcharts,
        series: [
          { type: "area", name: "Area", data: [{ x, y: 1 }] },
          { type: "areaspline", name: "\nArea spline", data: [{ x, y: 2 }] },
          { type: "column", name: "\nColumn", data: [{ x, y: 3 }] },
          { type: "errorbar", name: "\nError bar", data: [{ x, low: 4, high: 5 }] },
          { type: "line", name: "\nLine", data: [{ x, y: 6 }] },
          { type: "scatter", name: "\nScatter", data: [{ x, y: 7 }] },
          { type: "spline", name: "\nSpline", data: [{ x, y: 8 }] },
          { type: "x-threshold", name: "\nX threshold", value: x },
          { type: "y-threshold", name: "\nY threshold", value: 9 },
        ],
        xAxis: { valueDecimals: x > 0 ? 0 : 2 },
        yAxis: { valueDecimals: 0 },
      });

      act(() => highlightChartPoint(0, 0));

      await waitFor(() => {
        expect(wrapper.findTooltip()).not.toBe(null);
        expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe(x.toFixed(x > 0 ? 0 : 2));
        expect(wrapper.findTooltip()!.findSeries()).toHaveLength(9);
        expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe(
          `Area1\nArea spline2\nColumn3\nError bar4 : 5\nLine6\nScatter7\nSpline8\nX threshold\nY threshold9`,
        );
      });
    },
  );
});

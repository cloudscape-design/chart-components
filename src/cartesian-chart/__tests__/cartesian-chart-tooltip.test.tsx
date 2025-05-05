// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

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
});

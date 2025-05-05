// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import { PieChartProps } from "../../../lib/components/pie-chart";
import { highlightChartPoint, leaveChartPoint, renderPieChart } from "./common";

const series: PieChartProps.SeriesOptions = {
  name: "Pie",
  type: "pie",
  data: [
    { name: "P1", y: 10 },
    { name: "P2", y: 20 },
    { name: "P3", y: 70 },
  ],
};

describe("PieChart: tooltip", () => {
  test("renders tooltip on point highlight", async () => {
    const { wrapper } = renderPieChart({ highcharts, series });

    act(() => highlightChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe(" P2");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Pie20");
      expect(wrapper.findTooltip()!.findFooter()).toBe(null);
    });

    act(() => leaveChartPoint(0, 1));

    await waitFor(() => {
      expect(wrapper.findTooltip()).toBe(null);
    });
  });
});

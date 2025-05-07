// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import { PieChartProps } from "../../../lib/components/pie-chart";
import { createChartWrapper, highlightChartPoint, leaveChartPoint, renderPieChart } from "./common";

const series: PieChartProps.SeriesOptions = {
  name: "Pie",
  type: "pie",
  data: [
    { id: "1", name: "P1", y: 10 },
    { id: "2", name: "P2", y: 20 },
    { id: "3", name: "P3", y: 70 },
  ],
};

const getTooltip = () => createChartWrapper().findTooltip()!;
const getTooltipHeader = () => createChartWrapper().findTooltip()!.findHeader()!;
const getTooltipBody = () => createChartWrapper().findTooltip()!.findBody()!;
const getTooltipFooter = () => createChartWrapper().findTooltip()!.findFooter()!;

describe("PieChart: tooltip", () => {
  test("renders tooltip on point highlight", async () => {
    renderPieChart({ highcharts, series });

    act(() => highlightChartPoint(0, 1));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
      expect(getTooltipHeader().getElement().textContent).toBe(" P2");
      expect(getTooltipBody().getElement().textContent).toBe("Pie20");
      expect(getTooltipFooter()).toBe(null);
    });

    act(() => leaveChartPoint(0, 1));

    await waitFor(() => {
      expect(getTooltip()).toBe(null);
    });
  });

  test("customizes tooltip slots", async () => {
    renderPieChart({
      highcharts,
      series,
      tooltip: {
        header({ segmentId, segmentName, segmentValue, totalValue }) {
          return (
            <span>
              header {segmentId} {segmentName} {segmentValue} {totalValue}
            </span>
          );
        },
        body({ segmentId, segmentName, segmentValue, totalValue }) {
          return (
            <span>
              body {segmentId} {segmentName} {segmentValue} {totalValue}
            </span>
          );
        },
        footer({ segmentId, segmentName, segmentValue, totalValue }) {
          return (
            <span>
              footer {segmentId} {segmentName} {segmentValue} {totalValue}
            </span>
          );
        },
      },
    });

    act(() => highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });

    expect(getTooltipHeader().getElement().textContent).toBe("header 1 P1 10 100");
    expect(getTooltipBody().getElement().textContent).toBe("body 1 P1 10 100");
    expect(getTooltipFooter().getElement().textContent).toBe("footer 1 P1 10 100");
  });
});

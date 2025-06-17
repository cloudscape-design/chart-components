// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { renderPieChart } from "./common";

const hc = new HighchartsTestHelper(highcharts);

const series: PieChartProps.SeriesOptions = {
  name: "Pie",
  type: "pie",
  data: [
    { id: "1", name: "P1", y: 10 },
    { id: "2", name: "P2", y: 20 },
    { id: "3", name: "P3", y: 70 },
  ],
};

const getChart = () => createWrapper().findPieHighcharts()!;
const getTooltip = () => getChart().findTooltip()!;
const getTooltipHeader = () => getChart().findTooltip()!.findHeader()!;
const getTooltipBody = () => getChart().findTooltip()!.findBody()!;
const getTooltipFooter = () => getChart().findTooltip()!.findFooter()!;

describe("PieChart: tooltip", () => {
  test("renders tooltip on point highlight", async () => {
    renderPieChart({ highcharts, series });

    act(() => hc.highlightChartPoint(0, 1));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
      expect(getTooltipHeader().getElement().textContent).toBe("P2");
      expect(getTooltipBody().getElement().textContent).toBe("Pie20");
      expect(getTooltipFooter()).toBe(null);
    });

    act(() => hc.leaveChartPoint(0, 1));

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

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });

    expect(getTooltipHeader().getElement().textContent).toBe("header 1 P1 10 100");
    expect(getTooltipBody().getElement().textContent).toBe("body 1 P1 10 100");
    expect(getTooltipFooter().getElement().textContent).toBe("footer 1 P1 10 100");
  });
});

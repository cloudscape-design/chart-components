// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { renderCartesianChart } from "./common";
import { getAllTooltipSeries, getTooltip, getTooltipSeries } from "./tooltip-utils";

const hc = new HighchartsTestHelper(highcharts);

describe("CartesianChart: Error bars", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("renders error bar information in the tooltip", async () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "column", name: "Column 1", data: [2], id: "column-1" },
        { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
      ],
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });
    expect(getAllTooltipSeries()).toHaveLength(1);
    expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
    expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
    expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("Error range1 - 3");
  });

  test("renders only the error range if error bar series name is not provided", async () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "column", name: "Column 1", data: [2], id: "column-1" },
        { type: "errorbar", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
      ],
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });
    expect(getAllTooltipSeries()).toHaveLength(1);
    expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("1 - 3");
  });

  test("supports customization of the tooltip", async () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "column", name: "Column 1", data: [2], id: "column-1" },
        { type: "errorbar", name: "Column 2", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
      ],
      tooltip: {
        series: ({ item }) => ({
          key: `Custom key ${item.series.name}`,
          value: `Custom value ${item.y}`,
          details: `Custom details ${item.error?.low} - ${item.error?.high}`,
        }),
      },
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });
    expect(getAllTooltipSeries()).toHaveLength(1);
    expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Custom key Column 1");
    expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("Custom value 2");
    expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("Custom details 1 - 3");
  });

  test("issues a warning if linkedTo does not refer to an existing series id", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderCartesianChart({
      highcharts,
      series: [{ type: "errorbar", linkedTo: "nonExistingId", data: [{ low: 1, high: 2 }] }],
    });

    act(() => hc.highlightChartPoint(0, 0));
    expect(spy).toHaveBeenCalledOnce();
  });
});

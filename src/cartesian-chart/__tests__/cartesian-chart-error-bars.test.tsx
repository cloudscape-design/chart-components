// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { MockInstance, vi } from "vitest";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { renderCartesianChart } from "./common";
import { getAllTooltipSeries, getTooltip, getTooltipSeries } from "./tooltip-utils";

const hc = new HighchartsTestHelper(highcharts);

describe("CartesianChart: Error bars", () => {
  describe("Tooltip", () => {
    test("renders error bar information in the tooltip", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
        ],
      });

      await highlightFirstPoint();
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("Error range1 - 3");
    });

    test("attaches error series to the previous series by using `:previous` as value for `linkedTo`", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2] },
          { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: ":previous" },
        ],
      });

      await highlightFirstPoint();
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

      await highlightFirstPoint();
      expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("1 - 3");
    });

    test("renders multiple error bars per series", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", name: "Error range 1", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
          { type: "errorbar", name: "Error range 2", data: [{ low: 0, high: 4 }], linkedTo: "column-1" },
        ],
      });

      await highlightFirstPoint();
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe(
        "Error range 1" + "1 - 3" + "Error range 2" + "0 - 4",
      );
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
            details: `Custom details ${item.errorRanges![0].low} - ${item.errorRanges![0].high}`,
          }),
        },
      });

      await highlightFirstPoint();
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Custom key Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("Custom value 2");
      expect(getTooltipSeries(0).findDetails().getElement().textContent).toBe("Custom details 1 - 3");
    });
  });

  describe("Warnings", () => {
    let spy: MockInstance;
    beforeEach(() => {
      spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      expect(spy).toHaveBeenCalledOnce();
      vi.resetAllMocks();
    });

    test("emits a warning if linkedTo does not refer to an existing series id", () => {
      renderCartesianChart({
        highcharts,
        series: [{ type: "errorbar", linkedTo: "nonExistingId", data: [{ low: 1, high: 2 }] }],
      });
      expect(spy).toHaveBeenCalledOnce();
    });

    test.each(["area", "areaspline", "scatter"] as const)(
      "emits a warning if error bar is attached to a non-supported series type: %s",
      (type) => {
        renderCartesianChart({
          highcharts,
          series: [
            { type, id: "id", name: "name", data: [1] },
            { type: "errorbar", linkedTo: "id", data: [{ low: 1, high: 2 }] },
          ],
        });
        expect(spy).toHaveBeenCalledOnce();
      },
    );

    test.each(["x-threshold", "y-threshold"] as const)(
      "emits a warning if error bar is attached to a non-supported series type: %s",
      (type) => {
        renderCartesianChart({
          highcharts,
          series: [
            { type, id: "id", name: "name", value: 1 },
            { type: "errorbar", linkedTo: "id", data: [{ low: 1, high: 2 }] },
          ],
        });
        expect(spy).toHaveBeenCalledOnce();
      },
    );

    test("emits a warning if error bar is attached to a non-supported series type: errorbar", () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", id: "column", name: "name", data: [1] },
          { type: "errorbar", linkedTo: "column", id: "errorbar-1", name: "name", data: [{ low: 1, high: 2 }] },
          { type: "errorbar", linkedTo: "errorbar-1", data: [{ low: 1, high: 2 }] },
        ],
      });
      expect(spy).toHaveBeenCalledOnce();
    });

    test("emits a warning if error bar is attached to a stacked column series", () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", id: "id", name: "name", data: [1] },
          { type: "errorbar", linkedTo: "id", data: [{ low: 1, high: 2 }] },
        ],
        stacked: true,
      });
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});

async function highlightFirstPoint() {
  act(() => hc.highlightChartPoint(0, 0));

  await waitFor(() => {
    expect(getTooltip()).not.toBe(null);
  });
  expect(getAllTooltipSeries()).toHaveLength(1);
}

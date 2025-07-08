// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import * as ComponentToolkitInternal from "@cloudscape-design/component-toolkit/internal";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { getAllTooltipSeries, getTooltip, getTooltipSeries, renderCartesianChart } from "./common";

const hc = new HighchartsTestHelper(highcharts);

describe("CartesianChart: errorbar series", () => {
  describe("tooltip", () => {
    test("renders error bar information in the tooltip", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
        ],
      });

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("Error range1 - 3");
    });

    test("attaches error series to the previous series by using `:previous` as value for `linkedTo`", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2] },
          { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: ":previous" },
        ],
      });

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("Error range1 - 3");
    });

    test("renders only the error range if error bar series name is not provided", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
        ],
      });

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("1 - 3");
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

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe(
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
          point: ({ item }) => ({
            key: `Custom key ${item.series.name}`,
            value: `Custom value ${item.y}`,
            description: `Custom description ${item.errorRanges![0].low} - ${item.errorRanges![0].high}`,
          }),
        },
      });

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Custom key Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("Custom value 2");
      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("Custom description 1 - 3");
    });

    test("does not render description if set to null", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", name: "Column 2", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
        ],
        tooltip: {
          point: () => ({
            description: null,
          }),
        },
      });

      await highlightFirstPointAndWaitForTooltip();

      expect(getAllTooltipSeries()).toHaveLength(1);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Column 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(0).findDescription()).toBe(null);
    });
  });

  describe("validation", () => {
    const warnOnce = vi.spyOn(ComponentToolkitInternal, "warnOnce");

    beforeEach(() => {
      warnOnce.mockImplementation(() => null);
    });

    afterEach(() => {
      warnOnce.mockReset();
    });

    test("emits a warning and removes error-bar series if it is linked to a missing series", () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "line", name: "line", data: [1.5] },
          { type: "errorbar", linkedTo: "nonExistingId", data: [{ low: 1, high: 2 }] },
        ],
      });
      expect(warnOnce).toHaveBeenCalledWith(
        "CartesianChart",
        'The `linkedTo` property of "errorbar" series points to a missing, or unsupported series.',
      );
      expect(hc.getChart().series).toHaveLength(1);
    });

    test.each(["errorbar", "x-threshold", "y-threshold"])(
      "emits a warning and removes error-bar series if it is linked to an unsupported series type: %s",
      (linkedTo) => {
        renderCartesianChart({
          highcharts,
          series: [
            { type: "line", id: "line", name: "line", data: [] },
            { type: "errorbar", id: "errorbar", name: "errorbar", data: [], linkedTo: "line" },
            { type: "x-threshold", id: "x-threshold", name: "x-threshold", value: 0 },
            { type: "y-threshold", id: "y-threshold", name: "y-threshold", value: 0 },
            { type: "errorbar", data: [], linkedTo },
          ],
        });
        expect(warnOnce).toHaveBeenCalledWith(
          "CartesianChart",
          'The `linkedTo` property of "errorbar" series points to a missing, or unsupported series.',
        );
        expect(hc.getChart().series).toHaveLength(4);
      },
    );

    test("emits a warning and removes error-bar series if using error bars with stacked series", () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "line", id: "id", name: "line", data: [] },
          { type: "errorbar", data: [], linkedTo: "id" },
        ],
        stacking: "normal",
      });
      expect(warnOnce).toHaveBeenCalledWith("CartesianChart", "Error bars are not supported for stacked series.");
      expect(hc.getChart().series).toHaveLength(1);
    });
  });
});

async function highlightFirstPointAndWaitForTooltip() {
  act(() => hc.highlightChartPoint(0, 0));
  await waitFor(() => expect(getTooltip()).not.toBe(null));
}

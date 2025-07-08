// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import {
  getAllTooltipSeries,
  getTooltip,
  getTooltipBody,
  getTooltipFooter,
  getTooltipHeader,
  getTooltipSeries,
  renderCartesianChart,
} from "./common";

const hc = new HighchartsTestHelper(highcharts);

const lineSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

describe("CartesianChart: tooltip", () => {
  test("renders tooltip on point highlight", async () => {
    renderCartesianChart({
      highcharts,
      series: lineSeries,
    });

    act(() => hc.highlightChartPoint(1, 1));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
      expect(getTooltipHeader().getElement().textContent).toBe("1");
      expect(getAllTooltipSeries()).toHaveLength(3);
      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Line 1");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
      expect(getTooltipSeries(1).findKey().getElement().textContent).toBe("Line 2");
      expect(getTooltipSeries(1).findValue().getElement().textContent).toBe("5");
      expect(getTooltipSeries(2).findKey().getElement().textContent).toBe("Line 3");
      expect(getTooltipSeries(2).findValue().getElement().textContent).toBe("8");
      expect(getTooltipFooter()).toBe(null);
    });

    act(() => hc.leaveChartPoint(1, 1));

    await waitFor(() => expect(getTooltip()).toBe(null));
  });

  test.each([{ x: 0.01 }, { x: 1 }, { x: 999 }])(
    "renders all supported series types in tooltip details, x=$x",
    async ({ x }) => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "area", name: "Area", data: [{ x, y: 1 }] },
          { type: "areaspline", name: "\nArea spline", data: [{ x, y: 2 }] },
          { type: "column", id: "c", name: "\nColumn", data: [{ x, y: 3 }] },
          { type: "errorbar", name: "\nError bar", data: [{ x, low: 4, high: 5 }], linkedTo: "c" },
          { type: "line", name: "\nLine", data: [{ x, y: 6 }] },
          { type: "scatter", name: "\nScatter", data: [{ x, y: 7 }] },
          { type: "spline", name: "\nSpline", data: [{ x, y: 8 }] },
          { type: "x-threshold", name: "\nX threshold", value: x },
          { type: "y-threshold", name: "\nY threshold", value: 9 },
        ],
      });

      act(() => hc.highlightChartPoint(0, 0));

      await waitFor(() => expect(getTooltip()).not.toBe(null));

      expect(getTooltipHeader().getElement().textContent).toBe(x === 0.01 ? "0.01" : x.toString());
      expect(getAllTooltipSeries()).toHaveLength(8); // Error bar is not counted as a series
      expect(getTooltipBody().getElement().textContent).toBe(
        `Area1\nArea spline2\nColumn3\nError bar4 - 5\nLine6\nScatter7\nSpline8\nX threshold\nY threshold9`,
      );
    },
  );

  test("renders all supported scatter marker types in tooltip details, x=$x", async () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "scatter", name: "Scatter 1", data: [{ x: 1, y: 1 }], marker: { symbol: "circle" } },
        { type: "scatter", name: "\nScatter 2", data: [{ x: 1, y: 2 }], marker: { symbol: "diamond" } },
        { type: "scatter", name: "\nScatter 3", data: [{ x: 1, y: 3 }], marker: { symbol: "square" } },
        { type: "scatter", name: "\nScatter 4", data: [{ x: 1, y: 4 }], marker: { symbol: "triangle" } },
        { type: "scatter", name: "\nScatter 5", data: [{ x: 1, y: 5 }], marker: { symbol: "triangle-down" } },
      ],
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
      expect(getTooltipHeader().getElement().textContent).toBe("1");
      expect(getAllTooltipSeries()).toHaveLength(5);
      expect(getTooltipBody().getElement().textContent).toBe(
        `Scatter 11\nScatter 22\nScatter 33\nScatter 44\nScatter 55`,
      );
    });
  });

  describe("Custom tooltip content", () => {
    const series: CartesianChartProps.SeriesOptions[] = [
      { type: "line", id: "l", name: "Line", data: [{ x: 1, y: 2 }] },
      { type: "errorbar", linkedTo: "l", name: "Error", data: [{ x: 1, low: 1, high: 4 }] },
      { type: "x-threshold", name: "Threshold", value: 1 },
    ];

    const onClickValue = vi.fn();
    const customKey = (item: CartesianChartProps.TooltipPointItem) => (
      <span>{`Custom name for ${item.series.name}`}</span>
    );
    const customValue = (item: CartesianChartProps.TooltipPointItem) => (
      <button onClick={() => onClickValue("root")}>{item.y ?? "T"}</button>
    );
    const customSubItems = (item: CartesianChartProps.TooltipPointItem) =>
      item.series.name === "Line"
        ? [
            {
              key: <span>sub-1 key</span>,
              value: <button onClick={() => onClickValue("sub-1")}>sub-1 value</button>,
            },
            {
              key: <span>sub-2 key</span>,
              value: <button onClick={() => onClickValue("sub-2")}>sub-2 value</button>,
            },
          ]
        : [];
    const customDescription = (item: CartesianChartProps.TooltipPointItem) =>
      item.errorRanges?.length ? `${item.errorRanges[0].low} - ${item.errorRanges[0].high}` : null;

    const openTooltip = async () => {
      act(() => hc.highlightChartPoint(0, 0));

      await waitFor(() => expect(getTooltip()).not.toBe(null));

      expect(getTooltipHeader().getElement().textContent).toBe("1");
      expect(getAllTooltipSeries()).toHaveLength(2);
    };

    const expectCustomSubItems = () => {
      expect(getTooltipSeries(0).find('[aria-expanded="false"]')).not.toBe(null);
      getTooltipSeries(0).find('[aria-expanded="false"]')!.click({ bubbles: false });
      expect(getTooltipSeries(0).findSubItems()).toHaveLength(2);
      expect(getTooltipSeries(0).findSubItems()[1].findKey().getElement().textContent).toBe("sub-2 key");
      expect(getTooltipSeries(0).findSubItems()[1].findValue().getElement().textContent).toBe("sub-2 value");
      getTooltipSeries(0).findSubItems()[1].findValue().find("button")!.click();
      expect(onClickValue).toHaveBeenCalledWith("sub-2");
      expect(getTooltipSeries(1).find('[aria-expanded="false"]')).toBe(null);
    };

    afterEach(() => {
      onClickValue.mockReset();
    });

    test("customizes key, value, sub-items and description", async () => {
      renderCartesianChart({
        highcharts,
        series,
        tooltip: {
          point({ item }) {
            return {
              key: customKey(item),
              value: customValue(item),
              expandable: item.series.name === "Line",
              subItems: customSubItems(item),
              description: customDescription(item),
            };
          },
        },
      });

      await openTooltip();

      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Custom name for Line");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");

      expectCustomSubItems();

      getTooltipSeries(0).findValue().find("button")!.click();
      expect(onClickValue).toHaveBeenCalledWith("root");

      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("1 - 4");

      expect(getTooltipSeries(1).findKey().getElement().textContent).toBe("Custom name for Threshold");
      expect(getTooltipSeries(1).findValue().getElement().textContent).toBe("T");
    });

    test("renders default key and value if not defined", async () => {
      renderCartesianChart({
        highcharts,
        series,
        tooltip: {
          point({ item }) {
            return {
              expandable: item.series.name === "Line",
              subItems: customSubItems(item),
              description: customDescription(item),
            };
          },
        },
      });

      await openTooltip();

      expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Line");
      expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");

      expectCustomSubItems();

      expect(getTooltipSeries(0).findDescription()!.getElement().textContent).toBe("1 - 4");

      expect(getTooltipSeries(1).findKey().getElement().textContent).toBe("Threshold");
      expect(getTooltipSeries(1).findValue().getElement().textContent).toBe(""); // X threshold has no y value
    });

    test("customizes tooltip slots", async () => {
      renderCartesianChart({
        highcharts,
        series: [
          { type: "line", id: "l", name: "Line", data: [{ x: 1, y: 2 }] },
          { type: "x-threshold", name: "Threshold", value: 1 },
          { type: "errorbar", name: "Error", data: [{ x: 1, low: 3, high: 4 }], linkedTo: "l" },
        ],
        tooltip: {
          header({ x, items }) {
            return (
              <span>
                header {x} {items.length} {items[0].series.name} {items[0].errorRanges![0].low}{" "}
                {items[0].errorRanges![0].high} {items[1].series.name}
              </span>
            );
          },
          body({ x, items }) {
            return (
              <span>
                body {x} {items.length} {items[0].series.name} {items[0].errorRanges![0].low}{" "}
                {items[0].errorRanges![0].high} {items[1].series.name}
              </span>
            );
          },
          footer({ x, items }) {
            return (
              <span>
                footer {x} {items.length} {items[0].series.name} {items[0].errorRanges![0].low}{" "}
                {items[0].errorRanges![0].high} {items[1].series.name}
              </span>
            );
          },
        },
      });

      act(() => hc.highlightChartPoint(0, 0));

      await waitFor(() => expect(getTooltip()).not.toBe(null));

      expect(getTooltipHeader().getElement().textContent).toBe("header 1 2 Line 3 4 Threshold");
      expect(getTooltipBody().getElement().textContent).toBe("body 1 2 Line 3 4 Threshold");
      expect(getTooltipFooter().getElement().textContent).toBe("footer 1 2 Line 3 4 Threshold");
    });
  });
});

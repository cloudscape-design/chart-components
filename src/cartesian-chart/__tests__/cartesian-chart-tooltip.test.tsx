// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/highcharts-more";
import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";
import { renderCartesianChart } from "./common";

const hc = new HighchartsTestHelper(highcharts);

const lineSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

const getChart = () => createWrapper().findChart("cartesian")!;
const getTooltip = () => getChart().findTooltip()!;
const getTooltipHeader = () => getChart().findTooltip()!.findHeader()!;
const getTooltipBody = () => getChart().findTooltip()!.findBody()!;
const getTooltipFooter = () => getChart().findTooltip()!.findFooter()!;
const getAllTooltipSeries = () => getChart().findTooltip()!.findSeries();
const getTooltipSeries = (index: number) => getAllTooltipSeries()[index];

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

    await waitFor(() => {
      expect(getTooltip()).toBe(null);
    });
  });

  test.each([{ x: 0.01 }, { x: 1 }, { x: 999 }])(
    "renders all supported series types in tooltip details, x=$x",
    async ({ x }) => {
      renderCartesianChart({
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
      });

      act(() => hc.highlightChartPoint(0, 0));

      await waitFor(() => {
        expect(getTooltip()).not.toBe(null);
        expect(getTooltipHeader().getElement().textContent).toBe(x === 0.01 ? "0.01" : x.toString());
        expect(getAllTooltipSeries()).toHaveLength(9);
        expect(getTooltipBody().getElement().textContent).toBe(
          `Area1\nArea spline2\nColumn3\nError bar4 : 5\nLine6\nScatter7\nSpline8\nX threshold\nY threshold9`,
        );
      });
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

  test("customizes series rendering", async () => {
    const onClickValue = vi.fn();
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", name: "Line", data: [{ x: 1, y: 2 }] },
        { type: "x-threshold", name: "Threshold", value: 1 },
        { type: "errorbar", name: "Error", data: [{ x: 1, low: 3, high: 4 }] },
      ],
      tooltip: {
        series({ item }) {
          const value = (() => {
            switch (item.type) {
              case "point":
                return item.y;
              case "range":
                return `${item.low}:${item.high}`;
              case "all":
                return "T";
            }
          })();
          return {
            key: <span>{item.series.name}</span>,
            value: <button onClick={() => onClickValue("root")}>{value}</button>,
            expandable: item.series.name === "Line",
            subItems:
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
                : [],
          };
        },
      },
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });

    expect(getTooltipHeader().getElement().textContent).toBe("1");
    expect(getAllTooltipSeries()).toHaveLength(3);

    expect(getTooltipSeries(0).findKey().getElement().textContent).toBe("Line");
    expect(getTooltipSeries(0).findValue().getElement().textContent).toBe("2");
    expect(getTooltipSeries(0).find('[aria-expanded="false"]')).not.toBe(null);

    getTooltipSeries(0).find('[aria-expanded="false"]')!.click();
    expect(getTooltipSeries(0).findSubItems()).toHaveLength(2);
    expect(getTooltipSeries(0).findSubItems()[1].findKey().getElement().textContent).toBe("sub-2 key");
    expect(getTooltipSeries(0).findSubItems()[1].findValue().getElement().textContent).toBe("sub-2 value");

    getTooltipSeries(0).findValue().find("button")!.click();
    expect(onClickValue).toHaveBeenCalledWith("root");

    getTooltipSeries(0).findSubItems()[1].findValue().find("button")!.click();
    expect(onClickValue).toHaveBeenCalledWith("sub-2");

    expect(getTooltipSeries(1).findKey().getElement().textContent).toBe("Error");
    expect(getTooltipSeries(1).findValue().getElement().textContent).toBe("3:4");
    expect(getTooltipSeries(1).find('[aria-expanded="false"]')).toBe(null);

    expect(getTooltipSeries(2).findKey().getElement().textContent).toBe("Threshold");
    expect(getTooltipSeries(2).findValue().getElement().textContent).toBe("T");
    expect(getTooltipSeries(2).find('[aria-expanded="false"]')).toBe(null);
  });

  test("customizes tooltip slots", async () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "line", name: "Line", data: [{ x: 1, y: 2 }] },
        { type: "x-threshold", name: "Threshold", value: 1 },
        { type: "errorbar", name: "Error", data: [{ x: 1, low: 3, high: 4 }] },
      ],
      tooltip: {
        header({ x, items }) {
          return (
            <span>
              header {x} {items.length} {items[0].series.name} {items[1].series.name} {items[2].series.name}
            </span>
          );
        },
        body({ x, items }) {
          return (
            <span>
              body {x} {items.length} {items[0].series.name} {items[1].series.name} {items[2].series.name}
            </span>
          );
        },
        footer({ x, items }) {
          return (
            <span>
              footer {x} {items.length} {items[0].series.name} {items[1].series.name} {items[2].series.name}
            </span>
          );
        },
      },
    });

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(getTooltip()).not.toBe(null);
    });

    expect(getTooltipHeader().getElement().textContent).toBe("header 1 3 Line Error Threshold");
    expect(getTooltipBody().getElement().textContent).toBe("body 1 3 Line Error Threshold");
    expect(getTooltipFooter().getElement().textContent).toBe("footer 1 3 Line Error Threshold");
  });
});

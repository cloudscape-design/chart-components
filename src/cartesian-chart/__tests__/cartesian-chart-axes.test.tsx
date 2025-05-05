// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import highcharts from "highcharts";
import { vi } from "vitest";

import { CartesianChartProps } from "../../../lib/components/cartesian-chart";
import testClasses from "../../../lib/components/cartesian-chart/test-classes/styles.selectors";
import { InternalCoreChart } from "../../../lib/components/core/chart-core";
import { getDataAttributes } from "../../internal/base-component/get-data-attributes";
import { renderCartesianChart } from "./common";

vi.mock("../../../lib/components/core/chart-core", () => ({
  InternalCoreChart: vi.fn((props) => <div {...getDataAttributes(props)}></div>),
}));

const series: CartesianChartProps.SeriesOptions[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

function getXAxisOptionsFormatter() {
  const options = vi.mocked(InternalCoreChart).mock.calls[0][0].options;
  return (options.xAxis as Highcharts.XAxisOptions[])[0].labels!.formatter!;
}
function getYAxisOptionsFormatter() {
  const options = vi.mocked(InternalCoreChart).mock.calls[0][0].options;
  return (options.yAxis as Highcharts.YAxisOptions[])[0].labels!.formatter!;
}
function getAxisOptionsFormatters() {
  return [getXAxisOptionsFormatter(), getYAxisOptionsFormatter()];
}
function mockAxisContext({
  value,
  xExtremes,
  yExtremes,
}: {
  value: number;
  xExtremes?: [number, number];
  yExtremes?: [number, number];
}) {
  return {
    value,
    chart: {
      xAxis: [{ getExtremes: () => ({ dataMin: xExtremes?.[0] ?? 0, dataMax: xExtremes?.[1] ?? 0 }) }],
      yAxis: [{ getExtremes: () => ({ dataMin: yExtremes?.[0] ?? 0, dataMax: yExtremes?.[1] ?? 0 }) }],
    },
  } as unknown as Highcharts.AxisLabelsFormatterContextObject;
}

describe("CartesianChart: axes", () => {
  afterEach(() => {
    vi.mocked(InternalCoreChart).mockRestore();
  });

  test("renders axes by default", () => {
    renderCartesianChart({ highcharts, series });
    expect(InternalCoreChart).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: [
            {
              labels: {
                formatter: expect.any(Function),
              },
              plotLines: [],
              title: { text: undefined },
            },
          ],
          yAxis: [
            {
              labels: {
                formatter: expect.any(Function),
              },
              plotLines: [expect.objectContaining({ className: testClasses["emphasized-baseline"] })],
              title: { text: undefined },
            },
          ],
        }),
      }),
      expect.anything(),
    );
  });

  test("propagates axes labels and hides emphasized baseline on demand", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { title: "X axis" },
      yAxis: { title: "Y axis" },
      emphasizeBaselineAxis: false,
    });
    expect(InternalCoreChart).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: [
            {
              labels: {
                formatter: expect.any(Function),
              },
              plotLines: [],
              title: { text: "X axis" },
            },
          ],
          yAxis: [
            {
              labels: {
                formatter: expect.any(Function),
              },
              plotLines: [],
              title: { text: "Y axis" },
            },
          ],
        }),
      }),
      expect.anything(),
    );
  });

  test("propagates axes settings", () => {
    const xAxis: CartesianChartProps["xAxis"] = {
      min: 0,
      max: 1,
      type: "category",
      categories: ["a", "b", "c"],
      tickInterval: 0.1,
    };
    const yAxis: CartesianChartProps["yAxis"] = {
      min: 0,
      max: 1,
      type: "logarithmic",
      categories: ["c", "d"],
      tickInterval: 0.2,
      reversedStacks: true,
    };
    renderCartesianChart({ highcharts, series, xAxis, yAxis });
    expect(InternalCoreChart).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: [expect.objectContaining(xAxis)],
          yAxis: [expect.objectContaining(yAxis)],
        }),
      }),
      expect.anything(),
    );
  });

  test("uses default numeric axes formatters", () => {
    renderCartesianChart({ highcharts, series });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 1 }))).toBe("1.00");
    });
  });

  test.each([3, 2, 1, 0])("uses default numeric axes formatters with valueDecimals=%s", (valueDecimals) => {
    renderCartesianChart({ highcharts, series, xAxis: { valueDecimals }, yAxis: { valueDecimals } });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 2 }))).toBe(Number(2).toFixed(valueDecimals));
    });
  });

  test("uses default category axes formatters", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { type: "category", categories: ["a", "b"] },
      yAxis: { type: "category", categories: ["a", "b"] },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: -1 }))).toBe("-1");
      expect(formatter.call(mockAxisContext({ value: 0 }))).toBe("a");
      expect(formatter.call(mockAxisContext({ value: 1 }))).toBe("b");
      expect(formatter.call(mockAxisContext({ value: 2 }))).toBe("2");
    });
  });

  test("uses default datetime axes formatters", () => {
    renderCartesianChart({ highcharts, series, xAxis: { type: "datetime" }, yAxis: { type: "datetime" } });
    getAxisOptionsFormatters().forEach((formatter) => {
      // Year
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2020-01-01").getTime(),
            xExtremes: [new Date("2018-01-01").getTime(), new Date("2023-01-01").getTime()],
            yExtremes: [new Date("2018-01-01").getTime(), new Date("2023-01-01").getTime()],
          }),
        ),
      ).toBe("2020");
      // Month
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2020-01-01").getTime(),
            xExtremes: [new Date("2019-01-01").getTime(), new Date("2023-01-01").getTime()],
            yExtremes: [new Date("2019-01-01").getTime(), new Date("2023-01-01").getTime()],
          }),
        ),
      ).toBe("Jan 2020");
      // Day
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2023-02-01").getTime(),
            xExtremes: [new Date("2023-01-01").getTime(), new Date("2023-03-01").getTime()],
            yExtremes: [new Date("2023-01-01").getTime(), new Date("2023-03-01").getTime()],
          }),
        ),
      ).toBe("Feb 1");
      // Hour
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2023-01-02").getTime(),
            xExtremes: [new Date("2023-01-01").getTime(), new Date("2023-01-04").getTime()],
            yExtremes: [new Date("2023-01-01").getTime(), new Date("2023-01-04").getTime()],
          }),
        ),
      ).toBe("Jan 2, 1 AM");
      // Minute
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2023-01-01T14:00:00").getTime(),
            xExtremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T16:00:00").getTime()],
            yExtremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T16:00:00").getTime()],
          }),
        ),
      ).toBe("1/1/2023, 2:00 PM");
      // Second
      expect(
        formatter.call(
          mockAxisContext({
            value: new Date("2023-01-01T12:30:00").getTime(),
            xExtremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T14:00:00").getTime()],
            yExtremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T14:00:00").getTime()],
          }),
        ),
      ).toBe("1/1/2023, 12:30:00 PM");
    });
  });

  test("uses custom numeric axes formatters", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { valueFormatter: (value) => value.toFixed(1) + "$" },
      yAxis: { valueFormatter: (value) => value.toFixed(1) + "$" },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 100 }))).toBe("100.0$");
    });
  });

  test("uses custom category axes formatters", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { type: "category", valueFormatter: (value) => ["a", "b"][value].toUpperCase() },
      yAxis: { type: "category", valueFormatter: (value) => ["a", "b"][value].toUpperCase() },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 0 }))).toBe("A");
      expect(formatter.call(mockAxisContext({ value: 1 }))).toBe("B");
    });
  });

  test("uses custom datetime axes formatters", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { type: "datetime", valueFormatter: (value) => new Date(value).getFullYear().toString() },
      yAxis: { type: "datetime", valueFormatter: (value) => new Date(value).getFullYear().toString() },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: new Date("2020-01-03").getTime() }))).toBe("2020");
    });
  });

  test("replaces \n with <br />", () => {
    renderCartesianChart({
      highcharts,
      series,
      xAxis: { valueFormatter: (value) => `${value}\nunits` },
      yAxis: { valueFormatter: (value) => `${value}\nunits` },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 100 }))).toBe("100<br />units");
    });
  });
});

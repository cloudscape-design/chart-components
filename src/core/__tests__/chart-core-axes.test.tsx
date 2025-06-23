// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { vi } from "vitest";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { objectContainingDeep, renderChart } from "./common";

vi.mock("highcharts-react-official", () => ({ __esModule: true, default: vi.fn(() => null) }));

const series: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "Line 1", data: [1, 2, 3] },
  { type: "line", name: "Line 2", data: [4, 5, 6] },
  { type: "line", name: "Line 3", data: [7, 8, 9] },
];

function getXAxisOptionsFormatter() {
  const options = vi.mocked(HighchartsReact).mock.calls[0][0].options;
  return (options.xAxis as Highcharts.XAxisOptions[])[0].labels!.formatter!;
}
function getYAxisOptionsFormatter() {
  const options = vi.mocked(HighchartsReact).mock.calls[0][0].options;
  return (options.yAxis as Highcharts.YAxisOptions[])[0].labels!.formatter!;
}
function getAxisOptionsFormatters() {
  return [getXAxisOptionsFormatter(), getYAxisOptionsFormatter()];
}
function mockAxisContext({
  value,
  type,
  extremes,
  categories,
  valueFormatter,
}: {
  value: number;
  type?: "datetime" | "category";
  extremes?: [number, number];
  categories?: string[];
  valueFormatter?: (value: null | number) => void;
}) {
  return {
    value,
    axis: {
      categories,
      options: { type },
      userOptions: { valueFormatter },
      getExtremes: () => ({ dataMin: extremes?.[0] ?? 0, dataMax: extremes?.[1] ?? 0 }),
    },
  } as unknown as Highcharts.AxisLabelsFormatterContextObject;
}
function optionsContaining({
  xTitle,
  yTitle,
  emphasizeBaseline,
}: {
  xTitle?: string;
  yTitle?: string;
  emphasizeBaseline?: boolean;
}) {
  return objectContainingDeep({
    options: {
      xAxis: [{ title: { text: xTitle } }],
      yAxis: [
        {
          title: { text: yTitle },
          ...(emphasizeBaseline ? { plotLines: [{ className: testClasses["emphasized-baseline"] }] } : {}),
        },
      ],
    },
  });
}

describe("CoreChart: axes", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test.each([{ emphasizeBaseline: false }, { emphasizeBaseline: true }])(
    "renders no axes by default, emphasizeBaseline=$emphasizeBaseline",
    ({ emphasizeBaseline }) => {
      renderChart({ highcharts, options: { series }, emphasizeBaseline });
      expect(HighchartsReact).toHaveBeenCalledWith(
        objectContainingDeep({ options: { xAxis: undefined, yAxis: undefined } }),
        expect.anything(),
      );
    },
  );

  test.each([{ emphasizeBaseline: false }, { emphasizeBaseline: true }])(
    "renders axes with titles, emphasizeBaseline=$emphasizeBaseline",
    ({ emphasizeBaseline }) => {
      renderChart({
        highcharts,
        options: { series, xAxis: { title: { text: "X" } }, yAxis: { title: { text: "Y" } } },
        emphasizeBaseline,
      });
      expect(HighchartsReact).toHaveBeenCalledWith(
        optionsContaining({ xTitle: "X", yTitle: "Y", emphasizeBaseline }),
        expect.anything(),
      );
    },
  );

  test("renders axes with no titles", () => {
    renderChart({
      highcharts,
      options: { series, xAxis: { title: { text: undefined } }, yAxis: { title: { text: undefined } } },
    });
    expect(HighchartsReact).toHaveBeenCalledWith(
      optionsContaining({ xTitle: undefined, yTitle: undefined }),
      expect.anything(),
    );
  });

  test("renders axes as arrays", () => {
    renderChart({
      highcharts,
      options: { series, xAxis: [{ title: { text: "X" } }], yAxis: [{ title: { text: "Y" } }] },
    });
    expect(HighchartsReact).toHaveBeenCalledWith(optionsContaining({ xTitle: "X", yTitle: "Y" }), expect.anything());
  });

  test("uses default numeric axes formatters for integer values", () => {
    renderChart({ highcharts, options: { series, xAxis: { title: { text: "X" } }, yAxis: { title: { text: "Y" } } } });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 1 }))).toBe("1");
      expect(formatter.call(mockAxisContext({ value: 1_000 }))).toBe("1K");
      expect(formatter.call(mockAxisContext({ value: 1_000_000 }))).toBe("1M");
      expect(formatter.call(mockAxisContext({ value: 1_000_000_000 }))).toBe("1G");
    });
  });

  test("uses default numeric axes formatters for float values", () => {
    renderChart({ highcharts, options: { series, xAxis: { title: { text: "X" } }, yAxis: { title: { text: "Y" } } } });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 2.0 }))).toBe("2");
      expect(formatter.call(mockAxisContext({ value: 2.03 }))).toBe("2.03");
    });
  });

  test.each([undefined, ["a", "b"]])("uses default category axes formatters, categories=%s", (categories) => {
    renderChart({
      highcharts,
      options: {
        series,
        xAxis: { type: "category", title: { text: "X" } },
        yAxis: { type: "category", title: { text: "Y" } },
      },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ type: "category", categories, value: -1 }))).toBe("-1");
      expect(formatter.call(mockAxisContext({ type: "category", categories, value: 0 }))).toBe(categories ? "a" : "0");
      expect(formatter.call(mockAxisContext({ type: "category", categories, value: 1 }))).toBe(categories ? "b" : "1");
      expect(formatter.call(mockAxisContext({ type: "category", categories, value: 2 }))).toBe("2");
    });
  });

  test("uses default datetime axes formatters", () => {
    renderChart({
      highcharts,
      options: {
        series,
        xAxis: { type: "datetime", title: { text: "X" } },
        yAxis: { type: "datetime", title: { text: "Y" } },
      },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      // Year
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2018-01-01").getTime(), new Date("2023-01-01").getTime()],
            value: new Date("2020-01-01").getTime(),
          }),
        ),
      ).toBe("2020");
      // Month
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2019-01-01").getTime(), new Date("2023-01-01").getTime()],
            value: new Date("2020-01-01").getTime(),
          }),
        ),
      ).toBe("Jan 2020");
      // Day
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2023-01-01").getTime(), new Date("2023-03-01").getTime()],
            value: new Date("2023-02-01").getTime(),
          }),
        ),
      ).toBe("Feb 1");
      // Hour
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2023-01-01").getTime(), new Date("2023-01-04").getTime()],
            value: new Date("2023-01-02").getTime(),
          }),
        ),
      ).toBe("Jan 2, 1 AM");
      // Minute
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T16:00:00").getTime()],
            value: new Date("2023-01-01T14:00:00").getTime(),
          }),
        ),
      ).toBe("1/1/2023, 2:00 PM");
      // Second
      expect(
        formatter.call(
          mockAxisContext({
            type: "datetime",
            extremes: [new Date("2023-01-01T12:00:00").getTime(), new Date("2023-01-01T14:00:00").getTime()],
            value: new Date("2023-01-01T12:30:00").getTime(),
          }),
        ),
      ).toBe("1/1/2023, 12:30:00 PM");
    });
  });

  test("uses custom numeric axes formatters", () => {
    const valueFormatter = (value: null | number) => value!.toFixed(1) + "$";
    renderChart({
      highcharts,
      options: {
        series,
        xAxis: { title: { text: "X" } },
        yAxis: { title: { text: "Y" } },
      },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ value: 100, valueFormatter }))).toBe("100.0$");
    });
  });

  test("does not call custom formatter on categorical values", () => {
    const valueFormatter = vi.fn();
    renderChart({
      highcharts,
      options: {
        series,
        xAxis: { type: "category", categories: ["A", "B", "C"], title: { text: "X" }, valueFormatter },
        yAxis: { type: "category", categories: ["A", "B", "C"], title: { text: "Y" }, valueFormatter },
      },
    });
    expect(valueFormatter).not.toHaveBeenCalled();
  });

  test("uses custom datetime axes formatters", () => {
    const valueFormatter = (value: null | number) => new Date(value!).getFullYear().toString();
    renderChart({
      highcharts,
      options: {
        series,
        xAxis: { type: "datetime", title: { text: "X" } },
        yAxis: { type: "datetime", title: { text: "Y" } },
      },
    });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(
        formatter.call(mockAxisContext({ type: "datetime", valueFormatter, value: new Date("2020-01-03").getTime() })),
      ).toBe("2020");
    });
  });

  test("replaces \n with <br />", () => {
    const valueFormatter = (value: null | number) => `${value!}\nunits`;
    renderChart({ highcharts, options: { series, xAxis: { title: { text: "X" } }, yAxis: { title: { text: "Y" } } } });
    getAxisOptionsFormatters().forEach((formatter) => {
      expect(formatter.call(mockAxisContext({ valueFormatter, value: 100 }))).toBe("100<br />units");
    });
  });
});

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { vi } from "vitest";

import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { objectContainingDeep, renderChart } from "./common";
import { ChartRendererStub } from "./highcharts-utils";

vi.mock("highcharts-react-official", () => ({ __esModule: true, default: vi.fn(() => null) }));

const rendererStub = new ChartRendererStub();
const chartStub = {
  series: [],
  legend: { allItems: [] },
  options: {},
  renderer: rendererStub,
  container: document.createElement("div"),
};
const pointStub = { series: { chart: chartStub } };

// These tests ensure the Highcharts options can be passed down to the underlying Highcharts component,
// overriding the Cloudscape defaults.
describe("CoreChart: options", () => {
  afterEach(() => {
    vi.mocked(HighchartsReact).mockRestore();
  });

  test("propagates highcharts classname", () => {
    renderChart({ highcharts, options: { chart: { className: "custom-class" } } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({ options: { chart: { className: expect.stringContaining("custom-class") } } }),
      expect.anything(),
    );
  });

  test("propagates highcharts colors", () => {
    const colors = ["black", "red", "gold"];
    renderChart({ highcharts, options: { colors } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { colors } }), expect.anything());
  });

  test("propagates highcharts credits", () => {
    const credits = { enabled: true, text: "credits-text", custom: "custom" };
    renderChart({ highcharts, options: { credits } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { credits } }), expect.anything());
  });

  test("propagates highcharts title", () => {
    const title = { text: "title-text", custom: "custom" };
    renderChart({ highcharts, options: { title } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { title } }), expect.anything());
  });

  test("propagates highcharts noData", () => {
    const noData = { position: { align: "right" }, useHTML: false, custom: "custom" } as const;
    renderChart({ highcharts, options: { noData } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { noData } }), expect.anything());
  });

  test("propagates highcharts lang", () => {
    const lang = { noData: "nodata", custom: "custom", accessibility: { defaultChartTitle: "X" } } as const;
    renderChart({ highcharts, options: { lang } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { lang } }), expect.anything());
  });

  test("propagates highcharts accessibility", () => {
    const accessibility = {
      screenReaderSection: { beforeChartFormat: "format", custom: "custom" },
      keyboardNavigation: { focusBorder: { style: { color: "border-color" } }, custom: "custom" },
      custom: "custom",
    } as const;
    renderChart({ highcharts, options: { accessibility } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({ options: { accessibility } }),
      expect.anything(),
    );
  });

  test("propagates highcharts legend", () => {
    renderChart({ highcharts, options: { legend: { enabled: true, align: "right" } } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({ options: { legend: { enabled: true, align: "right" } } }),
      expect.anything(),
    );
  });

  test("propagates highcharts tooltip", () => {
    renderChart({ highcharts, options: { tooltip: { enabled: true, stickOnContact: true } } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({ options: { tooltip: { enabled: true, stickOnContact: true } } }),
      expect.anything(),
    );
  });

  test("propagates axes", () => {
    const createAxis = (text: string) =>
      ({
        lineWidth: 99,
        title: { style: { color: "axis-color" }, text },
        labels: { style: { color: "label-color" } },
        custom: "custom",
      }) as const;
    const xAxis1 = createAxis("x-axis-1");
    const xAxis2 = createAxis("x-axis-2");
    const yAxis1 = createAxis("y-axis-1");
    const yAxis2 = createAxis("y-axis-2");

    renderChart({ highcharts, options: { xAxis: xAxis1, yAxis: yAxis1 } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({
        options: {
          xAxis: expect.arrayContaining([objectContainingDeep(xAxis1)]),
          yAxis: expect.arrayContaining([objectContainingDeep(yAxis1)]),
        },
      }),
      expect.anything(),
    );

    renderChart({ highcharts, options: { xAxis: [xAxis1, xAxis2], yAxis: [yAxis1, yAxis2] } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({
        options: {
          xAxis: expect.arrayContaining([objectContainingDeep(xAxis1), objectContainingDeep(xAxis2)]),
          yAxis: expect.arrayContaining([objectContainingDeep(yAxis1), objectContainingDeep(yAxis2)]),
        },
      }),
      expect.anything(),
    );
  });

  test("propagates plotOptions.series", () => {
    const plotOptions = {
      custom: "custom",
      series: {
        borderColor: "series-border-color",
        dataLabels: { style: { color: "data-labels-color" } },
        states: { inactive: { opacity: 0.999 } },
        custom: {},
      },
    } as const;

    renderChart({ highcharts, options: { plotOptions } });

    expect(HighchartsReact).toHaveBeenCalledWith(objectContainingDeep({ options: { plotOptions } }), expect.anything());
  });

  test.each([0, 1])("propagates plotOptions.series.point, inputs=%s", (index) => {
    const mouseOver = vi.fn();
    const mouseOverEvent = {};
    const mouseOut = vi.fn();
    const mouseOutEvent = {};
    const click = vi.fn();
    const clickEvent = {};
    const remove = () => {};
    const options: Highcharts.Options = {
      plotOptions: {
        series: {
          point: {
            events: { mouseOut, mouseOver, click, remove },
          },
        },
      },
    };
    const inputs: (CoreChartProps & { highcharts: typeof Highcharts })[] = [
      { highcharts, options, tooltip: { enabled: false } },
      { highcharts, options },
    ];
    renderChart(inputs[index]);

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({
        options: {
          plotOptions: {
            series: {
              point: {
                events: { remove },
              },
            },
          },
        },
      }),
      expect.anything(),
    );

    const mockCall = vi.mocked(HighchartsReact).mock.calls[0][0];
    mockCall.options.chart.events.render.call(chartStub);

    mockCall.options.plotOptions.series.point.events.mouseOver.call(pointStub, mouseOverEvent);
    expect(mouseOver).toHaveBeenCalledWith(mouseOverEvent);

    mockCall.options.plotOptions.series.point.events.mouseOut.call(null, mouseOutEvent);
    expect(mouseOut).toHaveBeenCalledWith(mouseOutEvent);

    mockCall.options.plotOptions.series.point.events.click.call(null, clickEvent);
    expect(click).toHaveBeenCalledWith(clickEvent);
  });

  test.each([0, 1, 2])("propagates highcharts chart options, inputs=%s", (index) => {
    const loadEvent = {};
    const load = vi.fn();
    const renderEvent = {};
    const render = vi.fn();
    const clickEvent = {};
    const click = vi.fn();
    const redraw = () => {};
    const options: Highcharts.Options = {
      chart: {
        inverted: true,
        displayErrors: true,
        style: { color: "chart-color" },
        backgroundColor: "chart-background-color",
        events: { load, render, click, redraw },
      },
    };
    const inputs: (CoreChartProps & { highcharts: typeof Highcharts })[] = [
      { highcharts, options, tooltip: { enabled: false } },
      { highcharts, options, tooltip: { enabled: false }, noData: { statusType: "error" } },
      { highcharts, options },
    ];
    renderChart(inputs[index]);

    expect(HighchartsReact).toHaveBeenCalledWith(
      objectContainingDeep({ options: { chart: { ...options.chart, events: { redraw } } } }),
      expect.anything(),
    );

    const mockCall = vi.mocked(HighchartsReact).mock.calls[0][0];
    mockCall.options.chart.events.render.call(chartStub);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.load.call(chartStub, loadEvent);
    expect(load).toHaveBeenCalledWith(loadEvent);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.render.call(chartStub, renderEvent);
    expect(render).toHaveBeenCalledWith(renderEvent);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.click.call(chartStub, clickEvent);
    expect(click).toHaveBeenCalledWith(clickEvent);
  });
});

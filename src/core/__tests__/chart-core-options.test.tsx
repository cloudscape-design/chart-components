// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { omit } from "lodash";
import { vi } from "vitest";

import { CoreChartProps } from "../../../lib/components/core/interfaces-core";
import { renderChart } from "./common";

vi.mock("highcharts-react-official", () => ({ __esModule: true, default: vi.fn(() => null) }));

// These tests ensure the Highcharts options can be passed down to the underlying Highcharts component,
// overriding the Cloudscape defaults.
describe("CoreChart: options", () => {
  afterEach(() => {
    vi.mocked(HighchartsReact).mockRestore();
  });

  test("propagates highcharts colors", () => {
    const colors = ["black", "red", "gold"];
    renderChart({ highcharts, options: { colors } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ colors }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts credits", () => {
    const credits = { enabled: true, text: "credits-text", custom: "custom" };
    renderChart({ highcharts, options: { credits } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ credits }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts title", () => {
    const title = { text: "title-text", custom: "custom" };
    renderChart({ highcharts, options: { title } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts noData", () => {
    const noData = { position: { align: "right" }, useHTML: false, custom: "custom" } as const;
    renderChart({ highcharts, options: { noData } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ noData }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts lang", () => {
    const lang = { noData: "nodata", custom: "custom" } as const;
    renderChart({ highcharts, options: { lang } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ lang }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts accessibility", () => {
    const accessibility = {
      keyboardNavigation: { focusBorder: { style: { color: "border-color" } }, custom: "custom" },
      custom: "custom",
    } as const;
    renderChart({ highcharts, options: { accessibility } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ accessibility }),
      }),
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
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: expect.arrayContaining([
            expect.objectContaining({ ...xAxis1, title: expect.objectContaining(xAxis1.title) }),
          ]),
          yAxis: expect.arrayContaining([
            expect.objectContaining({ ...yAxis1, title: expect.objectContaining(yAxis1.title) }),
          ]),
        }),
      }),
      expect.anything(),
    );

    renderChart({ highcharts, options: { xAxis: [xAxis1, xAxis2], yAxis: [yAxis1, yAxis2] } });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: expect.arrayContaining([
            expect.objectContaining({ ...xAxis1, title: expect.objectContaining(xAxis1.title) }),
            expect.objectContaining({ ...xAxis2, title: expect.objectContaining(xAxis2.title) }),
          ]),
          yAxis: expect.arrayContaining([
            expect.objectContaining({ ...yAxis1, title: expect.objectContaining(yAxis1.title) }),
            expect.objectContaining({ ...yAxis2, title: expect.objectContaining(yAxis2.title) }),
          ]),
        }),
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

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          plotOptions: expect.objectContaining({
            custom: "custom",
            series: expect.objectContaining(plotOptions.series),
          }),
        }),
      }),
      expect.anything(),
    );
  });

  test.each([0, 1])("propagates plotOptions.series.point, inputs=%s", (index) => {
    const chartStub = { series: [], legend: { allItems: [] } };
    const mouseOverEvent = {};
    const mouseOver = vi.fn();
    const mouseOutEvent = {};
    const mouseOut = vi.fn();
    const clickEvent = {};
    const click = vi.fn();
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
    const inputs: CoreChartProps[] = [
      { highcharts, options },
      { highcharts, options, tooltip: { getContent: () => ({ header: "", body: "" }) } },
    ];
    renderChart(inputs[index]);

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          plotOptions: expect.objectContaining({
            series: expect.objectContaining({
              point: {
                events: expect.objectContaining({ remove }),
              },
            }),
          }),
        }),
      }),
      expect.anything(),
    );

    const mockCall = vi.mocked(HighchartsReact).mock.calls[0][0];
    mockCall.callback(chartStub);

    mockCall.options.plotOptions.series.point.events.mouseOver.call(null, mouseOverEvent);
    expect(mouseOver).toHaveBeenCalledWith(mouseOverEvent);

    mockCall.options.plotOptions.series.point.events.mouseOut.call(null, mouseOutEvent);
    expect(mouseOut).toHaveBeenCalledWith(mouseOutEvent);

    mockCall.options.plotOptions.series.point.events.click.call(null, clickEvent);
    expect(click).toHaveBeenCalledWith(clickEvent);
  });

  test.each([0, 1, 2])("propagates highcharts chart options, inputs=%s", (index) => {
    const chartStub = { series: [], legend: { allItems: [] } };
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
    const inputs: CoreChartProps[] = [
      { highcharts, options },
      { highcharts, options, noData: { statusType: "error" } },
      { highcharts, options, tooltip: { getContent: () => ({ header: "", body: "" }) } },
    ];
    renderChart(inputs[index]);

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          chart: expect.objectContaining({
            ...options.chart,
            events: expect.objectContaining({
              redraw,
            }),
          }),
        }),
      }),
      expect.anything(),
    );

    vi.mocked(HighchartsReact).mock.calls[0][0].callback(chartStub);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.load.call(chartStub, loadEvent);
    expect(load).toHaveBeenCalledWith(loadEvent);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.render.call(chartStub, renderEvent);
    expect(render).toHaveBeenCalledWith(renderEvent);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.click.call(chartStub, clickEvent);
    expect(click).toHaveBeenCalledWith(clickEvent);
  });

  test("propagates highcharts legend options", () => {
    const itemClickEvent = {};
    const labelFormatter = () => "";
    const itemClick = vi.fn();
    const options: Highcharts.Options = {
      legend: {
        labelFormatter,
        title: { style: { color: "title-color" }, text: "title-text" },
        itemStyle: { color: "item-color" },
        backgroundColor: "legend-background-color",
        symbolPadding: 99,
        events: { itemClick },
      },
    };
    renderChart({ highcharts, options });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          legend: expect.objectContaining(omit(options.legend, "events")),
        }),
      }),
      expect.anything(),
    );

    vi.mocked(HighchartsReact).mock.calls[0][0].options.legend.events.itemClick(itemClickEvent);
    expect(itemClick).toHaveBeenCalledWith(itemClickEvent);
  });
});

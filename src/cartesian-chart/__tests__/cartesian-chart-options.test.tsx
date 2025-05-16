// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { vi } from "vitest";

import {
  InternalCartesianChart,
  InternalCartesianChartProps,
} from "../../../lib/components/cartesian-chart/chart-cartesian-internal";
import { InternalCartesianChartOptions } from "../../../lib/components/cartesian-chart/interfaces-cartesian";
import { ChartRendererStub } from "../../core/__tests__/highcharts-utils";

vi.mock("highcharts-react-official", () => ({ __esModule: true, default: vi.fn(() => null) }));

const rendererStub = new ChartRendererStub();
const chartStub = {
  series: [],
  legend: { allItems: [] },
  options: {},
  renderer: rendererStub,
  container: document.createElement("div"),
};

function renderInternalCartesianChart(props: Omit<InternalCartesianChartProps, "highcharts">) {
  render(<InternalCartesianChart highcharts={Highcharts} {...props} />);

  const mockCall = vi.mocked(HighchartsReact).mock.calls[0][0];
  mockCall.options.chart.events.render.call(chartStub);
}

// These tests ensure the Highcharts options can be passed down to the underlying Highcharts component,
// overriding the Cloudscape defaults.
describe("CartesianChart: options", () => {
  afterEach(() => {
    vi.mocked(HighchartsReact).mockRestore();
  });

  test("handles minimal configuration", () => {
    renderInternalCartesianChart({ options: { series: [], xAxis: [], yAxis: [] } });

    expect(HighchartsReact).toHaveBeenCalled();
  });

  test("propagates highcharts chart options", () => {
    const options: InternalCartesianChartOptions = {
      chart: {
        inverted: true,
        displayErrors: true,
        style: { color: "chart-color" },
        backgroundColor: "chart-background-color",
      },
      series: [],
      xAxis: [],
      yAxis: [],
    };
    renderInternalCartesianChart({ options });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          chart: expect.objectContaining(options.chart),
        }),
      }),
      expect.anything(),
    );
  });

  test("propagates highcharts chart events", () => {
    const renderEvent = {};
    const render = vi.fn();
    const clickEvent = {};
    const click = vi.fn();
    renderInternalCartesianChart({
      options: {
        chart: { events: { render, click } },
        series: [],
        xAxis: [],
        yAxis: [],
      },
    });

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.render.call(chartStub, renderEvent);
    expect(render).toHaveBeenCalledWith(renderEvent);

    vi.mocked(HighchartsReact).mock.calls[0][0].options.chart.events.click.call(chartStub, clickEvent);
    expect(click).toHaveBeenCalledWith(clickEvent);
  });

  test("propagates highcharts axes options", () => {
    renderInternalCartesianChart({
      options: {
        series: [],
        xAxis: [{ zoomEnabled: true, plotLines: [{ id: "x-line" }] }],
        yAxis: [{ zoomEnabled: true, plotLines: [{ id: "y-line" }] }],
      },
    });

    expect(HighchartsReact).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          xAxis: expect.arrayContaining([
            expect.objectContaining({
              zoomEnabled: true,
              plotLines: expect.arrayContaining([expect.objectContaining({ id: "x-line" })]),
            }),
          ]),
          yAxis: expect.arrayContaining([
            expect.objectContaining({
              zoomEnabled: true,
              plotLines: expect.arrayContaining([expect.objectContaining({ id: "y-line" })]),
            }),
          ]),
        }),
      }),
      expect.anything(),
    );
  });
});

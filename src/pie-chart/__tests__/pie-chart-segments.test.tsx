// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";
import { renderPieChart } from "./common";

const getChart = () => createWrapper().findPieHighcharts()!;

describe("PieChart: segments", () => {
  const commonSeries: PieChartProps.SeriesOptions = {
    name: "Pie",
    type: "pie",
    data: [
      { id: "1", name: "P1", y: 10 },
      { id: "2", name: "P2", y: 20 },
      { id: "3", name: "P3", y: 70 },
      { id: "4", name: "P4", y: 0 },
      { id: "5", name: "P5", y: null },
    ],
  };

  test("renders given number of segments", () => {
    renderPieChart({
      highcharts,
      series: commonSeries,
    });

    expect(getChart().findSegments()).toHaveLength(4);
  });

  test("renders segment descriptions", () => {
    renderPieChart({
      highcharts,
      series: commonSeries,
      segmentDescription: () => "Custom description",
    });
    expect(getChart().getElement().textContent).toContain("Custom description");
  });

  test("renders custom segment titles", () => {
    renderPieChart({
      highcharts,
      series: commonSeries,
      segmentTitle: () => "Custom title",
    });

    expect(getChart().getElement().textContent).toContain("Custom title");
  });

  test("renders segment titles and descriptions containing markup characters as text", () => {
    renderPieChart({
      highcharts,
      series: commonSeries,
      segmentTitle: () => `<b>R&D</b> "quoted"`,
      segmentDescription: () => `it's < 5 & > 1`,
    });

    const text = getChart().getElement().textContent;
    expect(text).toContain(`<b>R&D</b> "quoted"`);
    expect(text).toContain(`it's < 5 & > 1`);
    expect(getChart().getElement().querySelector("b")).toBeNull();
  });

  test("renders no titles if set to null", () => {
    renderPieChart({
      highcharts,
      series: commonSeries,
      segmentTitle: () => "",
      segmentDescription: () => "Custom description",
    });

    expect(getChart().getElement().textContent).not.toContain("Pie");
    expect(getChart().getElement().textContent).not.toContain("Custom title");
  });
});

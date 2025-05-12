// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import "highcharts/highcharts-more";
import createWrapper from "../../../lib/components/test-utils/dom";
import { renderCartesianChart } from "./common";

const getChart = () => createWrapper().findChart("cartesian")!;

describe("CartesianChart: series", () => {
  test("renders all supported series types", () => {
    renderCartesianChart({
      highcharts,
      series: [
        { type: "area", name: "Area", data: [{ x: 1, y: 1 }] },
        { type: "areaspline", name: "\nArea spline", data: [{ x: 1, y: 2 }] },
        { type: "column", name: "\nColumn", data: [{ x: 1, y: 3 }] },
        { type: "errorbar", name: "\nError bar", data: [{ x: 1, low: 4, high: 5 }] },
        { type: "line", name: "\nLine", data: [{ x: 1, y: 6 }] },
        { type: "scatter", name: "\nScatter", data: [{ x: 1, y: 7 }] },
        { type: "spline", name: "\nSpline", data: [{ x: 1, y: 8 }] },
        { type: "x-threshold", name: "\nX threshold", value: 1 },
        { type: "y-threshold", name: "\nY threshold", value: 9 },
      ],
    });

    expect(getChart().findSeries()).toHaveLength(9);
  });
});

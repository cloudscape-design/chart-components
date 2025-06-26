// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import { renderCartesianChart } from "./common";

describe("CartesianChart: errorbar series without required Highcharts modules", () => {
  test("throws an error when rendering", () => {
    expect(() =>
      renderCartesianChart({
        highcharts,
        series: [
          { type: "column", name: "Column 1", data: [2], id: "column-1" },
          { type: "errorbar", name: "Error range", data: [{ low: 1, high: 3 }], linkedTo: "column-1" },
        ],
      }),
    ).toThrow("missingModuleFor: errorbar");
  });
});

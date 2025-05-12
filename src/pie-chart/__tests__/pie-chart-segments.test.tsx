// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";

import createWrapper from "../../../lib/components/test-utils/dom";
import { highlightChartPoint, renderPieChart } from "./common";

const getChart = () => createWrapper().findChart("pie")!;

describe("PieChart: segments", () => {
  test("renders given number of segments", () => {
    renderPieChart({
      highcharts,
      series: {
        name: "Pie",
        type: "pie",
        data: [
          { id: "1", name: "P1", y: 10 },
          { id: "2", name: "P2", y: 20 },
          { id: "3", name: "P3", y: 70 },
          { id: "4", name: "P4", y: 0 },
          { id: "5", name: "P5", y: null },
        ],
      },
    });

    act(() => highlightChartPoint(0, 1));

    expect(getChart().findSegments()).toHaveLength(4);
  });
});

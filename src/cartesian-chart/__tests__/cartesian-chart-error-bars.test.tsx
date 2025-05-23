// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { render } from "@testing-library/react";
import highcharts from "highcharts";
import { MockInstance, vi } from "vitest";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import CartesianChart from "../../../lib/components/cartesian-chart";
import { HighchartsTestHelper } from "../../core/__tests__/highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

describe("CartesianChart: Error bars", () => {
  let spy: MockInstance;
  beforeEach(() => {
    spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("issues a warning if linkedTo does not refer to an existing series id", () => {
    render(
      <CartesianChart
        highcharts={highcharts}
        series={[{ type: "errorbar", linkedTo: "nonExistingId", data: [{ low: 1, high: 2 }] }]}
      />,
    );

    act(() => hc.highlightChartPoint(0, 0));
    expect(spy).toHaveBeenCalledOnce();
  });
});

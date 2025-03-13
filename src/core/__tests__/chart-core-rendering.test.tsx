// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";

import { renderChart } from "./common";

describe("CloudscapeHighcharts: rendering", () => {
  test("renders default fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.findSpinner()).not.toBe(null);
  });

  test("renders custom fallback with highcharts=null", () => {
    const { wrapper } = renderChart({ highcharts: null, fallback: "Custom fallback" });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.findSpinner()).toBe(null);
    expect(wrapper!.getElement()).toHaveTextContent("Custom fallback");
  });

  test("renders chart with highcharts=Highcharts", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { title: { text: "Chart title" } },
    });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.getElement()).toHaveTextContent("Chart title");
  });
});

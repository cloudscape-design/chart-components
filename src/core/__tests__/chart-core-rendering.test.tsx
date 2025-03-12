// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import createWrapper from "../../../lib/components/test-utils/dom";

function renderChart(props: Partial<CloudscapeHighchartsProps>) {
  render(<CloudscapeHighcharts highcharts={Highcharts} className="test-chart" options={{}} {...props} />);
  return createWrapper().findByClassName("test-chart");
}

describe("CloudscapeHighcharts: rendering", () => {
  test("renders default fallback with highcharts=null", () => {
    const wrapper = renderChart({ highcharts: null });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.findSpinner()).not.toBe(null);
  });

  test("renders custom fallback with highcharts=null", () => {
    const wrapper = renderChart({ highcharts: null, fallback: "Custom fallback" });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.findSpinner()).toBe(null);
    expect(wrapper!.getElement()).toHaveTextContent("Custom fallback");
  });

  test("renders chart with highcharts=Highcharts", () => {
    const wrapper = renderChart({
      options: { title: { text: "Chart title" } },
    });
    expect(wrapper).not.toBe(null);
    expect(wrapper!.getElement()).toHaveTextContent("Chart title");
  });
});

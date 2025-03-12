// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render, waitFor } from "@testing-library/react";
import Highcharts from "highcharts";
import { vi } from "vitest";

import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import tooltipTextClasses from "../../../lib/components/internal/components/popover/test-classes/styles.selectors";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

class TestWrapper extends ElementWrapper {
  findHighchartsTooltip = () => this.findByClassName("highcharts-tooltip");
  findTooltip = () => {
    const wrapper = this.findByClassName(testClasses.tooltip);
    return wrapper ? new TooltipTestWrapper(wrapper.getElement()) : null;
  };
}

class TooltipTestWrapper extends ComponentWrapper {
  findHeader = () => this.findByClassName(tooltipTextClasses.header);
  findBody = () => this.findByClassName(tooltipTextClasses.body);
  findFooter = () => this.findByClassName(tooltipTextClasses.footer);
}

function renderChart(props: Partial<CloudscapeHighchartsProps>, Component = CloudscapeHighcharts) {
  render(<Component highcharts={Highcharts} className="test-chart" options={{}} {...props} />);
  const wrapper = new TestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
  return wrapper;
}

const data = [
  { name: "P1", y: 10 },
  { name: "P2", y: 30 },
  { name: "P3", y: 60 },
];

const series: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data,
  },
];

const getChart = () => {
  return Highcharts.charts.find((c) => c)!;
};

describe("CloudscapeHighcharts: tooltip", () => {
  test("renders highcharts tooltip", () => {
    const wrapper = renderChart({
      options: { series, tooltip: { enabled: true, formatter: () => "Custom content" } },
    });

    getChart().series[0].data[0].onMouseOver();

    expect(wrapper.findHighchartsTooltip()).not.toBe(null);
    expect(wrapper.findHighchartsTooltip()!.getElement().textContent).toBe("Custom content");
  });

  test("renders tooltip", async () => {
    const wrapper = renderChart({
      options: { series },
      tooltip: { getContent: () => ({ header: "Tooltip title", body: "Tooltip body", footer: "Tooltip footer" }) },
    });

    getChart().series[0].data[0].onMouseOver();

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Tooltip title");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Tooltip body");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Tooltip footer");
    });
  });

  test("provides point for tooltip.getContent", async () => {
    const getContent = vi.fn();
    renderChart({ options: { series }, tooltip: { getContent } });

    for (let i = 0; i < data.length; i++) {
      getChart().series[0].data[i].onMouseOver();

      await waitFor(() => {
        expect(getContent).toHaveBeenCalledWith({ x: i, y: data[i].y });
      });
    }
  });
});

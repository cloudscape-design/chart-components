// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render, waitFor } from "@testing-library/react";
import Highcharts from "highcharts";

import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import tooltipTestClasses from "../../../lib/components/internal/components/popover/test-classes/styles.selectors";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

class TestWrapper extends ElementWrapper {
  findTooltip = () => {
    const wrapper = this.findByClassName(testClasses.tooltip);
    return wrapper ? new TooltipTestWrapper(wrapper.getElement()) : null;
  };
}

class TooltipTestWrapper extends ComponentWrapper {
  findHeader = () => this.findByClassName(tooltipTestClasses.header);
  findBody = () => this.findByClassName(tooltipTestClasses.body);
  findFooter = () => this.findByClassName(tooltipTestClasses.footer);
}

function renderChart(props: Partial<CloudscapeHighchartsProps>) {
  render(<CloudscapeHighcharts highcharts={Highcharts} className="test-chart" options={{}} {...props} />);
  return new TestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
}
function hoverLegendItem(index: number) {
  const chart = Highcharts.charts.find((c) => c)!;
  const labelElement = (chart.legend.allItems[index] as any).legendItem.label.element;
  labelElement.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
}

const lineSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "P1", data: [1, 2, 3] },
  { type: "line", name: "P2", data: [4, 5, 6], id: "testid" },
];

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 90, id: "testid" },
    ],
    showInLegend: true,
  },
];

describe("CloudscapeHighcharts: legend tooltip", () => {
  test.each(["line", "pie"])("renders legend tooltip for series type = %s", async (seriesType) => {
    const series = seriesType === "line" ? lineSeries : pieSeries;
    const wrapper = renderChart({
      options: { series },
      legendTooltip: {
        getContent: (id) => ({ header: `Header ${id}`, body: `Body ${id}`, footer: `Footer ${id}` }),
      },
    });

    hoverLegendItem(0);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Header P1");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Body P1");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Footer P1");
    });

    hoverLegendItem(1);

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
      expect(wrapper.findTooltip()!.findHeader()!.getElement().textContent).toBe("Header testid");
      expect(wrapper.findTooltip()!.findBody()!.getElement().textContent).toBe("Body testid");
      expect(wrapper.findTooltip()!.findFooter()!.getElement().textContent).toBe("Footer testid");
    });
  });
});

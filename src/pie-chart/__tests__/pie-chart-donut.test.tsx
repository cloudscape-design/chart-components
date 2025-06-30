// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";

import PieChart, { PieChartProps } from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";

describe("PieChart: donut", () => {
  const commonSeries: PieChartProps.DonutSeriesOptions = {
    name: "Test",
    type: "donut",
    data: [
      { id: "1", name: "P1", y: 10 },
      { id: "2", name: "P2", y: 90 },
    ],
  };

  test.each(["pie", "donut"] as const)(
    "does not render inner value and description when not provided, series type=%s",
    (type) => {
      render(<PieChart highcharts={Highcharts} series={{ ...commonSeries, type }} />);
      expect(findInnerAreaTitle()).toBe(null);
      expect(findInnerAreaDescription()).toBe(null);
    },
  );

  test("does not render inner value and description for pie series", () => {
    render(
      <PieChart
        highcharts={Highcharts}
        series={{ ...commonSeries, type: "pie" }}
        innerAreaTitle="Value"
        innerAreaDescription="Description"
      />,
    );
    expect(findInnerAreaTitle()).toBe(null);
    expect(findInnerAreaDescription()).toBe(null);
  });

  test("renders inner value", () => {
    render(<PieChart highcharts={Highcharts} series={commonSeries} innerAreaTitle="Value" />);
    expect(findInnerAreaTitle()!.getElement().textContent).toBe("Value");
  });

  test("updates inner value", () => {
    const { rerender } = render(<PieChart highcharts={Highcharts} series={commonSeries} innerAreaTitle="Value" />);
    rerender(<PieChart highcharts={Highcharts} series={commonSeries} innerAreaTitle="New value" />);
    expect(findInnerAreaTitle()!.getElement().textContent).toBe("New value");
  });

  test("renders inner description", () => {
    render(<PieChart highcharts={Highcharts} series={commonSeries} innerAreaDescription="Description" />);
    expect(findInnerAreaDescription()!.getElement().textContent).toBe("Description");
  });

  test("updates inner description", () => {
    const { rerender } = render(
      <PieChart highcharts={Highcharts} series={commonSeries} innerAreaDescription="Description" />,
    );
    rerender(
      <PieChart
        highcharts={Highcharts}
        series={commonSeries}
        innerAreaTitle="New value"
        innerAreaDescription="New description"
      />,
    );
    expect(findInnerAreaDescription()!.getElement().textContent).toBe("New description");
  });

  test("renders inner value and inner description", () => {
    render(
      <PieChart
        highcharts={Highcharts}
        series={commonSeries}
        innerAreaTitle="Value"
        innerAreaDescription="Description"
      />,
    );
    expect(findInnerAreaTitle()!.getElement().textContent).toBe("Value");
    expect(findInnerAreaDescription()!.getElement().textContent).toBe("Description");
  });

  test("updates inner value and inner description", () => {
    const { rerender } = render(
      <PieChart
        highcharts={Highcharts}
        series={commonSeries}
        innerAreaTitle="Value"
        innerAreaDescription="Description"
      />,
    );
    rerender(
      <PieChart
        highcharts={Highcharts}
        series={commonSeries}
        innerAreaTitle="New value"
        innerAreaDescription="New description"
      />,
    );
    expect(findInnerAreaTitle()!.getElement().textContent).toBe("New value");
    expect(findInnerAreaDescription()!.getElement().textContent).toBe("New description");
  });
});

function findChart() {
  return createWrapper().findPieHighcharts()!;
}

function findInnerAreaTitle() {
  return findChart()!.findInnerAreaTitle();
}

function findInnerAreaDescription() {
  return findChart()!.findInnerAreaDescription();
}

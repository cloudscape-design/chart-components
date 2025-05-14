// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";

import PieChart from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";

describe("PieChart: donut", () => {
  test.each(["pie", "donut"] as const)(
    "does not render inner value and description when not provided, series type=%s",
    (type) => {
      render(
        <PieChart
          highcharts={Highcharts}
          series={{
            name: "Test",
            type: type,
            data: [
              { id: "1", name: "P1", y: 10 },
              { id: "2", name: "P2", y: 90 },
            ],
          }}
        />,
      );
      expect(createWrapper().findChart("pie")!.findInnerValue()).toBe(null);
      expect(createWrapper().findChart("pie")!.findInnerDescription()).toBe(null);
    },
  );

  test("does not render inner value and description for pie series", () => {
    render(
      <PieChart
        highcharts={Highcharts}
        series={{
          name: "Test",
          type: "pie",
          data: [
            { id: "1", name: "P1", y: 10 },
            { id: "2", name: "P2", y: 90 },
          ],
        }}
        innerValue="Value"
        innerDescription="Description"
      />,
    );
    expect(createWrapper().findChart("pie")!.findInnerValue()).toBe(null);
    expect(createWrapper().findChart("pie")!.findInnerDescription()).toBe(null);
  });

  test("renders inner value and description for donut series", () => {
    render(
      <PieChart
        highcharts={Highcharts}
        series={{
          name: "Test",
          type: "donut",
          data: [
            { id: "1", name: "P1", y: 10 },
            { id: "2", name: "P2", y: 90 },
          ],
        }}
        innerValue="Value"
        innerDescription="Description"
      />,
    );
    expect(createWrapper().findChart("pie")!.findInnerValue()!.getElement().textContent).toBe("Value");
    expect(createWrapper().findChart("pie")!.findInnerDescription()!.getElement().textContent).toBe("Description");
  });
});

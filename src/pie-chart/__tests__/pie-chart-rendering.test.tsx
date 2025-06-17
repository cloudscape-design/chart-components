// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";

import PieChart from "../../../lib/components/pie-chart";
import createWrapper from "../../../lib/components/test-utils/dom";

describe("PieChart: rendering", () => {
  test("renders chart with highcharts=null", () => {
    render(<PieChart highcharts={null} series={null} />);
    expect(createWrapper().findPieHighcharts()).not.toBe(null);
  });

  test("renders chart with highcharts=Highcharts", () => {
    render(<PieChart highcharts={Highcharts} series={null} />);
    expect(createWrapper().findPieHighcharts()).not.toBe(null);
  });
});

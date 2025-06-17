// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import Highcharts from "highcharts";

import CartesianChart from "../../../lib/components/cartesian-chart";
import createWrapper from "../../../lib/components/test-utils/dom";

describe("CartesianChart: rendering", () => {
  test("renders chart with highcharts=null", () => {
    render(<CartesianChart highcharts={null} series={[]} />);
    expect(createWrapper().findCartesianHighcharts()).not.toBe(null);
  });

  test("renders chart with highcharts=Highcharts", () => {
    render(<CartesianChart highcharts={Highcharts} series={[]} />);
    expect(createWrapper().findCartesianHighcharts()).not.toBe(null);
  });
});

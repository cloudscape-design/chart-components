// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import fs from "fs";
import Highcharts from "highcharts";
import path from "path";

import CartesianChart from "../../lib/components/cartesian-chart";
import PieChart from "../../lib/components/pie-chart";
import createWrapper from "../../lib/components/test-utils/dom";

describe("Generate test utils ElementWrapper", () => {
  const importPaths = [
    {
      type: "dom",
      relativePath: "../test-utils/dom/index.ts",
    },
    {
      type: "selectors",
      relativePath: "../test-utils/selectors/index.ts",
    },
  ] as const;

  test.each(importPaths)("$type ElementWrapper matches the snapshot", ({ relativePath }) => {
    const testUtilsPath = path.join(__dirname, relativePath);
    const domWrapper = fs.readFileSync(testUtilsPath, "utf8");
    expect(domWrapper).toMatchSnapshot();
  });
});

test("finds charts by type", () => {
  const highchartsOrNoHighcharts = Math.random() > 0.5 ? Highcharts : null;
  render(<CartesianChart highcharts={highchartsOrNoHighcharts} series={[]} data-testid="c1" />);
  render(<CartesianChart highcharts={highchartsOrNoHighcharts} series={[]} data-testid="c2" />);
  render(<PieChart highcharts={highchartsOrNoHighcharts} series={null} data-testid="p1" />);

  expect(createWrapper().findCartesianHighcharts()).not.toBe(null);
  expect(createWrapper().findCartesianHighcharts('[data-testid="c1"]')).not.toBe(null);
  expect(createWrapper().findCartesianHighcharts('[data-testid="c2"]')).not.toBe(null);
  expect(createWrapper().findAllCartesianHighcharts()).toHaveLength(2);

  expect(createWrapper().findPieHighcharts()).not.toBe(null);
  expect(createWrapper().findPieHighcharts('[data-testid="p1"]')).not.toBe(null);
  expect(createWrapper().findAllPieHighcharts()).toHaveLength(1);
});

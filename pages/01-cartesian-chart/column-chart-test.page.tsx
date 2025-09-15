// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ColumnLayout from "@cloudscape-design/components/column-layout";

import { CartesianChart } from "../../lib/components";
import { numberFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

const categories = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];
const costsData = [6562, 8768, 9742, 10464, 16777, 9956, 5876];
const prevCostsData = [6862, 6322, 10112, 9220, 13123, 11277, 7862];
const costsSeries = [
  { id: "costs", name: "Costs", type: "column", data: costsData },
  { id: "prev-costs", name: "Prev costs", type: "column", data: prevCostsData },
] as const;

export default function () {
  const { chartProps } = useChartSettings();
  return (
    <Page title="Integration tests page for column cartesian charts">
      <ColumnLayout columns={2}>
        <CartesianChart
          {...chartProps.cartesian}
          ariaLabel="Grouped column chart"
          data-testid="grouped-column-chart"
          series={costsSeries}
          xAxis={{ type: "category", title: "Budget month", categories }}
          yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
        />
      </ColumnLayout>
    </Page>
  );
}

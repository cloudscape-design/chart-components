// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";
import Table from "@cloudscape-design/components/table";

import { CartesianChart, PieChart } from "../../lib/components";
import { moneyFormatter } from "../common/formatters";
import { PageSettings, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  visibleItems: string;
}

const categories = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];

export default function () {
  return (
    <Page
      title="Sparkline charts demo"
      subtitle="This page demonstrates minimal charts to be used as indicators, e.g. in tables."
    >
      <Table
        resizableColumns={true}
        columnDefinitions={[
          { id: "key", header: "Key", cell: (item) => item.key, width: 200 },
          { id: "data", header: "Data", cell: (item) => item.chart, width: 200 },
          {
            id: "description",
            header: "Description",
            cell: () =>
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          },
        ]}
        items={[
          { key: "Line", chart: <SparkLine /> },
          { key: "Column", chart: <SparkColumn /> },
          { key: "Pie", chart: <SparkPie /> },
        ]}
      />
    </Page>
  );
}

function SparkLine() {
  const { chartProps } = useChartSettings<ThisPageSettings>();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={200}
      ariaLabel="Mixed bar chart"
      legend={{ enabled: false }}
      series={[
        {
          id: "Costs",
          name: "Costs",
          type: "line",
          data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
        },
      ]}
      tooltip={{
        point: ({ item }) => {
          return {
            key: item.series.name,
            value: (
              <Link external={true} href="#" ariaLabel={`See details for ${item.series.name} (opens in a new tab)`}>
                {item.y !== null ? moneyFormatter(item.y) : null}
              </Link>
            ),
          };
        },
      }}
      xAxis={{ title: "", type: "category", categories }}
      yAxis={{ title: "" }}
    />
  );
}

function SparkColumn() {
  const { chartProps } = useChartSettings<ThisPageSettings>();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={200}
      ariaLabel="Column chart"
      legend={{ enabled: false }}
      series={[
        {
          id: "Costs",
          name: "Costs",
          type: "column",
          data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
        },
      ]}
      xAxis={{ title: "", type: "category", categories }}
      yAxis={{ title: "" }}
    />
  );
}

function SparkPie() {
  const { chartProps } = useChartSettings<ThisPageSettings>();
  return (
    <PieChart
      {...chartProps.pie}
      chartHeight={200}
      ariaLabel="Pie chart"
      legend={{ enabled: false }}
      segmentTitle={() => ""}
      series={{
        name: "Resource count",
        type: "pie",
        data: [
          { name: "Running", y: 60 },
          { name: "Failed", y: 30 },
          { name: "In-progress", y: 10 },
        ],
      }}
    />
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Link from "@cloudscape-design/components/link";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

const series: Array<CartesianChartProps.ColumnSeriesOptions | CartesianChartProps.SplineSeriesOptions> = [
  {
    name: "Costs",
    type: "column",
    data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
    error: [
      { low: 6250, high: 6800 },
      { low: 8500, high: 9000 },
      { low: 9500, high: 10000 },
      { low: 10300, high: 10700 },
      { low: 16500, high: 17000 },
      { low: 9700, high: 10200 },
      { low: 5600, high: 6150 },
    ],
  },
  {
    name: "Costs last year",
    type: "spline",
    data: [5373, 7563, 7900, 12342, 14311, 11830, 8505],
    error: [
      { low: 5100, high: 5500 },
      { low: 7300, high: 7800 },
      { low: 7650, high: 8150 },
      { low: 12100, high: 12600 },
      { low: 14100, high: 14500 },
      { low: 11600, high: 12100 },
      { low: 8255, high: 8755 },
    ],
  },
];

export default function () {
  const { settings, chartProps } = useChartSettings({ more: true });
  return (
    <Page
      title="Error bars"
      subtitle="This pages demonstrates the use of error bars for columns and line series."
      settings={<PageSettingsForm selectedSettings={["showCustomTooltipContent"]} />}
    >
      <PageSection title="Mixed bar chart with error bars">
        <CartesianChart
          {...chartProps.cartesian}
          chartHeight={379}
          ariaLabel="Mixed bar chart"
          series={series}
          tooltip={
            settings.showCustomTooltipContent
              ? {
                  // TODO: embedded error bars as detail type
                  series: ({ item, index }) => {
                    if (item.type !== "point") {
                      return { key: "?", value: "?" };
                    }
                    const series = item.series as
                      | CartesianChartProps.ColumnSeriesOptions
                      | CartesianChartProps.SplineSeriesOptions;
                    return {
                      key: series.name,
                      value: (
                        <>
                          <Link
                            external={true}
                            href="#"
                            ariaLabel={`See details for ${moneyFormatter(item.y)} on ${series.name} (opens in a new tab)`}
                          >
                            {moneyFormatter(item.y)}
                          </Link>
                          {series.error && (
                            <>
                              {" "}
                              [-{moneyFormatter(item.y - series.error[index].low)}, +
                              {moneyFormatter(series.error[index].high - item.y)}]
                            </>
                          )}
                        </>
                      ),
                    };
                  },
                }
              : undefined
          }
          xAxis={{
            type: "category",
            title: "Budget month",
            categories: ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"],
            min: 0,
            max: 6,
          }}
          yAxis={{
            title: "Costs (USD)",
            min: 0,
            max: 20000,
            valueFormatter: numberFormatter,
          }}
        />
      </PageSection>
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CoreChartProps } from "../../lib/components/core/interfaces";
import { colors } from "../../lib/components/internal/chart-styles";
import { LegendItem } from "../../lib/components/internal/components/interfaces";
import { ChartSeriesMarker } from "../../lib/components/internal/components/series-marker";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { CoreLegend } from "../../lib/components/internal-do-not-use/core-legend";
import { dateFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

const baseline = [
  { x: 1600984800000, y: 58020 },
  { x: 1600985700000, y: 102402 },
  { x: 1600986600000, y: 104920 },
  { x: 1600987500000, y: 94031 },
  { x: 1600988400000, y: 125021 },
  { x: 1600989300000, y: 159219 },
  { x: 1600990200000, y: 193082 },
  { x: 1600991100000, y: 162592 },
  { x: 1600992000000, y: 274021 },
  { x: 1600992900000, y: 264286 },
  { x: 1600993800000, y: 289210 },
  { x: 1600994700000, y: 256362 },
  { x: 1600995600000, y: 257306 },
  { x: 1600996500000, y: 186776 },
  { x: 1600997400000, y: 294020 },
  { x: 1600998300000, y: 385975 },
  { x: 1600999200000, y: 486039 },
  { x: 1601000100000, y: 490447 },
  { x: 1601001000000, y: 361845 },
  { x: 1601001900000, y: 339058 },
  { x: 1601002800000, y: 298028 },
  { x: 1601003400000, y: 255555 },
  { x: 1601003700000, y: 231902 },
  { x: 1601004600000, y: 224558 },
  { x: 1601005500000, y: 253901 },
  { x: 1601006400000, y: 102839 },
  { x: 1601007300000, y: 234943 },
  { x: 1601008200000, y: 204405 },
  { x: 1601009100000, y: 190391 },
  { x: 1601010000000, y: 183570 },
  { x: 1601010900000, y: 162592 },
  { x: 1601011800000, y: 148910 },
  { x: 1601012700000, y: null },
  { x: 1601013600000, y: 293910 },
];

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-150000, 50000) }));

const pieSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "Resource Allocation",
    type: "pie",
    data: [
      { name: "CPU Utilization", y: 45.0 },
      { name: "Memory Usage", y: 26.8 },
      { name: "Storage Capacity", y: 12.8 },
    ],
  },
];

const lineSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "CPU Utilization",
    type: "line",
    data: dataA,
  },
  {
    name: "Memory Usage",
    type: "line",
    data: dataB,
  },
  {
    name: "Storage Capacity",
    type: "line",
    data: dataC,
  },
  {
    name: "X",
    type: "scatter",
    data: [{ x: 1601012700000, y: 500000 }],
    marker: { symbol: "square" },
    showInLegend: false,
  },
];

const initialLegendItems: readonly LegendItem[] = [
  {
    id: "CPU Utilization",
    name: "CPU Utilization",
    marker: <ChartSeriesMarker color={colors[0]} type={"square"} visible={true} />,
    visible: true,
    highlighted: false,
  },
  {
    id: "Memory Usage",
    name: "Memory Usage",
    marker: <ChartSeriesMarker color={colors[1]} type={"square"} visible={true} />,
    visible: true,
    highlighted: false,
  },
  {
    id: "Storage Capacity",
    name: "Storage Capacity",
    marker: <ChartSeriesMarker color={colors[2]} type={"square"} visible={true} />,
    visible: true,
    highlighted: false,
  },
];

type SourceType = "legend" | "pie-chart" | "line-chart";

export default function () {
  const { chartProps } = useChartSettings();

  const [items, setItems] = useState(initialLegendItems);
  const sources = useRef<Map<SourceType, CoreChartProps.ChartAPI>>(new Map());

  const legendProps = {
    title: chartProps.cartesian.legend?.title,
    actions: chartProps.cartesian.legend?.actions,
  } as const;

  const clearLegendHighlight = (source: SourceType, isApiCall: boolean) => {
    if (isApiCall) {
      return;
    }
    for (const [name, chart] of sources.current.entries()) {
      if (name !== source) {
        chart.clearChartHighlight();
      }
    }
    setItems((prevItems) => {
      const hiddenSeries = prevItems.find((i) => !i.visible) !== undefined;
      return prevItems.map(({ ...i }) => ({ ...i, highlighted: hiddenSeries ? i.visible : false }));
    });
  };

  const highlightLegendItem = (source: SourceType, itemId: string, isApiCall: boolean) => {
    if (isApiCall) {
      return;
    }
    for (const [name, chart] of sources.current.entries()) {
      if (name !== source) {
        chart.highlightItems([itemId]);
      }
    }
    setItems((prevItems) => {
      return prevItems.map((i) => ({ ...i, highlighted: i.id === itemId }));
    });
  };

  const changeVisibleLegendItems = (source: SourceType, itemIds: readonly string[]) => {
    for (const [name, chart] of sources.current.entries()) {
      if (name !== source) {
        chart.setItemsVisible(itemIds);
      }
    }
    setItems((prevItems) => {
      return prevItems.map((item, index) => {
        const visible = itemIds.includes(item.id);
        return {
          ...item,
          visible,
          highlighted: visible,
          marker: <ChartSeriesMarker color={colors[index % colors.length]} type={"square"} visible={visible} />,
        };
      });
    });
  };

  return (
    <Page
      title="Core Legend demo"
      subtitle="The page demonstrates the use of the core legend."
      settings={<PageSettingsForm selectedSettings={["showLegendTitle", "showLegendActions"]} />}
    >
      <SpaceBetween direction="vertical" size="m">
        <CoreLegend
          items={items}
          {...legendProps}
          ariaLabel="Dashboard Legend"
          onClearHighlight={() => clearLegendHighlight("legend", false)}
          onItemHighlight={(e) => highlightLegendItem("legend", e.detail.item.id, false)}
          onVisibleItemsChange={(e) => changeVisibleLegendItems("legend", e.detail.items)}
          getLegendTooltipContent={({ legendItem }) => ({
            header: (
              <div>
                <div style={{ display: "flex" }}>
                  {legendItem.marker}
                  {legendItem.name}
                </div>
              </div>
            ),
            body: (
              <>
                <table>
                  <tbody style={{ textAlign: "left" }}>
                    <tr>
                      <th scope="row">Period</th>
                      <td>15 min</td>
                    </tr>
                    <tr>
                      <th scope="row">Statistic</th>
                      <td>Average</td>
                    </tr>
                    <tr>
                      <th scope="row">Unit</th>
                      <td>Count</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ),
            footer: (
              <Link external={true} href="https://example.com/" variant="primary">
                Learn more
              </Link>
            ),
          })}
        />
        <CoreChart
          {...omit(chartProps.pie, "ref")}
          highcharts={Highcharts}
          chartHeight={400}
          legend={{ enabled: false }}
          callback={(chart) => {
            sources.current.set("pie-chart", chart);
          }}
          onHighlight={(e) => {
            if (e.detail.point) {
              highlightLegendItem("pie-chart", e.detail.point.name, e.detail.isApiCall);
            }
          }}
          onClearHighlight={(e) => clearLegendHighlight("pie-chart", e.detail.isApiCall)}
          options={{
            lang: {
              accessibility: {
                chartContainerLabel: "Pie chart",
              },
            },
            series: pieSeries,
            chart: {
              type: "pie",
            },
            title: {
              text: "Resource Allocation",
            },
            plotOptions: {
              pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                  enabled: true,
                  format: "{point.name}: {point.percentage:.1f}%",
                },
              },
            },
          }}
        />
        <CoreChart
          {...omit(chartProps.cartesian, "ref")}
          highcharts={Highcharts}
          chartHeight={300}
          legend={{ enabled: false }}
          callback={(chart) => {
            sources.current.set("line-chart", chart);
          }}
          onHighlight={(e) => {
            if (e.detail.point) {
              highlightLegendItem("line-chart", e.detail.point.series.name, e.detail.isApiCall);
            }
          }}
          onClearHighlight={(e) => clearLegendHighlight("line-chart", e.detail.isApiCall)}
          options={{
            lang: {
              accessibility: {
                chartContainerLabel: "Line chart",
              },
            },
            series: lineSeries,
            xAxis: [
              {
                type: "datetime",
                title: { text: "Time (UTC)" },
                valueFormatter: dateFormatter,
              },
            ],
            yAxis: [{ title: { text: "Events" } }],
            chart: {
              zooming: {
                type: "x",
              },
            },
          }}
        />
      </SpaceBetween>
    </Page>
  );
}

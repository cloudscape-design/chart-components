// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import ColumnLayout from "@cloudscape-design/components/column-layout";
import {
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
} from "@cloudscape-design/design-tokens";

import { ChartSeriesMarker } from "../../lib/components/internal/components/series-marker";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { CoreLegend } from "../../lib/components/internal-do-not-use/core-legend";
import { CoreChartProps } from "../../src/core/interfaces";
import { LegendItem } from "../../src/internal/components/interfaces";
import { dateFormatter } from "../common/formatters";
import { useChartSettings } from "../common/page-settings";
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
];

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-150000, 50000) }));

const series = [
  {
    name: "Series A",
    type: "line" as const,
    data: dataA,
    color: colorChartsPaletteCategorical1,
  },
  {
    name: "Series B",
    type: "line" as const,
    data: dataB,
    color: colorChartsPaletteCategorical2,
  },
  {
    name: "Series C",
    type: "line" as const,
    data: dataC,
    color: colorChartsPaletteCategorical3,
  },
];

export default function LegendEventsDemo() {
  const [visibleItems, setVisibleItems] = useState(new Set<string>(["Series A", "Series B", "Series C"]));
  const [highlightedItem, setHighlightedItem] = useState<null | string>(null);

  const { chartProps } = useChartSettings();
  const chart1API = useRef<CoreChartProps.ChartAPI>(null) as React.MutableRefObject<CoreChartProps.ChartAPI>;
  const chart2API = useRef<CoreChartProps.ChartAPI>(null) as React.MutableRefObject<CoreChartProps.ChartAPI>;

  const createOnItemHighlight =
    (referrer: "legend" | "chart1" | "chart2") =>
    ({ detail }: { detail: { item: LegendItem } }) => {
      setHighlightedItem(detail.item.name);
      if (referrer !== "chart1") {
        chart1API.current.highlightItems([detail.item.name]);
      }
      if (referrer !== "chart2") {
        chart2API.current.highlightItems([detail.item.name]);
      }
    };
  const createOnClearHighlight =
    (referrer: "legend" | "chart1" | "chart2") =>
    ({ detail }: { detail: { isApiCall: boolean } }) => {
      if (!detail.isApiCall) {
        setHighlightedItem(null);
        if (referrer !== "chart1") {
          chart1API.current.clearChartHighlight();
        }
        if (referrer !== "chart2") {
          chart2API.current.clearChartHighlight();
        }
      }
    };
  const createOnHighlight =
    (referrer: "chart1" | "chart2") =>
    ({ detail }: { detail: { point: null | Highcharts.Point; isApiCall: boolean } }) => {
      if (detail.point && !detail.isApiCall) {
        setHighlightedItem(detail.point.name);
        if (referrer !== "chart1") {
          chart1API.current.highlightChartPoint(detail.point);
        }
        if (referrer !== "chart2") {
          chart2API.current.highlightChartPoint(detail.point);
        }
      }
    };

  const legendItems: LegendItem[] = series.map((s) => ({
    id: s.name,
    name: s.name,
    marker: <ChartSeriesMarker color={s.color} type="line" />,
    visible: visibleItems.has(s.name),
    highlighted: highlightedItem === s.name,
  }));

  return (
    <Page
      title="Events sync"
      subtitle="Demonstrates the highlight synchronization between standalone legends and charts"
    >
      <ColumnLayout columns={2}>
        <CoreLegend
          items={legendItems}
          title="Standalone legend 1"
          onItemHighlight={createOnItemHighlight("legend")}
          onClearHighlight={createOnClearHighlight("legend")?.bind(null, { detail: { isApiCall: false } })}
          onVisibleItemsChange={({ detail }) => setVisibleItems(new Set(detail.items))}
        />

        <CoreLegend
          items={legendItems}
          title="Standalone legend 2"
          onItemHighlight={createOnItemHighlight("legend")}
          onClearHighlight={createOnClearHighlight("legend")?.bind(null, { detail: { isApiCall: false } })}
          onVisibleItemsChange={({ detail }) => setVisibleItems(new Set(detail.items))}
        />

        <CoreChart
          {...omit(chartProps.cartesian, "ref")}
          highcharts={Highcharts}
          callback={(chartApi) => (chart1API.current = chartApi)}
          ariaLabel="Chart 1"
          options={{
            series: series,
            xAxis: [{ type: "datetime", title: { text: "Time (UTC)" }, valueFormatter: dateFormatter }],
            yAxis: [{ title: { text: "Events" } }],
          }}
          legend={{ title: "Chart legend 1" }}
          onLegendItemHighlight={createOnItemHighlight("chart1")}
          onClearHighlight={createOnClearHighlight("chart1")}
          onHighlight={createOnHighlight("chart1")}
          visibleItems={[...visibleItems]}
          onVisibleItemsChange={({ detail }) =>
            setVisibleItems(new Set(detail.items.filter((i) => i.visible).map((i) => i.name)))
          }
        />

        <CoreChart
          {...omit(chartProps.cartesian, "ref")}
          highcharts={Highcharts}
          callback={(chartApi) => (chart2API.current = chartApi)}
          ariaLabel="Chart 2"
          options={{
            series: series,
            xAxis: [{ type: "datetime", title: { text: "Time (UTC)" }, valueFormatter: dateFormatter }],
            yAxis: [{ title: { text: "Events" } }],
          }}
          legend={{ title: "Chart legend 2" }}
          onLegendItemHighlight={createOnItemHighlight("chart2")}
          onClearHighlight={createOnClearHighlight("chart2")}
          onHighlight={createOnHighlight("chart2")}
          visibleItems={[...visibleItems]}
          onVisibleItemsChange={({ detail }) =>
            setVisibleItems(new Set(detail.items.filter((i) => i.visible).map((i) => i.name)))
          }
        />
      </ColumnLayout>
    </Page>
  );
}

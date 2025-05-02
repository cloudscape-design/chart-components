// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { colorChartsGreen300, colorChartsRed500 } from "@cloudscape-design/design-tokens";

import { CoreChart } from "../../lib/components/core/chart-core";
import { CoreChartAPI } from "../../lib/components/core/interfaces-core";
import { getSeriesColor, getSeriesMarkerType } from "../../lib/components/core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../../lib/components/internal/components/series-details";
import { ChartSeriesMarker } from "../../lib/components/internal/components/series-marker";
import { dateFormatter, numberFormatter } from "../common/formatters";
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
  { x: 1601012700000, y: 229492 },
  { x: 1601013600000, y: 293910 },
];

const scatterSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "A",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "A", x, y })),
  },
  {
    name: "B",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "B", x, y: y + randomInt(-100000, 100000) })),
  },
  {
    name: "C",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-150000, 50000) })),
  },
  {
    name: "D",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-200000, -100000) })),
  },
  {
    name: "E",
    type: "scatter",
    data: baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(50000, 75000) })),
  },
];

const green = colorChartsGreen300;
const red = colorChartsRed500;

const inAlarmData = baseline
  .reduce(
    (acc, point, index) => {
      const prevX = acc[index - 1]?.x2 ?? point.x;
      const prevColor = acc[index - 1]?.color ?? green;
      acc.push({ x: prevX, x2: point.x, y: 0, color: prevColor === green ? red : green });
      return acc;
    },
    [] as { x: number; x2: number; y: number; color: string }[],
  )
  .slice(1);
const xrangeSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "In alarm",
    type: "xrange",
    pointWidth: 25,
    data: inAlarmData,
    borderRadius: 0,
    borderColor: "transparent",
  },
];

export default function () {
  return (
    <Page
      title="Synched charts demo"
      subtitle="This page demonstrates how charts can have a synchronized tooltip and legend"
      settings={<PageSettingsForm selectedSettings={["showLegend", "tooltipSize", "tooltipPlacement"]} />}
    >
      <Charts />
    </Page>
  );
}

function Charts() {
  const { chartProps } = useChartSettings({ xrange: true });
  const scatterChartRef = useRef<CoreChartAPI>(null) as React.MutableRefObject<CoreChartAPI>;
  const getScatterChart = () => scatterChartRef.current!;
  const xrangeChartRef = useRef<CoreChartAPI>(null) as React.MutableRefObject<CoreChartAPI>;
  const getXrangeChart = () => xrangeChartRef.current!;
  return (
    <SpaceBetween size="s">
      <CoreChart
        callback={(chart) => {
          scatterChartRef.current = chart;
        }}
        {...omit(chartProps.cartesian, "ref")}
        options={{
          chart: {
            height: 379,
          },
          legend: {
            align: "left",
          },
          lang: {
            accessibility: {
              chartContainerLabel: "Scatter chart",
            },
          },
          series: scatterSeries,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
            },
          ],
          yAxis: [{ title: { text: "Events" } }],
          plotOptions: {
            series: {
              point: {
                events: {
                  mouseOver(event) {
                    if (event.target instanceof Highcharts.Point) {
                      const minPoint = findMinPoint(event.target, getXrangeChart().chart);
                      if (minPoint) {
                        getXrangeChart().highlightChartPoint(minPoint);
                      }
                    }
                  },
                  mouseOut() {
                    getXrangeChart().clearChartHighlight();
                  },
                },
              },
            },
          },
        }}
        getTooltipContent={({ point: { x } }) => {
          const header = dateFormatter(x);
          const inAlarmState = inAlarmData.find(({ x: x1, x2 }) => x1 <= x && x <= x2);
          const inAlarm = inAlarmState?.color === red;
          const footer = (
            <div>
              <hr />
              {inAlarm ? (
                <StatusIndicator type="warning">In alarm</StatusIndicator>
              ) : (
                <StatusIndicator type="success">Ok</StatusIndicator>
              )}
            </div>
          );
          const details: ChartSeriesDetailItem[] = [];
          for (const s of getScatterChart().chart.series) {
            for (const p of s.data) {
              if (p.x === x) {
                details.push({
                  key: p.name,
                  marker: <ChartSeriesMarker color={getSeriesColor(s)} type={getSeriesMarkerType(s)} />,
                  value: numberFormatter(p.y!),
                });
              }
            }
          }
          return {
            header,
            body: <ChartSeriesDetails details={details} />,
            footer,
          };
        }}
      />

      <CoreChart
        callback={(chart) => {
          xrangeChartRef.current = chart;
        }}
        {...omit(chartProps.cartesian, "ref")}
        options={{
          chart: {
            height: 150,
          },
          legend: {
            enabled: false,
          },
          lang: {
            accessibility: {
              chartContainerLabel: "In alarm chart",
            },
          },
          series: xrangeSeries,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
            },
          ],
          yAxis: [{ title: { text: "In alarm" }, type: "category" }],
          tooltip: { enabled: false },
          plotOptions: {
            series: {
              point: {
                events: {
                  mouseOver(event) {
                    if (event.target instanceof Highcharts.Point) {
                      if (event.target instanceof Highcharts.Point) {
                        const minPoint = findMinPoint(event.target, getScatterChart().chart);
                        if (minPoint) {
                          getScatterChart().highlightChartPoint(minPoint);
                        }
                      }
                    }
                  },
                  mouseOut() {
                    getScatterChart().clearChartHighlight();
                  },
                },
              },
            },
          },
        }}
      />
    </SpaceBetween>
  );
}

function findMinPoint(targetPoint: Highcharts.Point, chart: Highcharts.Chart) {
  let minPoint: null | Highcharts.Point = null;
  for (const s of chart.series) {
    for (const p of s.data) {
      if (p.x !== targetPoint.x) {
        continue;
      }
      if (minPoint === null || p.y! < minPoint.y!) {
        minPoint = p;
      }
    }
  }
  return minPoint;
}

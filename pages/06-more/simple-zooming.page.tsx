// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { colorChartsBlue1400, colorChartsLineTick } from "@cloudscape-design/design-tokens";

import { CloudscapeHighcharts } from "../../lib/components/core/chart-core";
import { CloudscapeChartAPI } from "../../lib/components/core/interfaces-core";
import { getSeriesMarkerType } from "../../lib/components/core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../../lib/components/internal/components/series-details";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { TooltipSettings, usePageSettings } from "../common/page-settings";
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

const dataA = baseline.map(({ x, y }) => ({ name: "A", x, y }));
const dataB = baseline.map(({ x, y }) => ({ name: "B", x, y: y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-150000, 50000) }));
const dataD = baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(-200000, -100000) }));
const dataE = baseline.map(({ x, y }) => ({ name: "C", x, y: y + randomInt(50000, 75000) }));

const scatterSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "A",
    type: "scatter",
    data: dataA,
  },
  {
    name: "B",
    type: "scatter",
    data: dataB,
  },
  {
    name: "C",
    type: "scatter",
    data: dataC,
  },
  {
    name: "D",
    type: "scatter",
    data: dataD,
  },
  {
    name: "E",
    type: "scatter",
    data: dataE,
  },
];

const rangeSeries: Highcharts.SeriesOptionsType[] = [
  {
    name: "Range",
    type: "areasplinerange",
    marker: { enabled: false },
    data: baseline.map(({ x }, i) => ({
      x,
      low: Math.min(dataA[i].y, dataB[i].y, dataC[i].y, dataD[i].y, dataE[i].y),
      high: Math.max(dataA[i].y, dataB[i].y, dataC[i].y, dataD[i].y, dataE[i].y),
    })),
  },
];

export default function () {
  const { settings, setSettings } = usePageSettings({});
  return (
    <Page
      title="Simple zooming demo"
      subtitle="This page shows how a secondary chart can be used as a zoom navigator."
      settings={
        <SpaceBetween size="s">
          <TooltipSettings />
          <Checkbox
            checked={settings.keepZoomingFrame}
            onChange={({ detail }) => setSettings({ keepZoomingFrame: detail.checked })}
          >
            Keep zooming frame
          </Checkbox>
        </SpaceBetween>
      }
    >
      <Charts />
    </Page>
  );
}

const Style = {
  zoomPlotLine: { color: colorChartsBlue1400, width: 2, zIndex: 5 },
};

function Charts() {
  const [zoomRange, setZoomRange] = useState<null | [number, number]>(null);
  const { settings, highcharts, chartStateProps } = usePageSettings({ more: true });
  const scatterChartRef = useRef<CloudscapeChartAPI>(null) as React.MutableRefObject<CloudscapeChartAPI>;
  const getScatterChart = () => scatterChartRef.current!;
  const navigatorChartRef = useRef<CloudscapeChartAPI>(null) as React.MutableRefObject<CloudscapeChartAPI>;
  const getNavigatorChart = () => navigatorChartRef.current!;
  const setZoom = (range: null | [number, number]) => {
    getScatterChart().hc.xAxis[0].setExtremes(range?.[0], range?.[1]);
    if (!settings.keepZoomingFrame) {
      getNavigatorChart().hc.xAxis[0].setExtremes(range?.[0], range?.[1]);
    }
    setZoomRange(range);
  };
  const zoomStateRef = useRef<null | number>(null);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.keyCode === KeyCode.escape) {
        getNavigatorChart().hc.xAxis[0].removePlotLine("zoom-start");
        getNavigatorChart().hc.xAxis[0].removePlotLine("zoom-end");
        zoomStateRef.current = null;
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, []);
  return (
    <SpaceBetween size="s">
      <BreadcrumbGroup
        items={
          !zoomRange
            ? [{ text: "All data", href: "#" }]
            : [
                { text: "All data", href: "#" },
                { text: `Range: ${dateFormatter(zoomRange[0])}..${dateFormatter(zoomRange[1])}`, href: "#" },
              ]
        }
        onFollow={(event) => {
          event.preventDefault();
          setZoom(null);
        }}
      />

      <CloudscapeHighcharts
        callback={(chart) => {
          scatterChartRef.current = chart;
        }}
        highcharts={highcharts}
        {...omit(chartStateProps, "ref")}
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
                      const minPoint = findMinPoint(event.target, getNavigatorChart().hc);
                      if (minPoint) {
                        getNavigatorChart().cloudscape.showTooltipOnPoint(minPoint);
                      }
                    }
                  },
                  mouseOut() {
                    getNavigatorChart().cloudscape.hideTooltip();
                  },
                },
              },
            },
          },
        }}
        tooltip={{
          getContent({ x }) {
            const header = dateFormatter(x);
            const details: ChartSeriesDetailItem[] = [];
            for (const s of getScatterChart().hc.series) {
              for (const p of s.data) {
                if (p.x === x) {
                  details.push({
                    key: p.name,
                    color: p.color as unknown as string,
                    markerType: getSeriesMarkerType(s),
                    value: numberFormatter(p.y!),
                  });
                }
              }
            }
            return {
              header,
              body: <ChartSeriesDetails details={details} />,
            };
          },
        }}
      />

      <CloudscapeHighcharts
        callback={(chart) => {
          navigatorChartRef.current = chart;
        }}
        highcharts={highcharts}
        {...omit(chartStateProps, "ref")}
        options={{
          chart: {
            height: 150,
            zooming: {
              type: "x",
            },
            events: {
              selection(event) {
                setZoom([event.xAxis[0].min, event.xAxis[0].max]);
                return false;
              },
            },
          },
          legend: {
            enabled: false,
          },
          lang: {
            accessibility: {
              chartContainerLabel: "Zoom navigator",
            },
          },
          series: rangeSeries,
          xAxis: [
            {
              type: "datetime",
              title: { text: "Time (UTC)" },
              plotBands: zoomRange
                ? [
                    {
                      from: zoomRange[0],
                      to: zoomRange[1],
                      color: colorChartsLineTick,
                      borderColor: colorChartsBlue1400,
                      borderWidth: 1,
                    },
                  ]
                : undefined,
            },
          ],
          yAxis: [
            {
              title: { text: "" },
            },
          ],
          tooltip: { enabled: false },
          plotOptions: {
            series: {
              point: {
                events: {
                  mouseOver(event) {
                    if (event.target instanceof Highcharts.Point) {
                      if (event.target instanceof Highcharts.Point) {
                        const minPoint = findMinPoint(event.target, getScatterChart().hc);
                        if (minPoint) {
                          getScatterChart().cloudscape.showTooltipOnPoint(minPoint);
                        }
                      }

                      if (zoomStateRef.current !== null) {
                        getNavigatorChart().hc.xAxis[0].removePlotLine("zoom-end");
                        getNavigatorChart().hc.xAxis[0].addPlotLine({
                          id: "zoom-end",
                          value: event.target.x,
                          ...Style.zoomPlotLine,
                        });
                      }
                    }
                  },
                  mouseOut() {
                    getScatterChart().cloudscape.hideTooltip();
                  },
                  click(event) {
                    if (zoomStateRef.current === null) {
                      getNavigatorChart().hc.xAxis[0].addPlotLine({
                        id: "zoom-start",
                        value: event.point.x,
                        ...Style.zoomPlotLine,
                      });
                      zoomStateRef.current = event.point.x;
                    } else {
                      getNavigatorChart().hc.xAxis[0].removePlotLine("zoom-start");
                      getNavigatorChart().hc.xAxis[0].removePlotLine("zoom-end");
                      setZoom([
                        Math.min(zoomStateRef.current, event.point.x),
                        Math.max(zoomStateRef.current, event.point.x),
                      ]);
                      zoomStateRef.current = null;
                    }
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
      if (minPoint === null || p.y! > minPoint.y!) {
        minPoint = p;
      }
    }
  }
  return minPoint;
}

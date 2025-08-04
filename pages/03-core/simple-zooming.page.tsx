// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import { omit } from "lodash";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { colorChartsBlue1400, colorChartsLineTick } from "@cloudscape-design/design-tokens";

import { CoreChartProps } from "../../lib/components/core/interfaces";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

interface ThisPageSettings extends PageSettings {
  keepZoomingFrame: boolean;
}

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

const dataA = baseline.map(({ x, y }) => ({ x, y }));
const dataB = baseline.map(({ x, y }) => ({ x, y: y + randomInt(-100000, 100000) }));
const dataC = baseline.map(({ x, y }) => ({ x, y: y + randomInt(-150000, 50000) }));
const dataD = baseline.map(({ x, y }) => ({ x, y: y + randomInt(-200000, -100000) }));
const dataE = baseline.map(({ x, y }) => ({ x, y: y + randomInt(50000, 75000) }));

const scatterSeries: Highcharts.SeriesOptionsType[] = [
  { name: "A", type: "scatter", data: dataA },
  { name: "B", type: "scatter", data: dataB },
  { name: "C", type: "scatter", data: dataC },
  { name: "D", type: "scatter", data: dataD },
  { name: "E", type: "scatter", data: dataE },
];

const navigatorSeries: Highcharts.SeriesOptionsType[] = [
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
  const {
    settings: { keepZoomingFrame = true },
    setSettings,
  } = useChartSettings<ThisPageSettings>();
  return (
    <Page
      title="Simple zooming demo"
      subtitle="This page shows how a secondary chart can be used as a zoom navigator."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "showLegend",
            "tooltipSize",
            "tooltipPlacement",
            {
              content: (
                <Checkbox
                  checked={keepZoomingFrame}
                  onChange={({ detail }) => setSettings({ keepZoomingFrame: detail.checked })}
                >
                  Keep zooming frame
                </Checkbox>
              ),
            },
          ]}
        />
      }
      screenshotArea={false}
    >
      <Charts />
    </Page>
  );
}

const Style = {
  zoomPlotLine: { color: colorChartsBlue1400, width: 2, zIndex: 5 },
};

function Charts() {
  const {
    settings: { keepZoomingFrame = true },
    chartProps,
  } = useChartSettings<ThisPageSettings>({ more: true });
  const commonProps = omit(chartProps.cartesian, ["ref"]);
  const scatterChartRef = useRef<CoreChartProps.ChartAPI>(null) as React.MutableRefObject<CoreChartProps.ChartAPI>;
  const getScatterChart = () => scatterChartRef.current!;
  const navigatorChartRef = useRef<CoreChartProps.ChartAPI>(null) as React.MutableRefObject<CoreChartProps.ChartAPI>;
  const getNavigatorChart = () => navigatorChartRef.current!;

  const [zoomRange, setZoomRange] = useState<null | [number, number]>(null);
  const zoomStateRef = useRef<null | number>(null);
  const setZoom = useCallback(
    (range: null | [number, number]) => {
      getScatterChart().chart.xAxis[0].setExtremes(range?.[0], range?.[1]);
      if (!keepZoomingFrame) {
        getNavigatorChart().chart.xAxis[0].setExtremes(range?.[0], range?.[1]);
      }
      setZoomRange(range);
    },
    [keepZoomingFrame],
  );
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.keyCode === KeyCode.escape) {
        getNavigatorChart().chart.xAxis[0].removePlotLine("zoom-start");
        getNavigatorChart().chart.xAxis[0].removePlotLine("zoom-end");
        zoomStateRef.current = null;
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const highlightedPoint = useRef<null | Highcharts.Point>(null);
  const onNavigationClick = useCallback(() => {
    const point = highlightedPoint.current;
    if (!point) {
      return;
    }
    if (zoomStateRef.current === null) {
      getNavigatorChart().chart.xAxis[0].addPlotLine({ id: "zoom-start", value: point.x, ...Style.zoomPlotLine });
      zoomStateRef.current = point.x;
    } else {
      getNavigatorChart().chart.xAxis[0].removePlotLine("zoom-start");
      getNavigatorChart().chart.xAxis[0].removePlotLine("zoom-end");
      setZoom([Math.min(zoomStateRef.current, point.x), Math.max(zoomStateRef.current, point.x)]);
      zoomStateRef.current = null;
    }
  }, [setZoom]);
  const onNavigationKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (event.keyCode === KeyCode.enter) {
        onNavigationClick();
      }
    },
    [onNavigationClick],
  );
  useEffect(() => {
    document.addEventListener("click", onNavigationClick);
    document.addEventListener("keydown", onNavigationKeydown);
    return () => {
      document.removeEventListener("click", onNavigationClick);
      document.removeEventListener("keydown", onNavigationKeydown);
    };
  }, [onNavigationClick, onNavigationKeydown]);

  const onScatterHighlight: CoreChartProps["onHighlight"] = ({ detail: { group, isApiCall } }) => {
    if (isApiCall) {
      return;
    }
    highlightChartGroup(group[0], getNavigatorChart());
    highlightedPoint.current = group[0];
  };
  const onScatterClearHighlight = ({ detail }: { detail: { isApiCall: boolean } }) => {
    if (detail.isApiCall) {
      return;
    }
    getScatterChart().clearChartHighlight();
    highlightedPoint.current = null;
  };
  const onNavigatorHighlight: CoreChartProps["onHighlight"] = ({ detail: { group, isApiCall } }) => {
    if (isApiCall) {
      return;
    }
    highlightChartGroup(group[0], getScatterChart());
    highlightedPoint.current = group[0];
  };
  const onNavigatorClearHighlight = ({ detail }: { detail: { isApiCall: boolean } }) => {
    if (detail.isApiCall) {
      return;
    }
    getScatterChart().clearChartHighlight();
    highlightedPoint.current = null;
  };

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

      <CoreChart
        callback={(chart) => {
          scatterChartRef.current = chart;
        }}
        {...commonProps}
        chartHeight={350}
        ariaLabel="Scatter chart"
        onHighlight={onScatterHighlight}
        onClearHighlight={onScatterClearHighlight}
        options={{
          series: scatterSeries,
          xAxis: [{ type: "datetime", title: { text: "" }, valueFormatter: dateFormatter }],
          yAxis: [{ title: { text: "Events" } }],
        }}
        navigator={
          <div style={{ marginTop: 24 }}>
            <CoreChart
              callback={(chart) => {
                navigatorChartRef.current = chart;
              }}
              {...commonProps}
              tooltip={{ enabled: false }}
              legend={{ enabled: false }}
              emphasizeBaseline={false}
              chartHeight={120}
              ariaLabel="Zoom navigator"
              verticalAxisTitlePlacement="side"
              onHighlight={onNavigatorHighlight}
              onClearHighlight={onNavigatorClearHighlight}
              options={{
                chart: {
                  zooming: { type: "x" },
                  events: {
                    selection(event) {
                      setZoom([event.xAxis[0].min, event.xAxis[0].max]);
                      return false;
                    },
                  },
                },
                series: navigatorSeries,
                xAxis: [
                  {
                    type: "datetime",
                    title: { text: "Time (UTC)" },
                    tickInterval: 1000 * 60 * 60 * 2,
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
                    valueFormatter: dateFormatter,
                  },
                ],
                yAxis: [{ title: { text: "" } }],
              }}
            />
          </div>
        }
      />
    </SpaceBetween>
  );
}

function highlightChartGroup(targetPoint: Highcharts.Point, api: CoreChartProps.ChartAPI) {
  const group: Highcharts.Point[] = [];
  for (const s of api.chart.series) {
    for (const p of s.data) {
      if (p.x === targetPoint.x) {
        group.push(p);
      }
    }
  }
  api.highlightChartGroup(group);
}

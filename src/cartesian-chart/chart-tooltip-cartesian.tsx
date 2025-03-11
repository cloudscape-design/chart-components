// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import { TooltipContent } from "../core/interfaces-core";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarkerStatus, ChartSeriesMarkerType } from "../internal/components/series-marker";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions, InternalSeriesOptions } from "./interfaces-cartesian";
import { getDataExtremes } from "./utils";
import { getCartesianDetailsItem } from "./utils";

export function useChartTooltipCartesian(
  getChart: () => null | Highcharts.Chart,
  props: {
    options: InternalCartesianChartOptions;
    tooltip?: CartesianChartProps.TooltipProps;
    series?: {
      getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
    };
  },
) {
  const { xAxis, series } = props.options;
  const [expandedSeries, setExpandedSeries] = useState<Record<string, Set<string>>>({});

  const getContent = (point: { x: number; y: number }): null | TooltipContent => {
    const chart = getChart();
    if (!chart) {
      console.warn("Chart instance is not available.");
      return null;
    }

    const matchedItems: CartesianChartProps.TooltipSeriesDetailItem[] = [];
    function findMatchedItem(series: InternalSeriesOptions) {
      if (series.type === "awsui-x-threshold" || series.type === "awsui-y-threshold") {
        return;
      }
      if ("data" in series && series.data && Array.isArray(series.data)) {
        for (let i = 0; i < series.data.length; i++) {
          const detail = getCartesianDetailsItem(i, series);
          if (detail.x === point.x) {
            matchedItems.push(detail);
          }
        }
      }
    }
    series.forEach((s) => findMatchedItem(s));

    function findMatchedXThreshold(series: CartesianChartProps.XThresholdSeries) {
      const proximity = series.proximity ?? 0;
      if (series.value - proximity <= point.x && point.x <= series.value + proximity) {
        matchedItems.push({ type: "threshold", x: series.value, series });
      }
    }
    series.forEach((s) => (s.type === "awsui-x-threshold" ? findMatchedXThreshold(s) : undefined));

    function findMatchedYThreshold(series: CartesianChartProps.YThresholdSeries) {
      matchedItems.push({ type: "point", x: point.x, y: series.value, series });
    }
    series.forEach((s) => (s.type === "awsui-y-threshold" ? findMatchedYThreshold(s) : undefined));

    const seriesToColor = new Map<InternalSeriesOptions, string>();
    for (const s of series) {
      const color = chart.series.find((cs) => (cs.userOptions.id ?? cs.name) === (s.id ?? s.name))?.color?.toString();
      if (color) {
        seriesToColor.set(s, color);
      }
    }
    const getItemColor = (item: CartesianChartProps.TooltipSeriesDetailItem) =>
      seriesToColor.get(item.series) ?? "black";

    const details: ChartSeriesDetailItem[] = [];

    for (const matched of matchedItems) {
      const yAxisProps = chart.yAxis[0];
      const valueFormatter = yAxisProps
        ? getDefaultFormatter(yAxisProps, getDataExtremes(chart.xAxis[0]))
        : (value: any) => value;

      let formatted: CartesianChartProps.TooltipSeriesFormatted = { key: "", value: "" };

      if (props.tooltip?.series) {
        formatted = props.tooltip.series(matched);
      } else if (matched.type === "point") {
        formatted = {
          key: matched.series.name,
          value: valueFormatter(matched.y),
        };
      } else if (matched.type === "range") {
        formatted = {
          key: matched.series.name,
          value: `${valueFormatter(matched.low)} : ${valueFormatter(matched.high)}`,
        };
      } else if (matched.type === "threshold") {
        formatted = {
          key: matched.series.name,
          value: null,
        };
      }

      details.push({
        key: formatted.key,
        value: formatted.value,
        markerType: getSeriesMarkerType(matched.series),
        markerStatus: props.series?.getItemStatus?.(matched.series.id ?? matched.series.name),
        color: getItemColor(matched),
        subItems: formatted.subItems,
        expandableId: formatted.expandable ? matched.series.name : undefined,
      });
    }

    const xAxisProps = xAxis[0];
    const titleFormatter = xAxisProps
      ? getDefaultFormatter(xAxisProps, getDataExtremes(chart.xAxis[0]))
      : (value: any) => value;

    const tooltipDetails = { x: point.x, items: matchedItems };

    const content = props.tooltip?.content?.(tooltipDetails) ?? (
      <ChartSeriesDetails
        details={details}
        expandedSeries={expandedSeries[point.x]}
        setExpandedState={(id, isExpanded) => {
          setExpandedSeries((oldState) => {
            const expandedSeriesInCurrentCoordinate = new Set(oldState[point.x]);
            if (isExpanded) {
              expandedSeriesInCurrentCoordinate.add(id);
            } else {
              expandedSeriesInCurrentCoordinate.delete(id);
            }
            return {
              ...oldState,
              [point.x]: expandedSeriesInCurrentCoordinate,
            };
          });
        }}
      />
    );

    const footer = props.tooltip?.footer?.(tooltipDetails);

    const body = content;

    return {
      title: props.tooltip?.title?.(tooltipDetails) ?? titleFormatter(point.x),
      body,
      footer,
    };
  };

  return { getContent };
}

function getSeriesMarkerType(series: CartesianChartProps.Series): ChartSeriesMarkerType {
  switch (series.type) {
    case "area":
    case "areaspline":
      return "hollow-rectangle";
    case "column":
      return "rectangle";
    case "line":
    case "spline":
      return "line";
    case "awsui-x-threshold":
    case "awsui-y-threshold":
      return "dashed";
    case "errorbar":
    case "scatter":
      return "circle";
  }
}

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

    const seriesToChartSeries = new Map<InternalSeriesOptions, Highcharts.Series>();
    for (const s of series) {
      const chartSeries = chart.series.find((cs) => (cs.userOptions.id ?? cs.name) === (s.id ?? s.name));
      if (chartSeries) {
        seriesToChartSeries.set(s, chartSeries);
      }
    }
    const getItemColor = (item: CartesianChartProps.TooltipSeriesDetailItem) =>
      seriesToChartSeries.get(item.series)?.color?.toString() ?? "black";

    const details: ChartSeriesDetailItem[] = [];

    for (const matched of matchedItems) {
      const chartSeries = seriesToChartSeries.get(matched.series);
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
        markerType: chartSeries ? getSeriesMarkerType(matched.series.type, chartSeries) : "circle",
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

    const content = props.tooltip?.body?.(tooltipDetails) ?? (
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
      header: props.tooltip?.header?.(tooltipDetails) ?? titleFormatter(point.x),
      body,
      footer,
    };
  };

  return { getContent };
}

function getSeriesMarkerType(
  seriesType: CartesianChartProps.Series["type"],
  series: Highcharts.Series,
): ChartSeriesMarkerType {
  const seriesSymbol = "symbol" in series && typeof series.symbol === "string" ? series.symbol : "circle";
  switch (seriesType) {
    case "area":
    case "areaspline":
      return "area";
    case "line":
    case "spline":
      return "line";
    case "awsui-x-threshold":
    case "awsui-y-threshold":
      return "dashed";
    case "scatter":
      switch (seriesSymbol) {
        case "square":
          return "square";
        case "diamond":
          return "diamond";
        case "triangle":
          return "triangle";
        case "triangle-down":
          return "triangle-down";
        case "circle":
        default:
          return "circle";
      }
    case "column":
    case "errorbar":
    default:
      return "large-circle";
  }
}

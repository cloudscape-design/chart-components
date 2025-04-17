// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import type Highcharts from "highcharts";

import { CloudscapeChartAPI, CoreTooltipProps, Target } from "../core/interfaces-core";
import { getSeriesId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions, InternalSeriesOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";
import { getDataExtremes } from "./utils";
import { getCartesianDetailsItem } from "./utils";

export function useChartTooltipCartesian(
  getAPI: () => CloudscapeChartAPI,
  props: {
    options: InternalCartesianChartOptions;
    tooltip?: CartesianChartProps.TooltipProps;
    series?: {
      getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
    };
  },
): CoreTooltipProps {
  const { xAxis, series } = props.options;
  const [expandedSeries, setExpandedSeries] = useState<Record<string, Set<string>>>({});
  const cursorRef = useRef<null | Highcharts.SVGElement>(null);

  const findMatchedItems = (point: Highcharts.Point) => {
    const matchedItems: CartesianChartProps.TooltipSeriesDetailItem[] = [];
    function findMatchedItem(series: InternalSeriesOptions) {
      if (series.type === "awsui-x-threshold" || series.type === "awsui-y-threshold") {
        return;
      }
      if ("data" in series && series.data && Array.isArray(series.data)) {
        for (let i = 0; i < series.data.length; i++) {
          const detail = getCartesianDetailsItem(i, series);
          if (detail?.x === point.x) {
            matchedItems.push(detail);
          }
        }
      }
    }
    series.forEach((s) => findMatchedItem(s));

    function findMatchedXThreshold(series: CartesianChartProps.XThresholdSeries) {
      if (series.value <= point.x && point.x <= series.value) {
        matchedItems.push({ type: "threshold", x: series.value, series });
      }
    }
    series.forEach((s) => (s.type === "awsui-x-threshold" ? findMatchedXThreshold(s) : undefined));

    function findMatchedYThreshold(series: CartesianChartProps.YThresholdSeries) {
      matchedItems.push({ type: "point", x: point.x, y: series.value, series });
    }
    series.forEach((s) => (s.type === "awsui-y-threshold" ? findMatchedYThreshold(s) : undefined));

    return matchedItems;
  };

  const getTooltipContent: CoreTooltipProps["getTooltipContent"] = ({ point }) => {
    const chart = getAPI().chart;

    const matchedItems = findMatchedItems(point);

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
        markerType: chartSeries ? getSeriesMarkerType(chartSeries) : "circle",
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

  const destroyCursor = () => {
    cursorRef.current?.destroy();
  };

  const createCursor = (target: Target) => {
    const chart = getAPI().chart;
    cursorRef.current?.destroy();
    cursorRef.current = chart.renderer
      .rect(target.x, chart.plotTop, 1, chart.plotHeight)
      .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
      .add();
  };

  const onPointHighlight: CoreTooltipProps["onPointHighlight"] = ({ point, target }) => {
    createCursor(target);

    if (props.options.series.some((s) => s.type === "column")) {
      for (const s of getAPI().chart.series) {
        if (s.type === "column") {
          for (const p of s.data) {
            if (p.x !== point.x) {
              p.setState("inactive");
            }
          }
        }
      }
      return null;
    }
    return { matchedLegendItems: [getSeriesId(point.series)] };
  };

  const onClearHighlight: CoreTooltipProps["onClearHighlight"] = () => {
    destroyCursor();

    if (props.options.series.some((s) => s.type === "column")) {
      for (const s of getAPI().chart.series) {
        s.setState("normal");
        for (const p of s.data) {
          p.setState("normal");
        }
      }
    }
  };

  return {
    getTooltipContent,
    onPointHighlight,
    onClearHighlight,
    size: props.tooltip?.size,
    placement: props.tooltip?.placement ?? "middle",
  };
}

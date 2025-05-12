// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import type Highcharts from "highcharts";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { CoreChartProps, Rect } from "../core/interfaces-core";
import { getOptionsId, getSeriesColor, getSeriesId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { getDefaultFormatter } from "./default-formatters";
import {
  CartesianChartProps,
  InternalCartesianChartOptions,
  InternalSeriesOptions,
  InternalTooltipMatchedItem,
} from "./interfaces-cartesian";
import * as Styles from "./styles";
import { getDataExtremes } from "./utils";

export function useChartTooltipCartesian(props: {
  options: InternalCartesianChartOptions;
  tooltip?: CartesianChartProps.TooltipOptions;
}): Partial<CoreChartProps> {
  const { xAxis, yAxis, series } = props.options;
  const [expandedSeries, setExpandedSeries] = useState<Record<string, Set<string>>>({});
  const cursorRef = useRef(new HighlightCursor());
  const chartRef = useRef<null | Highcharts.Chart>(null);

  const getTooltipContent: CoreChartProps["getTooltipContent"] = ({ point }) => {
    const chart = point.series.chart;

    const seriesToChartSeries = new Map<InternalSeriesOptions, Highcharts.Series>();
    for (const s of series) {
      const chartSeries = chart.series.find((cs) => getOptionsId(cs.userOptions) === getOptionsId(s));
      if (chartSeries) {
        seriesToChartSeries.set(s, chartSeries);
      }
    }
    const getSeriesMarker = (series: CartesianChartProps.SeriesOptions) => {
      const hcSeries = seriesToChartSeries.get(series);
      return <ChartSeriesMarker type={getSeriesMarkerType(hcSeries)} color={getSeriesColor(hcSeries)} />;
    };

    const matchedItemsInternal = findMatchedTooltipItems(point, series);
    const matchedItems: CartesianChartProps.TooltipMatchedItem[] = matchedItemsInternal.map((matchedItem) => {
      const series = matchedItem.series as CartesianChartProps.SeriesOptions;
      const marker = getSeriesMarker(series);
      switch (matchedItem.type) {
        case "all": {
          const marker = getSeriesMarker(series);
          return { type: "all", x: matchedItem.x, series, marker };
        }
        case "point":
          return { type: "point", x: matchedItem.x, y: matchedItem.y, series, marker };
        case "range":
          return { type: "range", x: matchedItem.x, low: matchedItem.low, high: matchedItem.high, series, marker };
      }
    });

    const detailItems: ChartSeriesDetailItem[] = matchedItems.map((item) => {
      const yAxisProps = yAxis[0];
      const valueFormatter = yAxisProps
        ? getDefaultFormatter(yAxisProps, getDataExtremes(chart.xAxis[0]))
        : (value: number) => value;

      const formatted: CartesianChartProps.TooltipSeriesFormatted = (() => {
        // Using consumer-defined details.
        if (props.tooltip?.series) {
          return props.tooltip.series({ item });
        }
        switch (item.type) {
          case "all":
            return { key: item.series.name, value: null };
          case "point":
            return { key: item.series.name, value: valueFormatter(item.y) };
          case "range":
            return { key: item.series.name, value: `${valueFormatter(item.low)} : ${valueFormatter(item.high)}` };
        }
      })();

      return {
        key: formatted.key,
        value: formatted.value,
        marker: item.marker,
        subItems: formatted.subItems,
        expandableId: formatted.expandable ? item.series.name : undefined,
      };
    });

    const xAxisProps = xAxis[0];
    const titleFormatter = xAxisProps
      ? getDefaultFormatter(xAxisProps, getDataExtremes(chart.xAxis[0]))
      : (value: number) => value;

    const slotRenderProps:
      | CartesianChartProps.TooltipHeaderRenderProps
      | CartesianChartProps.TooltipBodyRenderProps
      | CartesianChartProps.TooltipFooterRenderProps = {
      x: point.x,
      items: matchedItems,
    };

    return {
      header: props.tooltip?.header?.(slotRenderProps) ?? titleFormatter(point.x),
      body: props.tooltip?.body?.(slotRenderProps) ?? (
        <ChartSeriesDetails
          details={detailItems}
          expandedSeries={expandedSeries[point.x]}
          setExpandedState={(id, isExpanded) => {
            setExpandedSeries((oldState) => {
              const expandedSeriesInCurrentCoordinate = new Set(oldState[point.x]);
              if (isExpanded) {
                expandedSeriesInCurrentCoordinate.add(id);
              } else {
                expandedSeriesInCurrentCoordinate.delete(id);
              }
              return { ...oldState, [point.x]: expandedSeriesInCurrentCoordinate };
            });
          }}
        />
      ),
      footer: props.tooltip?.footer?.(slotRenderProps),
    };
  };

  const onPointHighlight: CoreChartProps["onPointHighlight"] = ({ point, target }) => {
    chartRef.current = point.series.chart;

    // Highcharts highlights the entire series when the cursor lands on it. However, for column series
    // we want only a single column be highlighted. This is achieved by issuing inactive state for all columns series
    // with coordinates not matched the highlighted one.
    if (props.options.series.some((s) => s.type === "column")) {
      for (const s of point.series.chart.series) {
        if (s.type === "column") {
          for (const p of s.data) {
            if (p.x !== point.x) {
              p.setState("inactive");
            }
          }
        }
      }
    }
    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    else {
      cursorRef.current.create(target, point.series.chart);
    }
  };

  const getMatchedLegendItems: CoreChartProps["getMatchedLegendItems"] = ({ point }) => {
    if (props.options.series.some((s) => s.type === "column")) {
      return props.options.series.map(getOptionsId);
    } else {
      return [getSeriesId(point.series)];
    }
  };

  const onClearHighlight: CoreChartProps["onClearHighlight"] = () => {
    cursorRef.current?.destroy();

    // Clear all column series point state overrides created in `onPointHighlight`.
    if (props.options.series.some((s) => s.type === "column")) {
      for (const s of chartRef.current?.series ?? []) {
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
    getMatchedLegendItems,
  };
}

class HighlightCursor {
  private instance: null | Highcharts.SVGElement = null;

  public create(target: Rect, chart: Highcharts.Chart) {
    this.instance?.destroy();
    if (chart.inverted) {
      this.instance = chart.renderer
        .rect(chart.plotLeft, target.y, chart.plotWidth, 1)
        .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
        .add();
    } else {
      this.instance = chart.renderer
        .rect(target.x, chart.plotTop, 1, chart.plotHeight)
        .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
        .add();
    }
  }

  public destroy() {
    this.instance?.destroy();
  }
}

export function findMatchedTooltipItems(point: Highcharts.Point, series: InternalSeriesOptions[]) {
  const matchedItems: InternalTooltipMatchedItem[] = [];
  function findMatchedItem(series: InternalSeriesOptions) {
    if (series.type === "x-threshold" || series.type === "y-threshold") {
      return;
    }
    if ("data" in series && series.data && Array.isArray(series.data)) {
      for (let i = 0; i < series.data.length; i++) {
        const detail = getMatchedTooltipItemForIndex(i, series);
        if (detail?.x === point.x) {
          matchedItems.push(detail);
        }
      }
    }
  }
  series.forEach((s) => findMatchedItem(s));

  function findMatchedXThreshold(series: CartesianChartProps.XThresholdSeriesOptions) {
    if (series.value <= point.x && point.x <= series.value) {
      matchedItems.push({ type: "all", x: series.value, series });
    }
  }
  series.forEach((s) => (s.type === "x-threshold" ? findMatchedXThreshold(s) : undefined));

  function findMatchedYThreshold(series: CartesianChartProps.YThresholdSeriesOptions) {
    matchedItems.push({ type: "point", x: point.x, y: series.value, series });
  }
  series.forEach((s) => (s.type === "y-threshold" ? findMatchedYThreshold(s) : undefined));

  return matchedItems;
}

function getMatchedTooltipItemForIndex(
  index: number,
  series: InternalSeriesOptions,
): null | InternalTooltipMatchedItem {
  const x = getSeriesXbyIndex(series, index);
  const y = getSeriesYbyIndex(series, index);
  if (x === null) {
    return null;
  }
  if (typeof y === "number") {
    return { type: "point", x: x, y, series };
  }
  if (Array.isArray(y)) {
    return { type: "range", x: x, low: y[0], high: y[1], series };
  }
  if (series.type === "y-threshold") {
    return { type: "all", x: x, series };
  }
  return null;
}

function getSeriesXbyIndex(series: InternalSeriesOptions, index: number): number | null {
  if (!("data" in series) || !Array.isArray(series.data)) {
    warnOnce("CartesianChart", "Series data cannot be parsed.");
    return null;
  }
  switch (series.type) {
    case "area":
    case "areaspline":
    case "column":
    case "line":
    case "scatter":
    case "spline": {
      const item = series.data[index];
      if (Array.isArray(item) && typeof item[0] === "number") {
        return item[0];
      }
      if (item && typeof item === "object" && !Array.isArray(item) && typeof item.x === "number") {
        return item.x;
      }
      return index;
    }
    case "errorbar": {
      const item = series.data[index];
      if (Array.isArray(item) && typeof item[0] === "number") {
        return item.length === 3 ? item[0] : index;
      }
      if (item && typeof item === "object" && !Array.isArray(item) && typeof item.x === "number") {
        return item.x ?? index;
      }
      return index;
    }
    default:
      return index;
  }
}

function getSeriesYbyIndex(series: InternalSeriesOptions, index: number): null | number | [number, number] {
  if (!("data" in series) || !Array.isArray(series.data)) {
    warnOnce("CartesianChart", "Series data cannot be parsed.");
    return null;
  }
  switch (series.type) {
    case "area":
    case "areaspline":
    case "column":
    case "line":
    case "scatter":
    case "spline": {
      const item = series.data[index];
      if (Array.isArray(item)) {
        return item[1];
      }
      if (typeof item === "number") {
        return item;
      }
      if (item && typeof item === "object") {
        return item.y ?? null;
      }
      return null;
    }
    case "errorbar": {
      const item = series.data[index];
      if (Array.isArray(item)) {
        const [low, high] = item.length === 2 ? [item[0], item[1]] : [item[1], item[2]];
        return typeof low === "number" ? [low, high] : null;
      }
      if (item && typeof item === "object") {
        const [low, high] = [item.low, item.high];
        return typeof low === "number" && typeof high === "number" ? [low, high] : null;
      }
      return null;
    }
    default:
      return null;
  }
}

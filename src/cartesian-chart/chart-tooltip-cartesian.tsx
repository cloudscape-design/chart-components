// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import type Highcharts from "highcharts";

import { CoreChartAPI, CoreTooltipOptions, Target } from "../core/interfaces-core";
import { getOptionsId, getSeriesId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions, InternalSeriesOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";
import { findMatchedTooltipItems, getDataExtremes } from "./utils";

export function useChartTooltipCartesian(
  getAPI: () => CoreChartAPI,
  props: {
    options: InternalCartesianChartOptions;
    tooltip?: CartesianChartProps.TooltipOptions;
  },
): CoreTooltipOptions {
  const { xAxis, series } = props.options;
  const [expandedSeries, setExpandedSeries] = useState<Record<string, Set<string>>>({});
  const cursorRef = useRef(new HighlightCursor());

  const getTooltipContent: CoreTooltipOptions["getTooltipContent"] = ({ point }) => {
    const chart = getAPI().chart;

    const seriesToChartSeries = new Map<InternalSeriesOptions, Highcharts.Series>();
    for (const s of series) {
      const chartSeries = chart.series.find((cs) => getOptionsId(cs.userOptions) === getOptionsId(s));
      if (chartSeries) {
        seriesToChartSeries.set(s, chartSeries);
      }
    }
    const getSeriesMarker = (series: CartesianChartProps.SeriesOptions) => {
      const hcSeries = seriesToChartSeries.get(series);
      const markerType = hcSeries ? getSeriesMarkerType(hcSeries) : "large-square";
      const markerColor = hcSeries?.color?.toString() ?? "black";
      return <ChartSeriesMarker type={markerType} color={markerColor} />;
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
      const yAxisProps = chart.yAxis[0];
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

  const destroyCursor = () => {
    cursorRef.current?.destroy();
  };

  const createCursor = (target: Target) => {
    cursorRef.current.create(target, getAPI().chart);
  };

  const onPointHighlight: CoreTooltipOptions["onPointHighlight"] = ({ point, target }) => {
    // Highcharts highlights the entire series when the cursor lands on it. However, for column series
    // we want only a single column be highlighted. This is achieved by issuing inactive state for all columns series
    // with coordinates not matched the highlighted one.
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
    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    else {
      createCursor(target);
    }

    return { matchedLegendItems: [getSeriesId(point.series)] };
  };

  const onClearHighlight: CoreTooltipOptions["onClearHighlight"] = () => {
    destroyCursor();

    // Clear all column series point state overrides created in `onPointHighlight`.
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

class HighlightCursor {
  private instance: null | Highcharts.SVGElement = null;

  public create(target: Target, chart: Highcharts.Chart) {
    this.instance?.destroy();
    this.instance = chart.renderer
      .rect(target.x, chart.plotTop, 1, chart.plotHeight)
      .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
      .add();
  }

  public destroy() {
    this.instance?.destroy();
  }
}

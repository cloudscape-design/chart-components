// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import type Highcharts from "highcharts";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";
import { colorBackgroundLayoutMain } from "@cloudscape-design/design-tokens";

import { CoreChartProps, Rect } from "../core/interfaces-core";
import { findMatchedPointsByX, getOptionsId, getSeriesColor, getSeriesId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { isXThreshold } from "./chart-series-cartesian";
import { getDefaultFormatter } from "./default-formatters";
import {
  CartesianChartProps,
  InternalCartesianChartOptions,
  InternalSeriesOptions,
  NonErrorBarSeriesOptions,
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

    const matchedItems = findTooltipSeriesItems(series, point);

    const detailItems: ChartSeriesDetailItem[] = matchedItems.flatMap((item) => {
      const yAxisProps = yAxis[0];
      const valueFormatter = yAxisProps
        ? getDefaultFormatter(yAxisProps, getDataExtremes(chart.xAxis[0]))
        : (value: number) => value;

      const formatted: CartesianChartProps.TooltipSeriesFormatted = (() => {
        // Using consumer-defined details.
        if (props.tooltip?.series) {
          return props.tooltip.series({ item });
        }
        return {
          key: item.series.name,
          value: item.y !== null ? valueFormatter(item.y) : null,
          details: item.error ? `${valueFormatter(item.error.low)} - ${valueFormatter(item.error.high)}` : null,
        };
      })();

      const items: ChartSeriesDetailItem[] = [];
      items.push({
        key: formatted.key,
        value: formatted.value,
        marker: getSeriesMarker(item.series),
        subItems: formatted.subItems,
        expandableId: formatted.expandable ? item.series.name : undefined,
        details: formatted.details,
      });
      return items;
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

  const onPointHighlight: CoreChartProps["onPointHighlight"] = ({ point, groupRect }) => {
    chartRef.current = point.series.chart;

    // Highcharts highlights the entire series when the cursor lands on it. However, for column series
    // we want only a single column be highlighted. This is achieved by issuing inactive state for all columns series
    // with coordinates not matched the highlighted one.
    if (props.options.series.some((s) => s.type === "column")) {
      for (const s of point.series.chart.series) {
        if (s.type === "column") {
          setTimeout(() => {
            s.setState("");
          }, 0);
          for (const p of s.data) {
            if (p.x !== point.x) {
              p.setState("inactive");
            }
          }
        }
      }
    }

    cursorRef.current.create(groupRect, point, !props.options.series.some((s) => s.type === "column"));
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
  };
}

function findTooltipSeriesItems(
  series: InternalSeriesOptions[],
  targetPoint: Highcharts.Point,
): CartesianChartProps.TooltipSeriesItem[] {
  // Points with the same x as the targetPoint across all currently visible series
  const matchedPoints = findMatchedPointsByX(targetPoint.series.chart.series, targetPoint.x);

  // For each series, create one new item that references it
  const seriesItems: CartesianChartProps.TooltipSeriesItem[] = series.map((s) => ({
    x: 0,
    y: null,
    series: s as unknown as NonErrorBarSeriesOptions,
  }));
  const seriesItemsById = new Map(seriesItems.map((i) => [getOptionsId(i.series), i]));
  const matchedItems = new Set<CartesianChartProps.TooltipSeriesItem>();

  for (const point of matchedPoints) {
    if (point.series.type === "errorbar") {
      // Error bar point found for this point
      const linkedSeries = point.series.linkedParent;
      if (linkedSeries) {
        const seriesItem = seriesItemsById.get(getSeriesId(linkedSeries));
        if (seriesItem) {
          addError(seriesItem, point);
          matchedItems.add(seriesItem);
        }
      } else {
        warnOnce(
          "CartesianChart",
          'Could not find the series that a series of type "errorbar" is linked to. ' +
            "The error range will not be displayed in the tooltip out of the box. " +
            'Make sure that the "linkedTo" property points to an existing series.',
        );
      }
    } else {
      const seriesItem = seriesItemsById.get(getSeriesId(point.series));
      if (seriesItem) {
        addY(seriesItem, point);
        matchedItems.add(seriesItem);
      }
    }
  }

  function addError(seriesItem: CartesianChartProps.TooltipSeriesItem, errorPoint: Highcharts.Point) {
    if (errorPoint.options.low !== undefined && errorPoint.options.high !== undefined) {
      seriesItem.error = { low: errorPoint.options.low, high: errorPoint.options.high };
    }
  }

  function addY(seriesItem: CartesianChartProps.TooltipSeriesItem, matchedPoint: Highcharts.Point) {
    if (isXThreshold(matchedPoint.series)) {
      seriesItem.x = matchedPoint.x;
      seriesItem.y = null;
    } else if (matchedPoint.y !== undefined) {
      seriesItem.x = matchedPoint.x;
      seriesItem.y = getClosestY(seriesItem, matchedPoint.y);
    }
  }

  function getClosestY(seriesItem: CartesianChartProps.TooltipSeriesItem, y: number) {
    if (seriesItem.y === null || targetPoint.y === undefined) {
      return y;
    }
    return Math.abs(seriesItem.y - targetPoint.y) < Math.abs(y - targetPoint.y) ? seriesItem.y : y;
  }

  return seriesItems.filter((item) => matchedItems.has(item));
}

class HighlightCursor {
  private refs: Highcharts.SVGElement[] = [];

  public create(target: Rect, point: Highcharts.Point, cursor = true) {
    this.destroy();

    const chart = point.series.chart;

    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    const matchedPoints = findMatchedPointsByX(chart.series, point.x).filter(
      (p) => !isXThreshold(p.series) && p.series.type !== "column" && p.series.type !== "errorbar",
    );
    const getPointStyle = (targetPoint: Highcharts.Point) =>
      targetPoint !== point
        ? { zIndex: 5, "stroke-width": 2, stroke: targetPoint.color, fill: colorBackgroundLayoutMain }
        : { zIndex: 6, "stroke-width": 2, stroke: targetPoint.color, fill: targetPoint.color };

    if (chart.inverted) {
      if (cursor) {
        this.refs.push(
          chart.renderer
            .rect(chart.plotLeft, target.y - target.width / 2, chart.plotWidth, 1)
            .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
            .add(),
        );
      }
      for (const p of matchedPoints) {
        if (p.plotX !== undefined && p.plotY !== undefined && p.series.type !== "scatter") {
          this.refs.push(
            chart.renderer
              .circle(chart.plotLeft + chart.plotWidth - p.plotY, chart.plotTop + chart.plotHeight - p.plotX, 4)
              .attr(getPointStyle(p))
              .add(),
          );
        }
      }
    } else {
      if (cursor) {
        this.refs.push(
          chart.renderer
            .rect(target.x + target.width / 2, chart.plotTop, 1, chart.plotHeight)
            .attr({ fill: Styles.colorChartCursor, zIndex: 5 })
            .add(),
        );
      }
      for (const p of matchedPoints) {
        if (p.plotX !== undefined && p.plotY !== undefined && p.series.type !== "scatter") {
          this.refs.push(
            chart.renderer
              .circle(chart.plotLeft + p.plotX, chart.plotTop + p.plotY, 4)
              .attr(getPointStyle(p))
              .add(),
          );
        }
      }
    }
  }

  public destroy() {
    this.refs.forEach((ref) => ref.destroy());
  }
}

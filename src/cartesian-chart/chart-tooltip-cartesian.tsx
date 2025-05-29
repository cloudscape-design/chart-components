// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import type Highcharts from "highcharts";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { getDefaultFormatter } from "../core/default-formatters";
import { CoreChartProps, InternalXAxisOptions, InternalYAxisOptions } from "../core/interfaces-core";
import {
  getDataExtremes,
  getOptionsId,
  getSeriesColor,
  getSeriesId,
  getSeriesMarkerType,
  isXThreshold,
} from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces-cartesian";

import styles from "./styles.css.js";

export function useChartTooltipCartesian(props: {
  tooltip?: CartesianChartProps.TooltipOptions;
}): Partial<CoreChartProps> {
  const [expandedSeries, setExpandedSeries] = useState<Record<string, Set<string>>>({});

  const getTooltipContent: CoreChartProps["getTooltipContent"] = ({ point, group }) => {
    const x = group[0]?.x;
    const chart = group[0]?.series.chart;
    if (chart === undefined || x === undefined) {
      return null;
    }

    const seriesToChartSeries = new Map<CartesianChartProps.SeriesOptions, Highcharts.Series>();
    for (const s of chart.series) {
      seriesToChartSeries.set(s.userOptions as any, s);
    }
    const getSeriesMarker = (series: Highcharts.Series) => {
      return <ChartSeriesMarker type={getSeriesMarkerType(series)} color={getSeriesColor(series)} />;
    };

    const matchedItems = findTooltipSeriesItems(chart.series, group);

    const detailItems: ChartSeriesDetailItem[] = matchedItems.flatMap((item) => {
      const yAxisProps = chart.yAxis[0].userOptions as InternalYAxisOptions;
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
          details: item.errorRanges.length ? (
            <div>
              {item.errorRanges.map((errorRange, index) => (
                <div key={index} className={styles["error-range"]}>
                  <span>{errorRange.series.name ? errorRange.series.name : ""}</span>
                  <span>
                    {valueFormatter(errorRange.low)} - {valueFormatter(errorRange.high)}
                  </span>
                </div>
              ))}
            </div>
          ) : null,
        };
      })();

      const items: ChartSeriesDetailItem[] = [];
      items.push({
        key: formatted.key,
        value: formatted.value,
        marker: getSeriesMarker(seriesToChartSeries.get(item.series)!),
        subItems: formatted.subItems,
        expandableId: formatted.expandable ? item.series.name : undefined,
        details: formatted.details,
        selected: item.x === point?.x && item.y === point?.y,
      });
      return items;
    });

    const xAxisProps = chart.xAxis[0].userOptions as InternalXAxisOptions;
    const titleFormatter = xAxisProps
      ? getDefaultFormatter(xAxisProps, getDataExtremes(chart.xAxis[0]))
      : (value: number) => value;

    const slotRenderProps:
      | CartesianChartProps.TooltipHeaderRenderProps
      | CartesianChartProps.TooltipBodyRenderProps
      | CartesianChartProps.TooltipFooterRenderProps = {
      x: x,
      items: matchedItems,
    };

    return {
      header: props.tooltip?.header?.(slotRenderProps) ?? titleFormatter(x),
      body: props.tooltip?.body?.(slotRenderProps) ?? (
        <ChartSeriesDetails
          details={detailItems}
          expandedSeries={expandedSeries[x]}
          setExpandedState={(id, isExpanded) => {
            setExpandedSeries((oldState) => {
              const expandedSeriesInCurrentCoordinate = new Set(oldState[x]);
              if (isExpanded) {
                expandedSeriesInCurrentCoordinate.add(id);
              } else {
                expandedSeriesInCurrentCoordinate.delete(id);
              }
              return { ...oldState, [x]: expandedSeriesInCurrentCoordinate };
            });
          }}
        />
      ),
      footer: props.tooltip?.footer?.(slotRenderProps),
    };
  };

  return {
    getTooltipContent,
  };
}

function findTooltipSeriesItems(
  series: Highcharts.Series[],
  group: Highcharts.Point[],
): CartesianChartProps.TooltipSeriesItem[] {
  const seriesToChartSeries = new Map<CartesianChartProps.SeriesOptions, Highcharts.Series>();
  for (const s of series) {
    seriesToChartSeries.set(s.userOptions as any, s);
  }
  const seriesOrder = series.reduce((d, s, i) => d.set(s, i), new Map<Highcharts.Series, number>());
  const getSeriesIndex = (s: CartesianChartProps.SeriesOptions) => {
    const series = seriesToChartSeries.get(s);
    return series ? (seriesOrder.get(series) ?? -1) : -1;
  };

  const seriesErrors = new Map<
    string,
    { low: number; high: number; series: CartesianChartProps.ErrorBarSeriesOptions }[]
  >();
  const matchedSeries = new Set<Highcharts.Series>();

  // We don't need the errorRanges at this point, they are added to each item on return further down.
  const matchedItems: Omit<CartesianChartProps.TooltipSeriesItem, "errorRanges">[] = [];

  for (const point of group) {
    if (point.series.type === "errorbar") {
      // Error bar point found for this point
      const linkedSeries = point.series.linkedParent;
      if (linkedSeries) {
        addError(getSeriesId(linkedSeries), point);
      } else {
        warnOnce(
          "CartesianChart",
          'Could not find the series that a series of type "errorbar" is linked to. ' +
            "The error range will not be displayed in the tooltip out of the box. " +
            'Make sure that the "linkedTo" property points to an existing series.',
        );
      }
    } else {
      getMatchedPoints(point).forEach(([x, y]) => {
        if (x !== null) {
          const seriesOptions = point.series.userOptions as NonErrorBarSeriesOptions;
          matchedItems.push({ x, y, series: seriesOptions });
        }
      });
    }
  }

  function addError(seriesId: string, errorPoint: Highcharts.Point) {
    const seriesOptions = errorPoint.series.userOptions as CartesianChartProps.ErrorBarSeriesOptions;
    if (errorPoint.options.low !== undefined && errorPoint.options.high !== undefined) {
      const errorRanges = seriesErrors.get(seriesId) ?? [];
      errorRanges.push({
        low: errorPoint.options.low,
        high: errorPoint.options.high,
        series: seriesOptions,
      });
      seriesErrors.set(seriesId, errorRanges);
    }
  }

  function getMatchedPoints(point: Highcharts.Point) {
    if (matchedSeries.has(point.series)) {
      return [];
    }
    matchedSeries.add(point.series);

    return isXThreshold(point.series)
      ? [[point.x, null]]
      : point.series.data
          .filter((d) => d.x === point.x)
          .map((d) => [d.x, d.y ?? null])
          .sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0));
  }

  return matchedItems
    .sort((i1, i2) => {
      const s1 = getSeriesIndex(i1.series) - getSeriesIndex(i2.series);
      return s1 || (i1.y ?? 0) - (i2.y ?? 0);
    })
    .map((item) => {
      const errorRanges = seriesErrors.get(getOptionsId(item.series)) ?? [];
      return {
        ...item,
        errorRanges: errorRanges.sort((i1, i2) => getSeriesIndex(i1.series) - getSeriesIndex(i2.series)),
      };
    });
}

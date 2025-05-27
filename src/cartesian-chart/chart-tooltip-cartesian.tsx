// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import type Highcharts from "highcharts";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { CoreChartProps, Rect } from "../core/interfaces-core";
import { getOptionsId, getSeriesColor, getSeriesId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails, { ChartSeriesDetailItem } from "../internal/components/series-details";
import { ChartSeriesMarker, renderMarker } from "../internal/components/series-marker";
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

  const getTooltipContent: CoreChartProps["getTooltipContent"] = ({ point, group }) => {
    const x = group[0]?.x;
    const chart = group[0]?.series.chart;
    if (chart === undefined || x === undefined) {
      return null;
    }

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

    const matchedItems = findTooltipSeriesItems(series, group);

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
          details: item.error
            ? (item.error.series.name ? `${item.error.series.name}: ` : "") +
              `${valueFormatter(item.error.low)} - ${valueFormatter(item.error.high)}`
            : null,
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
        selected: item.x === point?.x && item.y === point?.y,
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

  const onRenderTooltip: CoreChartProps["onRenderTooltip"] = ({ point, group, groupRect }) => {
    const x = group[0].x;
    const chart = group[0]?.series.chart;
    if (chart === undefined || x === undefined) {
      return;
    }

    chartRef.current = chart;

    cursorRef.current.create(groupRect, point, group, !props.options.series.some((s) => s.type === "column"));
  };

  const onClearHighlight: CoreChartProps["onClearHighlight"] = () => {
    cursorRef.current?.destroy();
  };

  return {
    getTooltipContent,
    onRenderTooltip,
    onClearHighlight,
  };
}

function findTooltipSeriesItems(
  series: InternalSeriesOptions[],
  group: Highcharts.Point[],
): CartesianChartProps.TooltipSeriesItem[] {
  const seriesDict = series.reduce((d, s) => d.set(getOptionsId(s), s), new Map<string, InternalSeriesOptions>());
  const getSeries = (seriesId: string) => seriesDict.get(seriesId) as InternalSeriesOptions;
  const seriesOrder = series.reduce((d, s, i) => d.set(s, i), new Map<InternalSeriesOptions, number>());
  const getSeriesIndex = (s: InternalSeriesOptions) => seriesOrder.get(s) ?? -1;

  const seriesErrors = new Map<
    string,
    { low: number; high: number; series: CartesianChartProps.ErrorBarSeriesOptions }
  >();
  const matchedSeries = new Set<Highcharts.Series>();
  const matchedItems: CartesianChartProps.TooltipSeriesItem[] = [];

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
        const series = getSeries(getSeriesId(point.series));
        if (series && x !== null) {
          matchedItems.push({ x, y, series: series as NonErrorBarSeriesOptions });
        }
      });
    }
  }

  function addError(seriesId: string, errorPoint: Highcharts.Point) {
    const errorSeries = errorPoint.series.options as null | CartesianChartProps.ErrorBarSeriesOptions;
    if (errorPoint.options.low !== undefined && errorPoint.options.high !== undefined && errorSeries) {
      seriesErrors.set(seriesId, { low: errorPoint.options.low, high: errorPoint.options.high, series: errorSeries });
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
    .map((item) => ({ ...item, error: seriesErrors.get(getOptionsId(item.series)) }));
}

class HighlightCursor {
  private refs: Highcharts.SVGElement[] = [];

  public create(target: Rect, point: null | Highcharts.Point, group: Highcharts.Point[], cursor = true) {
    this.destroy();

    const chart = group[0]?.series.chart;
    if (!chart) {
      return;
    }

    // The cursor (vertical or horizontal line to make the highlighted point better prominent) is only added for charts
    // that do not include "column" series. That is because the cursor is not necessary for columns, assuming the number of
    // x data points is not very high.
    if (cursor) {
      const cursorStyle = { fill: Styles.colorChartCursor, zIndex: 5, style: "pointer-events: none" };
      this.refs.push(
        chart.inverted
          ? chart.renderer
              .rect(chart.plotLeft, chart.plotTop + (target.y - 2 * target.height), chart.plotWidth, 1)
              .attr(cursorStyle)
              .add()
          : chart.renderer
              .rect(target.x + target.width / 2, chart.plotTop, 1, chart.plotHeight)
              .attr(cursorStyle)
              .add(),
      );
    }

    const matchedPoints = group.filter(
      (p) => !isXThreshold(p.series) && p.series.type !== "column" && p.series.type !== "errorbar",
    );

    for (const p of matchedPoints) {
      if (p.plotX !== undefined && p.plotY !== undefined) {
        this.refs.push(renderMarker(chart, p, p === point));
      }
    }
  }

  public destroy() {
    this.refs.forEach((ref) => ref.destroy());
  }
}

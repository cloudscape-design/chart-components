// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import type Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";
import Spinner from "@cloudscape-design/components/spinner";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { castArray } from "../internal/utils/utils";
import { ChartLegendMarkers, useLegendMarkers } from "./chart-legend-markers";
import { ChartLegendTooltip, useChartLegendTooltip } from "./chart-legend-tooltip";
import { ChartNoData, useNoData } from "./chart-no-data";
import { ChartTooltip, useChartTooltip } from "./chart-tooltip";
import { ChartNoDataProps, LegendMarkersProps, LegendTooltipProps, TooltipProps } from "./interfaces-core";
import * as Styles from "./styles";
import { getSeriesToIdMap } from "./utils";

export interface CloudscapeHighchartsProps {
  highcharts: null | typeof Highcharts;
  options: Highcharts.Options;
  tooltip?: TooltipProps;
  legendTooltip?: LegendTooltipProps;
  noData?: ChartNoDataProps;
  legendMarkers?: LegendMarkersProps;
  fallback?: React.ReactNode;
  callback?: (chart: Highcharts.Chart) => void;
  visibleSeries?: null | string[];
  onToggleVisibleSeries?: (nextVisibleSeries: string[]) => void;
  visibleItems?: null | string[];
  onToggleVisibleItems?: (nextVisibleItems: string[]) => void;
  className?: string;
}

/**
 * CloudscapeHighcharts is the core internal abstraction that accepts the entire set of Highcharts options along
 * with Cloudscape props to define custom tooltip, no-data, formatters, items visibility, and more.
 */
export function CloudscapeHighcharts({
  highcharts,
  options,
  tooltip: tooltipProps,
  legendTooltip: legendTooltipProps,
  noData: noDataProps,
  legendMarkers: legendMarkersProps,
  fallback = <Spinner />,
  callback,
  visibleSeries: visibleSeriesExternal,
  onToggleVisibleSeries,
  visibleItems: visibleItemsExternal,
  onToggleVisibleItems,
  className,
  ...rest
}: CloudscapeHighchartsProps) {
  // The chartRef holds the Highcharts.Chart instance and is expected to be available after the initial render.
  // The instance is used to get internal series and points detail, and run APIs such as series.setVisible() to
  // synchronize custom React state with Highcharts state.
  const chartRef = useRef<Highcharts.Chart>(null) as React.MutableRefObject<Highcharts.Chart>;
  const getChart = () => {
    /* c8 ignore next */
    if (!chartRef.current) {
      throw new Error("Invariant violation: chart instance is not available.");
    }
    return chartRef.current;
  };

  // Provides custom Cloudscape tooltip instead of Highcharts tooltip, when `props.tooltip` is present.
  // The custom tooltip provides Cloudscape styles and can be pinned.
  const tooltip = useChartTooltip(highcharts, getChart, tooltipProps);

  // Provides custom Cloudscape tooltip for legend items, when `props.legendTooltip` is present.
  const legendTooltip = useChartLegendTooltip(highcharts, getChart, legendTooltipProps);

  // Provides empty, no-match, loading, and error states handling, when `props.noData` is present.
  const noData = useNoData(highcharts, noDataProps);

  // Provides custom legend markers, when `props.legendMarkers` is present.
  // The custom markers ensure the markers are aligned between Cloudscape tooltip and Highcharts legend,
  // and offer additional customization such as warning states.
  const legendMarkers = useLegendMarkers(getChart, legendMarkersProps);

  // IDs or visible series. Unless provided explicitly, taking all series IDs by default.
  // When series ID is not given, series name is used instead.
  const visibleSeries = visibleSeriesExternal ?? (() => (options.series ?? []).map((s) => s.id ?? s.name ?? ""))();

  // IDs or visible series items. Unless provided explicitly, taking all items IDs by default.
  // When item ID is not given, item name is used instead.
  const visibleItems =
    visibleItemsExternal ??
    (() => {
      const allItems = (options.series ?? []).flatMap((s) => {
        const itemIds: string[] = [];
        if ("data" in s && Array.isArray(s.data)) {
          for (const dataItem of s.data) {
            if (dataItem && typeof dataItem === "object") {
              const id = "id" in dataItem && dataItem.id ? dataItem.id : undefined;
              const name = "name" in dataItem && dataItem.name ? dataItem.name : undefined;
              itemIds.push(id ?? name ?? "");
            }
          }
        }
        return itemIds;
      });
      return allItems;
    })();

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const visibleSeriesIndex = visibleSeries.join("::");
  const visibleItemsIndex = visibleItems.join("::");
  useEffect(() => {
    if (chartRef.current) {
      const visibleSeries = new Set(visibleSeriesIndex.split("::").filter(Boolean));
      const visibleItems = new Set(visibleItemsIndex.split("::").filter(Boolean));
      const mapping = getSeriesToIdMap(chartRef.current.series);
      for (const [seriesId, { series, data }] of mapping) {
        series.setVisible(visibleSeries.has(seriesId));
        for (const [itemId, item] of data) {
          if ("setVisible" in item) {
            item.setVisible(visibleItems.has(itemId));
          }
        }
      }
    }
  }, [chartRef, options.series, visibleSeriesIndex, visibleItemsIndex]);

  // The Highcharts options takes all provided Highcharts options and custom properties and merges them together, so that
  // the Cloudscape features and custom Highcharts extensions can co-exist.
  // For certain options we provide Cloudscape styling, but in all cases this can be explicitly overridden.
  const legendLabelFormatter =
    options.legend?.labelFormatter ?? (legendMarkersProps ? legendMarkers.options.legend?.labelFormatter : undefined);
  const highchartsOptions: Highcharts.Options = {
    ...options,
    // Credits label is disabled by default, but can be set explicitly.
    credits: { enabled: false, ...options.credits },
    // Title text is disabled by default, but can be set explicitly.
    title: { text: "", ...options.title },
    // Using default Cloudscape colors unless explicit colors are given.
    colors: options.colors ?? Styles.colors,
    series: options.series,
    legend: {
      ...options.legend,
      title: { style: Styles.legendTitleCss, ...options.legend?.title },
      itemStyle: options.legend?.itemStyle ?? Styles.legendItemCss,
      backgroundColor: options.legend?.backgroundColor ?? Styles.legendBackgroundColor,
      ...(legendLabelFormatter ? { labelFormatter: legendLabelFormatter } : {}),
      symbolPadding: options.legend?.symbolPadding ?? Styles.legendSymbolPadding,
      // We override legend events to trigger visibility callbacks if controllable series/items visibility API is used.
      // If the event callbacks are present in the given options - we execute them, too.
      events: {
        ...options.legend?.events,
        itemClick(event) {
          const result = options.legend?.events?.itemClick?.call(this, event) as any;
          if (result === false) {
            return;
          }

          // Handle series visibility.
          if (visibleSeriesExternal !== undefined && highcharts && event.legendItem instanceof highcharts.Series) {
            const seriesId = event.legendItem.userOptions?.id ?? event.legendItem.userOptions.name;
            const visible = event.legendItem.visible;
            if (seriesId) {
              const nextVisible = !visible;
              const nextVisibleSeries = nextVisible
                ? [...visibleSeries, seriesId]
                : visibleSeries.filter((s) => s !== seriesId);
              onToggleVisibleSeries?.(nextVisibleSeries);
              return false;
            }
          }

          // Handle items visibility (e.g. pie segments or treemap values).
          if (visibleItemsExternal !== undefined && highcharts && event.legendItem instanceof highcharts.Point) {
            const itemId = event.legendItem.options?.id ?? event.legendItem.options.name;
            const visible = event.legendItem.visible;
            if (itemId) {
              const nextVisible = !visible;
              const nextVisibleItems = nextVisible
                ? [...visibleItems, itemId]
                : visibleItems.filter((s) => s !== itemId);
              onToggleVisibleItems?.(nextVisibleItems);
              return false;
            }
          }
        },
      },
    },
    // We override noData options if Cloudscape noData props is used instead.
    noData: noDataProps ? noData.options.noData : options.noData,
    lang: {
      ...options.lang,
      noData: noDataProps ? noData.options.lang?.noData : options.lang?.noData,
    },
    accessibility: {
      ...options.accessibility,
      keyboardNavigation: {
        ...options.accessibility?.keyboardNavigation,
        focusBorder: {
          style: Styles.focusBorderCss,
          ...options.accessibility?.keyboardNavigation?.focusBorder,
        },
      },
    },
    chart: {
      ...options.chart,
      displayErrors: options.chart?.displayErrors ?? isDevelopment,
      style: options.chart?.style ?? Styles.chartPlotCss,
      backgroundColor: options.chart?.backgroundColor ?? Styles.chartPlotBackgroundColor,
      // We override chart events to add custom noData and tooltip behaviors.
      // If the event callbacks are present in the given options - we execute them, too.
      events: {
        ...options.chart?.events,
        load() {
          const visibleSeries = new Set(visibleSeriesIndex.split("::").filter(Boolean));
          const visibleItems = new Set(visibleItemsIndex.split("::").filter(Boolean));
          const mapping = getSeriesToIdMap(getChart().series);
          for (const [seriesId, { series, data }] of mapping) {
            series.setVisible(visibleSeries.has(seriesId));
            for (const [itemId, item] of data) {
              if ("setVisible" in item) {
                item.setVisible(visibleItems.has(itemId));
              }
            }
          }
        },
        render(event) {
          if (noDataProps) {
            noData.options.chart?.events?.render?.call(this, event);
          }
          if (legendTooltipProps) {
            legendTooltip.options.chart?.events?.render?.call(this, event);
          }
          return options.chart?.events?.render?.call(this, event);
        },
        click(event) {
          if (tooltipProps) {
            tooltip.options.chart?.events?.click?.call(this, event);
          }
          return options.chart?.events?.click?.call(this, event);
        },
      },
    },
    plotOptions: {
      ...options.plotOptions,
      series: {
        ...options.plotOptions?.series,
        dataLabels: { style: Styles.seriesDataLabelsCss, ...options.plotOptions?.series?.dataLabels },
        states: {
          ...options.plotOptions?.series?.states,
          inactive: {
            opacity: Styles.seriesOpacityInactive,
            ...options.plotOptions?.series?.states?.inactive,
          },
        },
        // We override point events to add custom tooltip behaviors.
        // If the event callbacks are present in the given options - we execute them, too.
        point: {
          ...options.plotOptions?.series?.point,
          events: {
            ...options.plotOptions?.series?.point?.events,
            mouseOver(event) {
              if (tooltipProps) {
                tooltip.options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
              }
              return options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
            },
            mouseOut(event) {
              if (tooltipProps) {
                tooltip.options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
              }
              return options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
            },
            click(event) {
              if (tooltipProps) {
                tooltip.options.plotOptions?.series?.point?.events?.click?.call(this, event);
              }
              return options.plotOptions?.series?.point?.events?.click?.call(this, event);
            },
          },
        },
        borderColor: Styles.seriesBorderColor,
      },
    },
    xAxis: castArray(options.xAxis)?.map((xAxis) => ({
      ...Styles.xAxisOptions,
      ...xAxis,
      title: { style: Styles.axisTitleCss, ...xAxis.title },
      labels: { style: Styles.axisLabelsCss, ...xAxis.labels },
    })),
    yAxis: castArray(options.yAxis)?.map((yAxis) => ({
      ...Styles.yAxisOptions,
      ...yAxis,
      title: { style: Styles.axisTitleCss, ...yAxis.title },
      labels: { style: Styles.axisLabelsCss, ...yAxis.labels },
    })),
    tooltip: { enabled: !tooltipProps, ...options.tooltip },
  };

  if (!highcharts) {
    return (
      <div {...getDataAttributes(rest)} className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div {...getDataAttributes(rest)} className={className}>
      <HighchartsReact
        highcharts={highcharts}
        options={highchartsOptions}
        callback={(chart: Highcharts.Chart) => {
          chartRef.current = chart;
          callback?.(chart);
        }}
      />

      {tooltipProps && <ChartTooltip {...tooltip.props} />}

      {legendTooltipProps && <ChartLegendTooltip {...legendTooltip.props} />}

      {noDataProps && <ChartNoData {...noData.props} />}

      {legendMarkersProps && <ChartLegendMarkers {...legendMarkers.props} />}
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import type Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";
import Spinner from "@cloudscape-design/components/spinner";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { castArray } from "../internal/utils/utils";
import { useChartAxes } from "./chart-axes";
import { ChartContainer } from "./chart-container";
import { useLegend } from "./chart-legend";
import { useNoData } from "./chart-no-data";
import { useChartSeries } from "./chart-series";
import { useChartTooltip } from "./chart-tooltip";
import { ChartFilter, ChartLegend, ChartNoData, ChartSlot, ChartTooltip, VerticalAxisTitle } from "./components";
import { CoreChartProps } from "./interfaces-core";
import * as Styles from "./styles";
import { resetColorCounter } from "./utils";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

/**
 * CoreChart is the core internal abstraction that accepts the entire set of Highcharts options along
 * with Cloudscape props to define custom tooltip, no-data, formatters, items visibility, and more.
 */
export function CoreChart({
  options,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
  tooltip: tooltipProps,
  noData: noDataProps,
  legend: legendProps,
  fallback = <Spinner />,
  callback,
  hiddenItems,
  onItemVisibilityChange,
  verticalAxisTitlePlacement = "top",
  i18nStrings,
  className,
  header,
  footer,
  filter,
  ...rest
}: CoreChartProps) {
  const highcharts = rest.highcharts as null | typeof Highcharts;

  // Provides custom legend, when `props.legend` is present.
  const isLegendEnabled = legendProps?.enabled !== false;
  const legend = useLegend();

  // Provides custom Cloudscape tooltip instead of Highcharts tooltip, when `props.tooltip` is present.
  // The custom tooltip provides Cloudscape styles and can be pinned.
  const isTooltipEnabled = tooltipProps?.enabled !== false;
  const tooltip = useChartTooltip({ ...tooltipProps, legendAPI: legend.api });

  // Provides empty, no-match, loading, and error states handling, when `props.noData` is present.
  const noData = useNoData();

  // Provides support for controlled series/points visibility.
  const series = useChartSeries({ hiddenItems });

  // Provides support for customized vertical axis title placement.
  const axes = useChartAxes({ inverted: !!options.chart?.inverted, verticalAxisTitlePlacement });

  const rootClassName = clsx(styles.root, fitHeight && styles["root-fit-height"], className);

  if (!highcharts) {
    return (
      <div {...getDataAttributes(rest)} className={rootClassName}>
        <ChartContainer
          fitHeight={fitHeight}
          chartMinHeight={chartMinHeight}
          chartMinWidth={chartMinWidth}
          chart={(height) => (
            <div className={testClasses.fallback} style={{ minHeight: height ?? undefined }}>
              {fallback}
            </div>
          )}
        />
      </div>
    );
  }

  function withMinHeight(height: number | string | undefined | null) {
    return typeof height === "number" ? Math.max(chartMinHeight ?? 0, height) : height;
  }

  return (
    <div {...getDataAttributes(rest)} className={rootClassName}>
      <ChartContainer
        fitHeight={fitHeight}
        chartMinHeight={chartMinHeight}
        chartMinWidth={chartMinWidth}
        chart={(height) => {
          if (fitHeight && height === null) {
            return null;
          }

          // The Highcharts options takes all provided Highcharts options and custom properties and merges them together, so that
          // the Cloudscape features and custom Highcharts extensions can co-exist.
          // For certain options we provide Cloudscape styling, but in all cases this can be explicitly overridden.
          const highchartsOptions: Highcharts.Options = {
            ...options,
            // Credits label is disabled by default, but can be set explicitly.
            credits: { enabled: false, ...options.credits },
            // Title text is disabled by default, but can be set explicitly.
            title: { text: "", ...options.title },
            // Using default Cloudscape colors unless explicit colors are given.
            colors: options.colors ?? Styles.colors,
            chart: {
              ...Styles.chart,
              ...options.chart,
              height: fitHeight ? height : withMinHeight(options.chart?.height),
              displayErrors: options.chart?.displayErrors ?? isDevelopment,
              style: options.chart?.style ?? Styles.chartPlotCss,
              backgroundColor: options.chart?.backgroundColor ?? Styles.chartPlotBackgroundColor,
              // We override chart events to add custom noData and tooltip behaviors.
              // If the event callbacks are present in the given options - we execute them, too.
              events: {
                ...options.chart?.events,
                render(event) {
                  if (highcharts && event.target instanceof highcharts.Chart) {
                    resetColorCounter(event.target, options.series?.length ?? 0);
                  }
                  if (tooltipProps) {
                    tooltip.options.onRenderChart.call(this, event);
                  }
                  if (noDataProps) {
                    noData.options.onChartRender.call(this, event);
                  }
                  if (isLegendEnabled) {
                    legend.options.onChartRender.call(this, event);
                  }
                  if (verticalAxisTitlePlacement === "top") {
                    axes.options.chartRender.call(this, event);
                  }
                  return options.chart?.events?.render?.call(this, event);
                },
                click(event) {
                  if (isTooltipEnabled) {
                    tooltip.options.onChartClick.call(this, event);
                  }
                  return options.chart?.events?.click?.call(this, event);
                },
              },
            },
            series: options.series,
            legend: { enabled: false, ...options.legend },
            // We override noData options if Cloudscape noData props is used instead.
            noData: noDataProps ? noData.options.noData : options.noData,
            lang: {
              ...options.lang,
              noData: noDataProps ? noData.options.langNoData : options.lang?.noData,
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
            plotOptions: {
              ...options.plotOptions,
              series: {
                borderColor: Styles.seriesBorderColor,
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
                      if (isTooltipEnabled) {
                        tooltip.options.onSeriesPointMouseOver.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
                    },
                    mouseOut(event) {
                      if (isTooltipEnabled) {
                        tooltip.options.onSeriesPointMouseOut.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
                    },
                    click(event) {
                      if (isTooltipEnabled) {
                        tooltip.options.onSeriesPointClick.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.click?.call(this, event);
                    },
                  },
                },
              },
              area: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.area,
              },
              areaspline: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.areaspline,
              },
              column: {
                groupPadding: Styles.columnGroupPadding,
                borderRadius: Styles.columnBorderRadius,
                borderWidth: Styles.columnBorderWidth,
                ...options.plotOptions?.column,
              },
            },
            xAxis: castArray(options.xAxis)?.map((xAxis) => ({
              ...Styles.xAxisOptions,
              ...xAxis,
              title: {
                ...axes.options.xAxisTitle,
                ...xAxis.title,
              },
              labels: { style: Styles.axisLabelsCss, ...xAxis.labels },
            })),
            yAxis: castArray(options.yAxis)?.map((yAxis) => ({
              ...Styles.yAxisOptions,
              ...yAxis,
              title: {
                ...axes.options.yAxisTitle,
                ...yAxis.title,
              },
              labels: { style: Styles.axisLabelsCss, ...yAxis.labels },
            })),
            tooltip: { enabled: false, ...options.tooltip },
          };
          return (
            <HighchartsReact
              highcharts={highcharts}
              options={highchartsOptions}
              callback={(chart: Highcharts.Chart) => {
                callback?.({
                  chart,
                  highcharts: highcharts as typeof Highcharts,
                  showTooltipOnPoint: (point) => tooltip.api.showTooltipOnPoint(point),
                  hideTooltip: () => tooltip.api.hideTooltip(),
                  registerLegend: (ref) => legend.api.registerLegend(ref),
                  unregisterLegend: () => legend.api.unregisterLegend(),
                });
                series.onChartReady(chart);
              }}
            />
          );
        }}
        legend={
          isLegendEnabled ? (
            <ChartLegend
              {...legendProps}
              onItemVisibilityChange={onItemVisibilityChange}
              legendAPI={legend.api}
              seriesAPI={series.api}
            />
          ) : null
        }
        title={
          verticalAxisTitlePlacement === "top" ? (
            <VerticalAxisTitle verticalAxisTitlePlacement={verticalAxisTitlePlacement} axesAPI={axes.api} />
          ) : null
        }
        header={header ? <ChartSlot legendAPI={legend.api} {...header} /> : null}
        footer={footer ? <ChartSlot legendAPI={legend.api} {...footer} /> : null}
        seriesFilter={
          filter?.seriesFilter ? (
            <ChartFilter
              legendAPI={legend.api}
              onChange={(nextHiddenItems) => onItemVisibilityChange?.(nextHiddenItems)}
            />
          ) : null
        }
        additionalFilters={filter?.additionalFilters}
      />

      {isTooltipEnabled && <ChartTooltip {...tooltipProps} tooltipAPI={tooltip.api} />}

      {noDataProps && <ChartNoData {...noDataProps} i18nStrings={i18nStrings} noDataAPI={noData.api} />}
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef } from "react";
import clsx from "clsx";
import type Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import Spinner from "@cloudscape-design/components/spinner";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { castArray } from "../internal/utils/utils";
import { ChartContainer } from "./chart-container";
import { ChartLegend, useLegend } from "./chart-legend";
import { ChartNoData, useNoData } from "./chart-no-data";
import { useChartSeries } from "./chart-series";
import { ChartTooltip, useChartTooltip } from "./chart-tooltip";
import { CloudscapeChartAPI, CloudscapeHighchartsProps } from "./interfaces-core";
import * as Styles from "./styles";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

/**
 * CloudscapeHighcharts is the core internal abstraction that accepts the entire set of Highcharts options along
 * with Cloudscape props to define custom tooltip, no-data, formatters, items visibility, and more.
 */
export function CloudscapeHighcharts({
  highcharts,
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
  onLegendPlacementChange,
  verticalAxisTitlePlacement = "top",
  i18nStrings,
  className,
  ...rest
}: CloudscapeHighchartsProps) {
  // The apiRef is expected to be available after the initial render.
  // The instance is used to get internal series and points detail, and run APIs such as series.setVisible() to
  // synchronize custom React state with Highcharts state.
  const apiRef = useRef<CloudscapeChartAPI>(null) as React.MutableRefObject<CloudscapeChartAPI>;
  const getAPI = useCallback(() => {
    /* c8 ignore next */
    if (!apiRef.current) {
      throw new Error("Invariant violation: chart api is not available.");
    }
    return apiRef.current;
  }, []);

  // Provides custom Cloudscape tooltip instead of Highcharts tooltip, when `props.tooltip` is present.
  // The custom tooltip provides Cloudscape styles and can be pinned.
  const isTooltipEnabled = tooltipProps?.enabled !== false;
  const tooltip = useChartTooltip(getAPI, tooltipProps);

  // Provides custom legend, when `props.legend` is present.
  const isLegendEnabled = legendProps?.enabled !== false;
  const legend = useLegend(getAPI, { ...legendProps, onItemVisibilityChange, onLegendPlacementChange });

  // Provides empty, no-match, loading, and error states handling, when `props.noData` is present.
  const noData = useNoData(getAPI, noDataProps);

  const series = useChartSeries(getAPI, { options, hiddenItems });

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
          legend={null}
        ></ChartContainer>
      </div>
    );
  }

  function withMinHeight(height: number | string | undefined | null) {
    return typeof height === "number" ? Math.max(chartMinHeight ?? 0, height) : height;
  }

  let titles: string[] = [];
  if (options.chart?.inverted && verticalAxisTitlePlacement === "top") {
    titles = (castArray(options.xAxis) ?? []).map((axis) => axis.title?.text ?? "").filter(Boolean);
  }
  if (!options.chart?.inverted && verticalAxisTitlePlacement === "top") {
    titles = (castArray(options.yAxis) ?? []).map((axis) => axis.title?.text ?? "").filter(Boolean);
  }
  const verticalAxisTitle =
    titles.length > 0 ? (
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        {titles.map((text, index) => (
          <Box key={index} fontWeight="bold" margin={{ bottom: "xxs" }}>
            {text}
          </Box>
        ))}
      </div>
    ) : null;

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
                  if (noDataProps) {
                    noData.options.chartRender.call(this, event);
                  }
                  if (isLegendEnabled) {
                    legend.options.onChartRender();
                  }
                  return options.chart?.events?.render?.call(this, event);
                },
                click(event) {
                  if (isTooltipEnabled) {
                    tooltip.options.chartClick.call(this, event);
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
                        tooltip.options.seriesPointMouseOver.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
                    },
                    mouseOut(event) {
                      if (isTooltipEnabled) {
                        tooltip.options.seriesPointMouseOut.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
                    },
                    click(event) {
                      if (isTooltipEnabled) {
                        tooltip.options.seriesPointClick.call(this, event);
                      }
                      return options.plotOptions?.series?.point?.events?.click?.call(this, event);
                    },
                  },
                },
              },
            },
            xAxis: castArray(options.xAxis)?.map((xAxis) => ({
              ...Styles.xAxisOptions,
              ...xAxis,
              title: {
                style: {
                  ...Styles.axisTitleCss,
                  opacity: options.chart?.inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
                },
                ...xAxis.title,
                text: options.chart?.inverted && verticalAxisTitlePlacement === "top" ? "" : xAxis.title?.text,
                reserveSpace: options.chart?.inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
              },
              labels: { style: Styles.axisLabelsCss, ...xAxis.labels },
            })),
            yAxis: castArray(options.yAxis)?.map((yAxis) => ({
              ...Styles.yAxisOptions,
              ...yAxis,
              title: {
                style: {
                  ...Styles.axisTitleCss,
                  opacity: !options.chart?.inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
                },
                ...yAxis.title,
                reserveSpace: !options.chart?.inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
              },
              labels: { style: Styles.axisLabelsCss, ...yAxis.labels },
            })),
            tooltip: options.tooltip ? options.tooltip : series.options.tooltip,
          };
          return (
            <HighchartsReact
              highcharts={highcharts}
              options={highchartsOptions}
              callback={(chart: Highcharts.Chart) => {
                apiRef.current = {
                  chart,
                  highcharts: highcharts as typeof Highcharts,
                  showTooltipOnPoint: (point) => tooltip.api.showTooltipOnPoint(point),
                  hideTooltip: () => tooltip.api.hideTooltip(),
                };
                callback?.(apiRef.current);
                series.onChartReady();
              }}
            />
          );
        }}
        legend={isLegendEnabled ? <ChartLegend {...legend.props} /> : null}
        legendPlacement={legendProps?.placement}
        title={verticalAxisTitle}
      />

      {isTooltipEnabled && <ChartTooltip {...tooltip.props} />}

      {noDataProps && <ChartNoData {...noData.props} i18nStrings={i18nStrings} />}
    </div>
  );
}

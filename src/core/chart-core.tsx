// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import clsx from "clsx";
import type Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { getIsRtl, useMergeRefs } from "@cloudscape-design/component-toolkit/internal";
import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";
import Spinner from "@cloudscape-design/components/spinner";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { castArray } from "../internal/utils/utils";
import { useChartAPI } from "./chart-api";
import { ChartContainer } from "./chart-container";
import {
  ChartApplication,
  ChartFilter,
  ChartFooter,
  ChartHeader,
  ChartLegend,
  ChartNoData,
  ChartTooltip,
  VerticalAxisTitle,
} from "./components";
import { CoreChartProps } from "./interfaces-core";
import * as Styles from "./styles";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

/**
 * CoreChart is the core internal abstraction that accepts the entire set of Highcharts options along
 * with Cloudscape props to define custom tooltip, no-data, formatters, items visibility, and more.
 */
export function InternalCoreChart({
  options,
  fitHeight,
  chartHeight,
  chartMinHeight,
  chartMinWidth,
  tooltip: tooltipOptions,
  noData: noDataOptions,
  legend: legendOptions,
  fallback = <Spinner />,
  callback,
  verticalAxisTitlePlacement = "side",
  i18nStrings,
  className,
  header,
  footer,
  filter,
  keyboardNavigation = true,
  __internalRootRef,
  ...rest
}: CoreChartProps & InternalBaseComponentProps) {
  const highcharts = rest.highcharts as null | typeof Highcharts;

  const isLegendEnabled = legendOptions?.enabled !== false;
  const isTooltipEnabled = tooltipOptions?.enabled !== false;
  const api = useChartAPI({ ...rest, isTooltipEnabled, keyboardNavigation });

  const rootClassName = clsx(styles.root, fitHeight && styles["root-fit-height"], className);

  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useMergeRefs(containerRef, __internalRootRef);
  const isRtl = () => getIsRtl(containerRef?.current);

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

  function withMinHeight(height: number | string | undefined | null, heightOffset: number) {
    if (height === undefined) {
      return chartMinHeight;
    }
    if (typeof height === "number") {
      return Math.max(chartMinHeight ?? 0, height) - heightOffset;
    }
    return height;
  }

  const inverted = options.chart?.inverted;
  return (
    <div ref={rootRef} {...getDataAttributes(rest)} className={rootClassName}>
      <ChartContainer
        fitHeight={fitHeight}
        chartMinHeight={chartMinHeight}
        chartMinWidth={chartMinWidth}
        chart={(height) => {
          const verticalTitleOffset = Styles.verticalAxisTitleBlockSize + Styles.verticalAxisTitleMargin;
          const heightOffset = verticalAxisTitlePlacement === "top" ? verticalTitleOffset : 0;

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
              animation: false,
              ...Styles.chart,
              ...options.chart,
              className: clsx(testClasses["chart-plot"], options.chart?.className),
              height: fitHeight
                ? height - heightOffset
                : withMinHeight(chartHeight ?? options.chart?.height, heightOffset),
              displayErrors: options.chart?.displayErrors ?? isDevelopment,
              style: options.chart?.style ?? Styles.chartPlotCss,
              backgroundColor: options.chart?.backgroundColor ?? Styles.chartPlotBackgroundColor,
              // We override chart events to add custom noData and tooltip behaviors.
              // If the event callbacks are present in the given options - we execute them, too.
              events: {
                ...options.chart?.events,
                load(event) {
                  api.options.onChartLoad.call(this, event);
                  return options.chart?.events?.load?.call(this, event);
                },
                render(event) {
                  api.options.onChartRender.call(this, event);
                  return options.chart?.events?.render?.call(this, event);
                },
                click(event) {
                  api.options.onChartClick.call(this, event);
                  return options.chart?.events?.click?.call(this, event);
                },
              },
            },
            series: options.series,
            legend: { enabled: false, ...options.legend },
            // We override noData options if Cloudscape noData props is used instead.
            noData: noDataOptions ? api.options.noData : options.noData,
            lang: {
              ...options.lang,
              noData: noDataOptions ? api.options.langNoData : options.lang?.noData,
            },
            accessibility: {
              ...options.accessibility,
              screenReaderSection: {
                beforeChartFormat:
                  "<div>{typeDescription}</div><div>{chartSubtitle}</div><div>{chartLongdesc}</div><div>{playAsSoundButton}</div><div>{viewTableButton}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div><div>{annotationsTitle}{annotationsList}</div>",
                ...options.accessibility?.screenReaderSection,
              },
              keyboardNavigation: {
                enabled: !keyboardNavigation,
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
                animation: false,
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
                      api.options.onSeriesPointMouseOver.call(this, event);
                      return options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
                    },
                    mouseOut(event) {
                      api.options.onSeriesPointMouseOut.call(this, event);
                      return options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
                    },
                    click(event) {
                      api.options.onSeriesPointClick.call(this, event);
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
              errorbar: {
                stemColor: Styles.errorBarSeriesColor,
                whiskerColor: Styles.errorBarSeriesColor,
                ...options.plotOptions?.errorbar,
              },
            },
            xAxis: castArray(options.xAxis)?.map((xAxis) => ({
              ...Styles.xAxisOptions,
              ...xAxis,
              reversed: !inverted && isRtl() ? !xAxis.reversed : xAxis.reversed,
              opposite: inverted && isRtl() ? !xAxis.opposite : xAxis.opposite,
              className: clsx(
                testClasses["axis-x"],
                inverted ? testClasses["axis-vertical"] : testClasses["axis-horizontal"],
                xAxis.className,
              ),
              title: {
                style: {
                  ...Styles.axisTitleCss,
                  opacity: inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
                },
                reserveSpace: inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
                ...xAxis.title,
              },
              labels: { style: Styles.axisLabelsCss, ...xAxis.labels },
            })),
            yAxis: castArray(options.yAxis)?.map((yAxis) => ({
              ...Styles.yAxisOptions,
              ...yAxis,
              reversed: inverted && isRtl() ? !yAxis.reversed : yAxis.reversed,
              opposite: !inverted && isRtl() ? !yAxis.opposite : yAxis.opposite,
              className: clsx(
                testClasses["axis-y"],
                inverted ? testClasses["axis-horizontal"] : testClasses["axis-vertical"],
                yAxis.className,
              ),
              title: {
                style: {
                  ...Styles.axisTitleCss,
                  opacity: !inverted && verticalAxisTitlePlacement === "top" ? 0 : undefined,
                },
                reserveSpace: !inverted && verticalAxisTitlePlacement === "top" ? false : undefined,
                ...yAxis.title,
              },
              labels: { style: Styles.axisLabelsCss, ...yAxis.labels },
            })),
            // We don't use Highcharts tooltip, but certain tooltip options such as tooltip.snap or tooltip.shared
            // affect the hovering behavior of Highcharts. That is only the case when the tooltip is not disabled,
            // so we render it, but hide with styles.
            tooltip: options.tooltip ?? { enabled: true, snap: 0, style: { opacity: 0 } },
          };
          return (
            <>
              <ChartApplication keyboardNavigation={keyboardNavigation} api={api} />
              <HighchartsReact
                highcharts={highcharts}
                options={highchartsOptions}
                callback={(chart: Highcharts.Chart) => {
                  callback?.({
                    chart,
                    highcharts: highcharts as typeof Highcharts,
                    highlightChartPoint: (point) => api.highlightChartPoint(point),
                    clearChartHighlight: () => api.clearChartHighlight(),
                  });
                }}
              />
            </>
          );
        }}
        legend={isLegendEnabled ? <ChartLegend {...legendOptions} api={api} i18nStrings={i18nStrings} /> : null}
        verticalAxisTitle={
          verticalAxisTitlePlacement === "top" ? <VerticalAxisTitle api={api} inverted={!!inverted} /> : null
        }
        header={header?.content ? <ChartHeader>{header.content}</ChartHeader> : null}
        footer={footer?.content ? <ChartFooter>{footer.content}</ChartFooter> : null}
        seriesFilter={filter?.seriesFilter ? <ChartFilter api={api} i18nStrings={i18nStrings} /> : null}
        additionalFilters={filter?.additionalFilters}
      />

      {isTooltipEnabled && <ChartTooltip {...tooltipOptions} getTooltipContent={rest.getTooltipContent} api={api} />}

      {noDataOptions && <ChartNoData {...noDataOptions} i18nStrings={i18nStrings} api={api} />}
    </div>
  );
}

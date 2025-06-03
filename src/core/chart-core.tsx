// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useId, useRef } from "react";
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
import { ChartApplication } from "./components/core-application";
import { ChartFilters } from "./components/core-filters";
import { ChartLegend } from "./components/core-legend";
import { ChartNoData } from "./components/core-no-data";
import { ChartFooter, ChartHeader } from "./components/core-slots";
import { ChartTooltip } from "./components/core-tooltip";
import { VerticalAxisTitle } from "./components/core-vertical-axis-title";
import { getFormatter } from "./formatters";
import { CoreChartProps, InternalXAxisOptions } from "./interfaces-core";
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
  onHighlight,
  onClearHighlight,
  onLegendItemsChange,
  visibleItems,
  __internalRootRef,
  ...rest
}: CoreChartProps & InternalBaseComponentProps) {
  const highcharts = rest.highcharts as null | typeof Highcharts;

  const settings = {
    chartId: useId(),
    noDataEnabled: !!noDataOptions,
    legendEnabled: legendOptions?.enabled !== false,
    tooltipEnabled: tooltipOptions?.enabled !== false,
    keyboardNavigationEnabled: keyboardNavigation,
  };
  const handlers = { onHighlight, onClearHighlight, onLegendItemsChange };
  const state = { visibleItems };
  const api = useChartAPI(settings, handlers, state);

  const rootClassName = clsx(styles.root, fitHeight && styles["root-fit-height"], className);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRootRef = useMergeRefs(rootRef, __internalRootRef);
  const rootProps = { ref: mergedRootRef, className: rootClassName, ...getDataAttributes(rest) };
  const containerProps = { fitHeight, chartHeight, chartMinHeight, chartMinWidth, verticalAxisTitlePlacement };

  // Render fallback using the same root and container props as for the chart to ensure consistent
  // size, test classes, and data-attributes assignment.
  if (!highcharts) {
    return (
      <div {...rootProps}>
        <ChartContainer
          {...containerProps}
          chart={(minHeight) => (
            <div className={testClasses.fallback} style={{ minHeight }}>
              {fallback}
            </div>
          )}
        />
      </div>
    );
  }

  const apiOptions = api.getOptions();
  const inverted = options.chart?.inverted;
  const isRtl = () => getIsRtl(rootRef?.current);
  return (
    <div {...rootProps}>
      <ChartContainer
        {...containerProps}
        chart={(height) => {
          // The Highcharts options takes all provided Highcharts options and custom properties and merges them together, so that
          // the Cloudscape features and custom Highcharts extensions co-exist.
          // For certain options we provide Cloudscape styling, but in all cases this can be explicitly overridden.
          const highchartsOptions: Highcharts.Options = {
            ...options,
            // Hide credits by default.
            credits: { enabled: false, ...options.credits },
            // Hide chart title by default.
            title: { text: "", ...options.title },
            // Use Cloudscape color palette by default.
            // This cannot be reset to Highcharts' default from the outside, but it is possible to provide custom palette.
            colors: options.colors ?? Styles.colors,
            chart: {
              // Animations are disabled by default.
              // This is done for UX and a11y reasons as Highcharts animations do not match our animation timings, and do
              // not respect disabled motion settings. These issues can likely be resolved or we can provide custom animations
              // instead, but this is not a priority.
              animation: false,
              ...Styles.chart,
              ...options.chart,
              className: clsx(testClasses["chart-plot"], options.chart?.className),
              // Use height computed from chartHeight, chartMinHeight, and fitHeight settings by default.
              // It is possible to override it by explicitly providing chart.height, but this will not be
              // compatible with any of the above settings.
              height: options.chart?.height ?? height,
              // The debug errors are enabled by default in development mode, but this only works
              // if the Highcharts debugger module is loaded.
              displayErrors: options.chart?.displayErrors ?? isDevelopment,
              style: { ...Styles.chartPlotCss, ...options.chart?.style },
              backgroundColor: options.chart?.backgroundColor ?? Styles.chartPlotBackgroundColor,
              // We override certain chart events to inject additional behaviors, but it is still possible to define
              // custom callbacks. The Cloudscape behaviors can be disabled or altered via components API. For instance,
              // if no-data props are not provided - the related on-render computations will be skipped.
              events: {
                ...options.chart?.events,
                load(event) {
                  apiOptions.onChartLoad.call(this, event);
                  return options.chart?.events?.load?.call(this, event);
                },
                render(event) {
                  apiOptions.onChartRender.call(this, event);
                  return options.chart?.events?.render?.call(this, event);
                },
                click(event) {
                  apiOptions.onChartClick.call(this, event);
                  return options.chart?.events?.click?.call(this, event);
                },
              },
            },
            series: options.series,
            // The Highcharts legend is disabled by default in favour of the custom Cloudscape legend.
            legend: { enabled: false, ...options.legend },
            // Use Cloudscape no-data defaults if no-data props are defined.
            noData: settings.noDataEnabled ? apiOptions.noData : options.noData,
            lang: settings.noDataEnabled ? { ...options.lang, noData: apiOptions.langNoData } : options.lang,
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
              point: {
                descriptionFormatter(point) {
                  const xAxisOptions = point.series.xAxis?.userOptions as undefined | InternalXAxisOptions;
                  if (xAxisOptions) {
                    const formattedX = getFormatter(point.series.xAxis)(point.x);
                    return `${formattedX}\t${point.series.name}`;
                  }
                  return ""; // Using default Highcharts label.
                },
                ...options.accessibility?.point,
              },
            },
            plotOptions: {
              ...options.plotOptions,
              series: {
                animation: false,
                stickyTracking: false,
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
                      apiOptions.onSeriesPointMouseOver.call(this, event);
                      return options.plotOptions?.series?.point?.events?.mouseOver?.call(this, event);
                    },
                    mouseOut(event) {
                      apiOptions.onSeriesPointMouseOut.call(this, event);
                      return options.plotOptions?.series?.point?.events?.mouseOut?.call(this, event);
                    },
                    click(event) {
                      apiOptions.onSeriesPointClick.call(this, event);
                      return options.plotOptions?.series?.point?.events?.click?.call(this, event);
                    },
                  },
                },
              },
              area: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.area,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.area?.marker },
              },
              areaspline: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.areaspline,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.areaspline?.marker },
              },
              arearange: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.arearange,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.arearange?.marker },
              },
              areasplinerange: {
                fillOpacity: Styles.areaFillOpacity,
                ...options.plotOptions?.areasplinerange,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.areasplinerange?.marker },
              },
              line: {
                ...options.plotOptions?.line,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.line?.marker },
              },
              spline: {
                ...options.plotOptions?.spline,
                marker: { ...Styles.defaultMarker, ...options.plotOptions?.spline?.marker },
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
              labels: {
                style: Styles.axisLabelsCss,
                // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
                // between x-axis ticks and tooltip header.
                formatter: function () {
                  const formattedValue = getFormatter(this.axis)(this.value);
                  return formattedValue.replace(/\n/g, "<br />");
                },
                ...xAxis.labels,
              },
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
              labels: {
                style: Styles.axisLabelsCss,
                // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
                // between y-axis ticks and tooltip series values.
                formatter: function () {
                  const formattedValue = getFormatter(this.axis)(this.value);
                  return formattedValue.replace(/\n/g, "<br />");
                },
                ...yAxis.labels,
              },
            })),
            // We don't use Highcharts tooltip, but certain tooltip options such as tooltip.snap or tooltip.shared
            // affect the hovering behavior of Highcharts. That is only the case when the tooltip is not disabled,
            // so we render it, but hide with styles.
            tooltip: options.tooltip ?? { enabled: true, snap: 4, style: { opacity: 0 } },
          };
          return (
            <>
              <ChartApplication
                api={api}
                keyboardNavigation={keyboardNavigation}
                ariaLabel={options.lang?.accessibility?.chartContainerLabel}
              />
              <HighchartsReact
                highcharts={highcharts}
                options={highchartsOptions}
                callback={(chart: Highcharts.Chart) => {
                  callback?.({
                    chart,
                    highcharts: highcharts as typeof Highcharts,
                    highlightChartPoint: (point) => api.highlightChartPoint(point),
                    highlightChartGroup: (group) => api.highlightChartGroup(group),
                    clearChartHighlight: () => api.clearChartHighlight(),
                  });
                }}
              />
            </>
          );
        }}
        legend={settings.legendEnabled ? <ChartLegend {...legendOptions} api={api} i18nStrings={i18nStrings} /> : null}
        verticalAxisTitle={
          verticalAxisTitlePlacement === "top" ? <VerticalAxisTitle api={api} inverted={!!inverted} /> : null
        }
        header={header?.content ? <ChartHeader>{header.content}</ChartHeader> : null}
        footer={footer?.content ? <ChartFooter>{footer.content}</ChartFooter> : null}
        filter={
          filter?.seriesFilter || filter?.additionalFilters ? (
            <ChartFilters
              api={api}
              seriesFilter={filter?.seriesFilter}
              additionalFilters={filter?.additionalFilters}
              i18nStrings={i18nStrings}
            />
          ) : null
        }
      />

      {settings.tooltipEnabled && (
        <ChartTooltip {...tooltipOptions} getTooltipContent={rest.getTooltipContent} api={api} />
      )}

      {settings.noDataEnabled && <ChartNoData {...noDataOptions} i18nStrings={i18nStrings} api={api} />}
    </div>
  );
}

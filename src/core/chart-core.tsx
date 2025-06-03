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
  ariaLabel,
  ariaDescription,
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
  const inverted = !!options.chart?.inverted;
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
            // Highcharts legend is disabled by default in favour of the custom Cloudscape legend.
            legend: { enabled: false, ...options.legend },
            // Use Cloudscape no-data defaults if no-data props are defined.
            noData: settings.noDataEnabled ? apiOptions.noData : options.noData,
            lang: {
              ...options.lang,
              // Use Cloudscape no-data defaults if no-data props are defined.
              noData: settings.noDataEnabled ? apiOptions.langNoData : options.lang?.noData,
              // The default chart title is disabled by default to prevent the default "Chart" in the screen-reader detail.
              accessibility: { defaultChartTitle: "", chartContainerLabel: ariaLabel, ...options.lang?.accessibility },
            },
            accessibility: {
              description: ariaDescription,
              ...options.accessibility,
              // Highcharts keyboard navigation is disabled by default in favour of the custom Cloudscape navigation.
              keyboardNavigation: { enabled: !keyboardNavigation, ...options.accessibility?.keyboardNavigation },
              point: {
                // Point description formatter is overridden to respect custom axes value formatters in the point's accessible
                // description. We don't do it for pie charts, as there are no formatters, so we return an empty string, and
                // Highcharts renders the default point description in that case.
                descriptionFormatter(point) {
                  if (point.series.xAxis) {
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
                // Animations are disabled by default, same as in the options.chart.
                animation: false,
                // Sticky tracking is disabled by default due to sub-optimal UX in dense charts.
                stickyTracking: false,
                borderColor: Styles.seriesBorderColor,
                ...options.plotOptions?.series,
                dataLabels: { style: Styles.seriesDataLabelsCss, ...options.plotOptions?.series?.dataLabels },
                states: {
                  ...options.plotOptions?.series?.states,
                  inactive: { opacity: Styles.seriesOpacityInactive, ...options.plotOptions?.series?.states?.inactive },
                },
                // We override certain point events to inject additional behaviors, but it is still possible to define
                // custom callbacks. The Cloudscape behaviors can be disabled or altered via components API.
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
              area: { ...Styles.areaSeries, ...options.plotOptions?.area },
              areaspline: { ...Styles.areaSeries, ...options.plotOptions?.areaspline },
              arearange: { ...Styles.areaSeries, ...options.plotOptions?.arearange },
              areasplinerange: { ...Styles.areaSeries, ...options.plotOptions?.areasplinerange },
              line: { ...Styles.lineSeries, ...options.plotOptions?.line },
              spline: { ...Styles.lineSeries, ...options.plotOptions?.spline },
              column: { ...Styles.columnSeries, ...options.plotOptions?.column },
              errorbar: { ...Styles.errorbarSeries, ...options.plotOptions?.errorbar },
              // Pie chart is shown in legend by default, that is required for standalone pie charts.
              pie: { showInLegend: true, ...Styles.pieSeries, ...options.plotOptions?.pie },
            },
            xAxis: castArray(options.xAxis)?.map((xAxisOptions) => ({
              ...Styles.xAxisOptions,
              ...xAxisOptions,
              // Depending on the chart.inverted the x-axis can be rendered as vertical, and needs to respect page direction.
              reversed: !inverted && isRtl() ? !xAxisOptions.reversed : xAxisOptions.reversed,
              opposite: inverted && isRtl() ? !xAxisOptions.opposite : xAxisOptions.opposite,
              className: xAxisClassName(inverted, xAxisOptions.className),
              title: axisTitle(xAxisOptions.title ?? {}, !inverted || verticalAxisTitlePlacement === "side"),
              labels: axisLabels(xAxisOptions.labels ?? {}),
            })),
            yAxis: castArray(options.yAxis)?.map((yAxisOptions) => ({
              ...Styles.yAxisOptions,
              ...yAxisOptions,
              // Depending on the chart.inverted the y-axis can be rendered as vertical, and needs to respect page direction.
              reversed: inverted && isRtl() ? !yAxisOptions.reversed : yAxisOptions.reversed,
              opposite: !inverted && isRtl() ? !yAxisOptions.opposite : yAxisOptions.opposite,
              className: yAxisClassName(inverted, yAxisOptions.className),
              title: axisTitle(yAxisOptions.title ?? {}, inverted || verticalAxisTitlePlacement === "side"),
              labels: axisLabels(yAxisOptions.labels ?? {}),
            })),
            // We don't use Highcharts tooltip, but certain tooltip options such as tooltip.snap or tooltip.shared
            // affect the hovering behavior of Highcharts. That is only the case when the tooltip is not disabled,
            // so we render it, but hide with styles.
            tooltip: options.tooltip ?? { enabled: true, snap: 4, style: { opacity: 0 } },
          };
          return (
            <>
              <ChartApplication api={api} keyboardNavigation={keyboardNavigation} ariaLabel={ariaLabel} />
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

function xAxisClassName(inverted: boolean, customClassName?: string) {
  return clsx(
    testClasses["axis-x"],
    inverted ? testClasses["axis-vertical"] : testClasses["axis-horizontal"],
    customClassName,
  );
}

function yAxisClassName(inverted: boolean, customClassName?: string) {
  return clsx(
    testClasses["axis-y"],
    inverted ? testClasses["axis-horizontal"] : testClasses["axis-vertical"],
    customClassName,
  );
}

// When placing vertical axis title in the chart's top, the actual axis title rendered by Highcharts
// needs to be visually hidden (it is still accessible by screen-readers). We then set title's
// opacity to 0, and use reserveSpace=false, so that Highcharts stretches the plot area to all available
// container width.
function axisTitle<O extends Highcharts.XAxisTitleOptions | Highcharts.YAxisTitleOptions>(
  options: O,
  visible: boolean,
): O {
  return {
    style: { ...Styles.axisTitleCss, opacity: visible ? undefined : 0 },
    reserveSpace: visible ? undefined : false,
    ...options,
  };
}

// We use custom formatters instead of Highcharts defaults to ensure consistent formatting
// between axis ticks and tooltip contents.
function axisLabels<O extends Highcharts.XAxisLabelsOptions | Highcharts.YAxisLabelsOptions>(options: O): O {
  return {
    style: Styles.axisLabelsCss,
    formatter: function () {
      const formattedValue = getFormatter(this.axis)(this.value);
      return formattedValue.replace(/\n/g, "<br />");
    },
    ...options,
  };
}

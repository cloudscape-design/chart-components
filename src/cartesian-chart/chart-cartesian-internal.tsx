// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import { getOptionsId } from "../core/utils";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { useCartesianSeries } from "./chart-series-cartesian";
import { useChartTooltipCartesian } from "./chart-tooltip-cartesian";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";
import { getDataExtremes } from "./utils";

import testClasses from "./test-classes/styles.css.js";

export interface InternalCartesianChartProps extends InternalBaseComponentProps, Omit<CartesianChartProps, "series"> {
  highcharts: null | object;
  options: InternalCartesianChartOptions;
}

/**
 * The InternalCartesianChart component takes public CartesianChart properties, but also Highcharts options.
 * This allows using it as a Highcharts wrapper to mix Cloudscape and Highcharts features.
 */
export const InternalCartesianChart = forwardRef(
  (props: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    // Obtaining tooltip content, specific for cartesian charts.
    // By default, it renders a list of series under the cursor, and allows to extend and override its contents.
    const cartesianTooltipProps = useChartTooltipCartesian(props);

    // When visibleSeries and onChangeVisibleSeries are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    const [visibleSeriesState, setVisibleSeries] = useControllableState(
      props.visibleSeries,
      props.onChangeVisibleSeries,
      null,
      {
        componentName: "CartesianChart",
        propertyName: "visibleSeries",
        changeHandlerName: "onChangeVisibleSeries",
      },
      (value, handler) => fireNonCancelableEvent(handler, { visibleSeries: [...value!] }),
    );
    // Unless visible series are explicitly set, we start from all series being visible.
    const allSeriesIds = props.options.series.map((s) => getOptionsId(s));
    const visibleSeries = visibleSeriesState ?? allSeriesIds;

    // Converting threshold series and baseline setting to Highcharts options.
    const { series, xPlotLines, yPlotLines, ...seriesProps } = useCartesianSeries({ ...props, visibleSeries });
    const { xAxis, yAxis, ...options } = props.options;

    // Cartesian chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: setVisibleSeries,
      showAllSeries: () => setVisibleSeries(allSeriesIds),
    }));

    // Merging Highcharts options defined by the component and those provided explicitly as `options`, the latter has
    // precedence, so that it is possible to override or extend all Highcharts settings from the outside.
    const highchartsOptions: Highcharts.Options = {
      ...options,
      accessibility: { keyboardNavigation: { enabled: false } },
      chart: {
        ...options.chart,
        events: {
          ...options.chart?.events,
          render(event) {
            seriesProps.options.onChartRender.call(this, event);
            options.chart?.events?.render?.call(this, event);
          },
        },
      },
      xAxis: xAxis.map((xAxisProps, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, valueFormatter, ...highchartsProps } = xAxisProps;
        return {
          ...highchartsProps,
          title: { text: title },
          plotLines: [...xPlotLines, ...(highchartsProps.plotLines ?? [])],
          labels: {
            // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
            // between x-axis ticks and tooltip header.
            formatter: function () {
              const formattedValue = getDefaultFormatter(
                xAxisProps,
                getDataExtremes(this.chart.xAxis[index]),
              )(this.value);
              return formattedValue.replace(/\n/g, "<br />");
            },
            ...highchartsProps.labels,
          },
        };
      }),
      yAxis: yAxis.map((yAxisProps, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, valueFormatter, ...highchartsProps } = yAxisProps;
        return {
          ...highchartsProps,
          title: { text: title },
          plotLines: [...yPlotLines, ...(highchartsProps.plotLines ?? [])],
          labels: {
            // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
            // between y-axis ticks and tooltip series values.
            formatter: function () {
              const formattedValue = getDefaultFormatter(
                yAxisProps,
                getDataExtremes(this.chart.yAxis[index]),
              )(this.value);
              return formattedValue.replace(/\n/g, "<br />");
            },
            ...highchartsProps.labels,
          },
        };
      }),
      series,
      plotOptions: {
        ...options.plotOptions,
        series: {
          stickyTracking: false,
          ...options.plotOptions?.series,
        },
        line: {
          ...options.plotOptions?.line,
          marker: { ...Styles.defaultMarker, ...options.plotOptions?.line?.marker },
          states: { hover: { halo: Styles.defaultMarkerHoverHalo }, ...options.plotOptions?.line?.states },
        },
        spline: {
          ...options.plotOptions?.spline,
          marker: { ...Styles.defaultMarker, ...options.plotOptions?.line?.marker },
          states: { hover: { halo: Styles.defaultMarkerHoverHalo }, ...options.plotOptions?.spline?.states },
        },
        area: {
          ...options.plotOptions?.area,
          marker: { ...Styles.defaultMarker, ...options.plotOptions?.line?.marker },
          states: { hover: { halo: Styles.defaultMarkerHoverHalo }, ...options.plotOptions?.area?.states },
        },
        areaspline: {
          ...options.plotOptions?.areaspline,
          marker: { ...Styles.defaultMarker, ...options.plotOptions?.line?.marker },
          states: { hover: { halo: Styles.defaultMarkerHoverHalo }, ...options.plotOptions?.areaspline?.states },
        },
      },
    };

    return (
      <InternalCoreChart
        highcharts={props.highcharts}
        fallback={props.fallback}
        options={highchartsOptions}
        fitHeight={props.fitHeight}
        chartHeight={props.chartHeight}
        chartMinHeight={props.chartMinHeight}
        chartMinWidth={props.chartMinWidth}
        tooltip={{
          ...props.tooltip,
          placement: props.tooltip?.placement ?? "middle",
        }}
        noData={props.noData}
        legend={props.legend}
        visibleItems={visibleSeries}
        onLegendItemsChange={(legendItems) => setVisibleSeries(legendItems.filter((i) => i.visible).map((i) => i.id))}
        verticalAxisTitlePlacement={props.verticalAxisTitlePlacement}
        header={props.header}
        footer={props.footer}
        filter={props.filter}
        className={testClasses.root}
        __internalRootRef={props.__internalRootRef}
        {...cartesianTooltipProps}
        {...getDataAttributes(props)}
      />
    );
  },
);

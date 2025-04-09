// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { CloudscapeHighcharts } from "../core/chart-core";
import { CloudscapeChartAPI, CoreLegendProps } from "../core/interfaces-core";
import { getOptionsId } from "../core/utils";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../internal/events";
import { useChartTooltipCartesian } from "./chart-tooltip-cartesian";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";
import { getDataExtremes } from "./utils";

import testClasses from "./test-classes/styles.css.js";

interface InternalCartesianChartProps {
  highcharts: null | typeof Highcharts;
  options: InternalCartesianChartOptions;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
  series?: {
    getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
  };
  tooltip?: CartesianChartProps.TooltipProps;
  noData?: CartesianChartProps.NoDataProps;
  emphasizeBaselineAxis?: boolean;
  visibleSeries?: string[];
  onToggleVisibleSeries?: NonCancelableEventHandler<{ visibleSeries: string[] }>;
  legend?: CoreLegendProps & {
    variant?: "single-target" | "dual-target" | "dual-target-inverse";
    showFilter?: boolean;
  };
}

/**
 * The InternalCartesianChart component is a wrapper for CloudscapeHighcharts that implements default tooltip content,
 * adds threshold series and emphasized baseline.
 */
export const InternalCartesianChart = forwardRef(
  ({ highcharts, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const apiRef = useRef<CloudscapeChartAPI>(null) as React.MutableRefObject<CloudscapeChartAPI>;
    const getAPI = () => {
      /* c8 ignore next */
      if (!apiRef.current) {
        throw new Error("Invariant violation: chart instance is not available.");
      }
      return apiRef.current;
    };

    // Obtaining tooltip content, specific for cartesian charts.
    // By default, it renders a list of series under the cursor, and allows to extend and override its contents.
    const tooltipProps = useChartTooltipCartesian(getAPI, props);

    // When visibleSeries and onToggleVisibleSeries are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    const [visibleSeriesState, setVisibleSeries] = useControllableState(
      props.visibleSeries,
      props.onToggleVisibleSeries,
      null,
      {
        componentName: "CartesianChart",
        propertyName: "visibleSeries",
        changeHandlerName: "onToggleVisibleSeries",
      },
      (value, handler) => fireNonCancelableEvent(handler, { visibleSeries: value ?? [] }),
    );
    const allSeriesIds = props.options.series.map((s) => getOptionsId(s));
    const visibleSeries = visibleSeriesState ?? allSeriesIds;
    const hiddenSeries = allSeriesIds.filter((id) => !visibleSeries.includes(id));

    // Threshold series are converted to empty lines series to be visible in the legend.
    const series: Highcharts.SeriesOptionsType[] = props.options.series.map((s) => {
      // The awsui-threshold series are added as a combination of plot lines and empty series.
      // This makes them available in the chart's legend.
      if (s.type === "awsui-x-threshold" || s.type === "awsui-y-threshold") {
        return {
          type: "line",
          id: s.id,
          name: s.name,
          color: s.color ?? Styles.thresholdSeriesDefaultColor,
          data: [],
          ...Styles.thresholdSeriesOptions,
        };
      }
      return { ...s };
    });

    // Threshold series are added to the plot as x- or y-axis plot lines.
    const xPlotLines: Highcharts.XAxisPlotLinesOptions[] = [];
    const yPlotLines: Highcharts.YAxisPlotLinesOptions[] = [];
    for (const s of props.options.series) {
      const seriesId = getOptionsId(s);
      if (s.type === "awsui-x-threshold" && visibleSeries.includes(seriesId)) {
        xPlotLines.push({
          id: seriesId,
          value: s.value,
          color: s.color ?? Styles.thresholdSeriesDefaultColor,
          ...Styles.thresholdPlotLineOptions,
        });
      }
      if (s.type === "awsui-y-threshold" && visibleSeries.includes(seriesId)) {
        yPlotLines.push({
          id: seriesId,
          value: s.value,
          color: s.color ?? Styles.thresholdSeriesDefaultColor,
          ...Styles.thresholdPlotLineOptions,
        });
      }
    }

    // This makes the baseline better prominent in the plot.
    if (props.emphasizeBaselineAxis) {
      yPlotLines.push({ value: 0, ...Styles.chatPlotBaselineOptions });
    }

    useImperativeHandle(ref, () => ({
      // The clear filter API allows to programmatically make all series visible, even when the controllable
      // visibility API is not used. This can be used for a custom clear-filter action of the no-match state or elsewhere.
      clearFilter() {
        setVisibleSeries(allSeriesIds);
      },
    }));

    // The below code transforms Cloudscape-extended series into Highcharts series and plot lines.
    const { xAxis, yAxis, ...options } = props.options;

    // For scatter series type we enable markers by default, unless explicit markers settings provided.
    // Without markers, the scatter series are not visible by default.
    for (const s of series) {
      if (s.type === "scatter" && !s.marker) {
        s.marker = { enabled: true };
      }
    }

    // The Highcharts options takes all provided Highcharts options and custom properties and merges them together, so that
    // the Cloudscape features and custom Highcharts extensions can co-exist.
    const highchartsOptions: Highcharts.Options = {
      ...options,
      chart: {
        ...options.chart,
        events: {
          ...options.chart?.events,
          render(event) {
            if (highcharts && event.target instanceof highcharts.Chart) {
              (event.target as any).colorCounter = series.length;
            }
            options.chart?.events?.render?.call(this, event);
          },
        },
      },
      xAxis: xAxis.map((xAxisProps, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, valueFormatter, valueDecimals, ...highchartsProps } = xAxisProps;
        return {
          ...highchartsProps,
          title: { text: title },
          plotLines: [...xPlotLines, ...(highchartsProps.plotLines ?? [])],
          labels: {
            // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
            // between x-axis ticks and tooltip header.
            formatter: function () {
              return getDefaultFormatter(xAxisProps, getDataExtremes(this.chart.xAxis[index]))(this.value);
            },
            ...highchartsProps.labels,
          },
        };
      }),
      yAxis: yAxis.map((yAxisProps, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, valueFormatter, valueDecimals, ...highchartsProps } = yAxisProps;
        return {
          ...highchartsProps,
          title: { text: title },
          plotLines: [...yPlotLines, ...(highchartsProps.plotLines ?? [])],
          labels: {
            // We use custom formatters instead of Highcharts defaults to ensure consistent formatting
            // between y-axis ticks and tooltip series values.
            formatter: function () {
              return getDefaultFormatter(yAxisProps, getDataExtremes(this.chart.yAxis[index]))(this.value);
            },
            ...highchartsProps.labels,
          },
        };
      }),
      series,
      tooltip: {
        enabled: false,
        ...options.tooltip,
      },
    };

    return (
      <CloudscapeHighcharts
        highcharts={highcharts}
        options={highchartsOptions}
        fitHeight={props.fitHeight}
        chartMinHeight={props.chartMinHeight}
        chartMinWidth={props.chartMinWidth}
        tooltip={tooltipProps}
        noData={props.noData}
        legend={
          props.legend ? { align: "start", ...props.legend, getItemStatus: props.series?.getItemStatus } : undefined
        }
        hiddenItems={hiddenSeries}
        onItemVisibilityChange={(hiddenSeries) => {
          const nextVisibleSeries = allSeriesIds.filter((id) => !hiddenSeries.includes(id));
          setVisibleSeries(nextVisibleSeries);
        }}
        className={testClasses.root}
        callback={(chart) => {
          apiRef.current = chart;
        }}
        {...getDataAttributes(props)}
      />
    );
  },
);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { CloudscapeHighcharts, CloudscapeHighchartsRef } from "../core/chart-core";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../internal/events";
import { useChartTooltipCartesian } from "./chart-tooltip-cartesian";
import { getDefaultFormatter } from "./default-formatters";
import { CartesianChartProps, InternalCartesianChartOptions } from "./interfaces-cartesian";
import * as Styles from "./styles";
import { getDataExtremes } from "./utils";

import testClasses from "./test-classes/styles.css.js";

const BaselineId = "awsui-baseline-id";

interface InternalCartesianChartProps {
  highcharts: null | typeof Highcharts;
  options: InternalCartesianChartOptions;
  series?: {
    getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
  };
  tooltip?: CartesianChartProps.TooltipProps;
  noData?: CartesianChartProps.NoDataProps;
  emphasizeBaselineAxis?: boolean;
  visibleSeries?: string[];
  onToggleVisibleSeries?: NonCancelableEventHandler<{ visibleSeries: string[] }>;
}

/**
 * The InternalCartesianChart component is a wrapper for CloudscapeHighcharts that implements default tooltip content,
 * adds threshold series and emphasized baseline.
 */
export const InternalCartesianChart = forwardRef(
  ({ highcharts, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const chartRef = useRef<CloudscapeHighchartsRef>(null) as React.MutableRefObject<CloudscapeHighchartsRef>;

    // Obtaining tooltip content, specific for cartesian charts.
    // By default, it renders a list of series under the cursor, and allows to extend and override its contents.
    const tooltipProps = useChartTooltipCartesian(() => chartRef.current.getChart(), props);

    // When visibleSeries and onToggleVisibleSeries are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    const [visibleSeries, setVisibleSeries] = useControllableState(
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

    useImperativeHandle(ref, () => ({
      // The clear filter API allows to programmatically make all series visible, even when the controllable
      // visibility API is not used. This can be used for a custom clear-filter action of the no-match state or elsewhere.
      clearFilter() {
        setVisibleSeries(props.options.series.map((s) => s.id ?? s.name ?? ""));
      },
    }));

    // The below code transforms Cloudscape-extended series into Highcharts series and plot lines.
    const { xAxis, yAxis, series: externalSeries, ...options } = props.options;
    const series: Highcharts.SeriesOptionsType[] = [];
    const xAxisPlotLines: Highcharts.XAxisPlotLinesOptions[] = [];
    const addXPlotLine = (plotLine: Highcharts.XAxisPlotLinesOptions) => {
      if (!visibleSeries || !plotLine.id || visibleSeries.includes(plotLine.id)) {
        xAxisPlotLines.push(plotLine);
      }
    };
    const yAxisPlotLines: Highcharts.YAxisPlotLinesOptions[] = [];
    const addYPlotLine = (plotLine: Highcharts.YAxisPlotLinesOptions) => {
      if (!visibleSeries || !plotLine.id || visibleSeries.includes(plotLine.id)) {
        yAxisPlotLines.push(plotLine);
      }
    };

    // The awsui-threshold series are added as a combination of plot lines and empty series.
    // This makes them available in the chart's legend.
    for (const s of externalSeries) {
      const commonThresholdProps: Highcharts.SeriesLineOptions = {
        type: "line",
        id: s.id,
        name: s.name,
        data: [],
        custom: { isThreshold: true },
      };
      if (s.type === "awsui-x-threshold") {
        series.push({ ...Styles.thresholdSeriesOptions({ color: s.color }), ...commonThresholdProps });
        addXPlotLine({ ...Styles.thresholdPlotLineOptions({ color: s.color }), id: s.id ?? s.name, value: s.value });
      } else if (s.type === "awsui-y-threshold") {
        series.push({ ...Styles.thresholdSeriesOptions({ color: s.color }), ...commonThresholdProps });
        addYPlotLine({ ...Styles.thresholdPlotLineOptions({ color: s.color }), id: s.id ?? s.name, value: s.value });
      } else {
        series.push({ ...s });
      }
    }

    // For scatter series type we enable markers by default, unless explicit markers settings provided.
    // Without markers, the scatter series are not visible by default.
    for (const s of series) {
      if (s.type === "scatter" && !s.marker) {
        s.marker = { enabled: true };
      }
    }

    // This makes the baseline better prominent in the plot.
    if (props.emphasizeBaselineAxis) {
      yAxisPlotLines.push({ value: 0, ...Styles.chatPlotBaselineOptions, id: BaselineId });
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

              for (const s of event.target.series) {
                if (s.type === "column" && s.data.length === 1) {
                  const id = s.data[0].y!.toString();
                  if (!s.visible) {
                    event.target.xAxis[0].removePlotLine(id);
                  } else {
                    event.target.xAxis[0].addPlotLine({
                      id,
                      value: s.data[0].y!,
                      ...Styles.thresholdPlotLineOptions({}),
                    });
                  }
                }
              }
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
          plotLines: [...xAxisPlotLines, ...(highchartsProps.plotLines ?? [])],
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
          plotLines: [...yAxisPlotLines, ...(highchartsProps.plotLines ?? [])],
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
    };

    return (
      <CloudscapeHighcharts
        ref={chartRef}
        highcharts={highcharts}
        options={highchartsOptions}
        tooltip={tooltipProps}
        noData={props.noData}
        legendMarkers={{ getItemStatus: props.series?.getItemStatus }}
        visibleSeries={visibleSeries}
        onToggleVisibleSeries={setVisibleSeries}
        className={testClasses.root}
        {...getDataAttributes(props)}
      />
    );
  },
);

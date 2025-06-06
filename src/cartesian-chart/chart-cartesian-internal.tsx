// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import {
  CoreChartProps,
  ErrorBarSeriesOptions,
  TooltipItem,
  TooltipSeriesProps,
  TooltipSlotProps,
} from "../core/interfaces";
import { getOptionsId, isXThreshold } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { transformCartesianSeries } from "./chart-series-cartesian";
import { CartesianChartProps as C, NonErrorBarSeriesOptions } from "./interfaces-cartesian";

import testClasses from "./test-classes/styles.css.js";

interface InternalCartesianChartProps extends InternalBaseComponentProps, C {
  tooltip: SomeRequired<C.TooltipOptions, "enabled" | "placement" | "size">;
  legend: SomeRequired<C.LegendOptions, "enabled">;
}

export const InternalCartesianChart = forwardRef(
  ({ tooltip, ...props }: InternalCartesianChartProps, ref: React.Ref<C.Ref>) => {
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
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
    const visibleSeries = visibleSeriesState ?? allSeriesIds;

    // We convert cartesian tooltip options to the core chart's getTooltipContent callback,
    // ensuring no internal types are exposed to the consumer-defined render functions.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      // We use point.series.userOptions to get the series options that were passed down to Highcharts,
      // assuming Highcharts makes no modifications for those. These options are not referentially equal
      // to the ones we get from the consumer due to the internal validation/transformation we run on them.
      // See: https://api.highcharts.com/class-reference/Highcharts.Chart#userOptions.
      const transformItem = (item: TooltipItem): C.TooltipSeriesItem => {
        return {
          x: item.point.x,
          y: isXThreshold(item.point.series) ? null : (item.point.y ?? null),
          series: item.point.series.userOptions as NonErrorBarSeriesOptions,
          errorRanges: item.linkedErrorbars.map((point) => ({
            low: point.options.low ?? 0,
            high: point.options.high ?? 0,
            series: point.series.userOptions as ErrorBarSeriesOptions,
          })),
        };
      };
      const transformSeriesProps = (props: TooltipSeriesProps): C.TooltipSeriesRenderProps => {
        return {
          item: transformItem(props.item),
        };
      };
      const transformSlotProps = (props: TooltipSlotProps): C.TooltipSlotRenderProps => {
        return {
          x: props.x,
          items: props.items.map(transformItem),
        };
      };
      return {
        series: tooltip.series ? (props) => tooltip.series!(transformSeriesProps(props)) : undefined,
        header: tooltip.header ? (props) => tooltip.header!(transformSlotProps(props)) : undefined,
        body: tooltip.body ? (props) => tooltip.body!(transformSlotProps(props)) : undefined,
        footer: tooltip.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
      };
    };

    // Converting x-, and y-threshold series to Highcharts series and plot lines.
    const { series, xPlotLines, yPlotLines } = transformCartesianSeries(props.series, visibleSeries);

    // Cartesian chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: setVisibleSeries,
      showAllSeries: () => setVisibleSeries(allSeriesIds),
    }));

    const highchartsOptions: Highcharts.Options = {
      chart: {
        inverted: props.inverted,
      },
      plotOptions: {
        series: {
          stacking: props.stacking ? "normal" : undefined,
        },
      },
      series,
      xAxis: castArray(props.xAxis)?.map((xAxisProps) => ({
        ...xAxisProps,
        title: { text: xAxisProps.title },
        plotLines: xPlotLines,
      })),
      yAxis: castArray(props.yAxis)?.map((yAxisProps) => ({
        ...yAxisProps,
        title: { text: yAxisProps.title },
        plotLines: yPlotLines,
      })),
    };

    return (
      <InternalCoreChart
        {...props}
        options={highchartsOptions}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={visibleSeries}
        onVisibleItemsChange={(legendItems) => setVisibleSeries(legendItems.filter((i) => i.visible).map((i) => i.id))}
        className={testClasses.root}
      />
    );
  },
);

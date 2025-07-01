// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import {
  CoreChartAPI,
  CoreChartProps,
  ErrorBarSeriesOptions,
  TooltipContentItem,
  TooltipPointProps,
  TooltipSlotProps,
} from "../core/interfaces";
import { getOptionsId, isXThreshold } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { transformCartesianSeries } from "./chart-series-cartesian";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces";

import testClasses from "./test-classes/styles.css.js";

interface InternalCartesianChartProps extends InternalBaseComponentProps, CartesianChartProps {
  tooltip: SomeRequired<CartesianChartProps.TooltipOptions, "enabled" | "placement" | "size">;
  legend: SomeRequired<CartesianChartProps.LegendOptions, "enabled">;
}

export const InternalCartesianChart = forwardRef(
  ({ tooltip, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const apiRef = useRef<null | CoreChartAPI>(null);

    // When visibleSeries and onVisibleSeriesChange are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    useControllableState(props.visibleSeries, props.onVisibleSeriesChange, undefined, {
      componentName: "CartesianChart",
      propertyName: "visibleSeries",
      changeHandlerName: "onVisibleSeriesChange",
    });
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
    // We keep local visible series state to compute threshold series data, that depends on series visibility.
    const [visibleSeriesLocal, setVisibleSeriesLocal] = useState(props.visibleSeries ?? allSeriesIds);
    const visibleSeriesState = props.visibleSeries ?? visibleSeriesLocal;
    const onVisibleSeriesChange: CoreChartProps["onVisibleItemsChange"] = (items) => {
      const visibleSeries = items.filter((i) => i.visible).map((i) => i.id);
      if (props.visibleSeries) {
        fireNonCancelableEvent(props.onVisibleSeriesChange, { visibleSeries });
      } else {
        setVisibleSeriesLocal(visibleSeries);
      }
    };

    // We convert cartesian tooltip options to the core chart's getTooltipContent callback,
    // ensuring no internal types are exposed to the consumer-defined render functions.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      // We use point.series.userOptions to get the series options that were passed down to Highcharts,
      // assuming Highcharts makes no modifications for those. These options are not referentially equal
      // to the ones we get from the consumer due to the internal validation/transformation we run on them.
      // See: https://api.highcharts.com/class-reference/Highcharts.Chart#userOptions.
      const transformItem = (item: TooltipContentItem): CartesianChartProps.TooltipPointItem => ({
        x: item.point.x,
        y: isXThreshold(item.point.series) ? null : (item.point.y ?? null),
        series: item.point.series.userOptions as NonErrorBarSeriesOptions,
        errorRanges: item.errorRanges.map((point) => ({
          low: point.options.low ?? 0,
          high: point.options.high ?? 0,
          series: point.series.userOptions as ErrorBarSeriesOptions,
        })),
      });
      const transformSeriesProps = (props: TooltipPointProps): CartesianChartProps.TooltipPointRenderProps => ({
        item: transformItem(props.item),
      });
      const transformSlotProps = (props: TooltipSlotProps): CartesianChartProps.TooltipSlotRenderProps => ({
        x: props.x,
        items: props.items.map(transformItem),
      });
      return {
        point: tooltip.point ? (props) => tooltip.point!(transformSeriesProps(props)) : undefined,
        header: tooltip.header ? (props) => tooltip.header!(transformSlotProps(props)) : undefined,
        body: tooltip.body ? (props) => tooltip.body!(transformSlotProps(props)) : undefined,
        footer: tooltip.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
      };
    };

    // Converting x-, and y-threshold series to Highcharts series and plot lines.
    const { series, xPlotLines, yPlotLines } = transformCartesianSeries(props.series, visibleSeriesState);

    // Cartesian chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: (visibleSeriesIds) => apiRef.current?.setItemsVisible(visibleSeriesIds),
      showAllSeries: () => apiRef.current?.setItemsVisible(allSeriesIds),
    }));

    return (
      <InternalCoreChart
        {...props}
        callback={(api) => (apiRef.current = api)}
        options={{
          chart: {
            inverted: props.inverted,
          },
          plotOptions: {
            series: { stacking: props.stacking },
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
        }}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={props.visibleSeries}
        onVisibleItemsChange={onVisibleSeriesChange}
        className={testClasses.root}
      />
    );
  },
);

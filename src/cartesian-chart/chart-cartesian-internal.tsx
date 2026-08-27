// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps, ErrorBarSeriesOptions } from "../core/interfaces";
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
    const apiRef = useRef<null | CoreChartProps.ChartAPI>(null);

    useControllableState(props.visibleSeries, props.onVisibleSeriesChange, undefined, {
      componentName: "CartesianChart",
      propertyName: "visibleSeries",
      changeHandlerName: "onVisibleSeriesChange",
    });
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
    const [visibleSeriesLocal, setVisibleSeriesLocal] = useState(props.visibleSeries ?? allSeriesIds);
    const visibleSeriesState = props.visibleSeries ?? visibleSeriesLocal;
    const onVisibleSeriesChange: CoreChartProps["onVisibleItemsChange"] = ({ detail: { items } }) => {
      const visibleSeries = items.filter((i) => i.visible).map((i) => i.id);
      if (props.visibleSeries) {
        fireNonCancelableEvent(props.onVisibleSeriesChange, { visibleSeries });
      } else {
        setVisibleSeriesLocal(visibleSeries);
      }
    };

    // Tooltip content transformation.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      const transformItem = (item: CoreChartProps.TooltipContentItem): CartesianChartProps.TooltipPointItem => {
        const userOptions = item.point.series.userOptions as NonErrorBarSeriesOptions;
        const originalType = item.point.series.userOptions.custom?.awsui?.type;
        const series = originalType
          ? ({ ...userOptions, type: originalType } as NonErrorBarSeriesOptions)
          : userOptions;
        return {
          x: item.point.x,
          y: isXThreshold(item.point.series) ? null : (item.point.y ?? null),
          size: item.point.options.z ?? undefined,
          series,
          errorRanges: item.errorRanges.map((point) => ({
            low: point.options.low ?? 0,
            high: point.options.high ?? 0,
            series: point.series.userOptions as ErrorBarSeriesOptions,
          })),
        };
      };
      const transformSeriesProps = (
        props: CoreChartProps.TooltipPointProps,
      ): CartesianChartProps.TooltipPointRenderProps => ({ item: transformItem(props.item) });
      const transformSlotProps = (
        props: CoreChartProps.TooltipSlotProps,
      ): CartesianChartProps.TooltipSlotRenderProps => ({ x: props.x, items: props.items.map(transformItem) });

      return {
        point: tooltip.point ? (coreProps) => tooltip.point!(transformSeriesProps(coreProps)) : undefined,
        header: tooltip.header ? (coreProps) => tooltip.header!(transformSlotProps(coreProps)) : undefined,
        body: tooltip.body ? (coreProps) => tooltip.body!(transformSlotProps(coreProps)) : undefined,
        footer: tooltip.footer ? (coreProps) => tooltip.footer!(transformSlotProps(coreProps)) : undefined,
      };
    };

    const { series, xPlotLines, yPlotLines } = transformCartesianSeries(props.series, visibleSeriesState);

    // The zoom actions are implemented by the core chart, and are no-ops when zooming is not enabled.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: (visibleSeriesIds) => apiRef.current?.setItemsVisible(visibleSeriesIds),
      showAllSeries: () => apiRef.current?.setItemsVisible(allSeriesIds),
      enterZoomMode: () => apiRef.current?.enterZoomMode(),
      exitZoomMode: () => apiRef.current?.exitZoomMode(),
      resetZoom: () => apiRef.current?.resetZoom(),
    }));

    return (
      <InternalCoreChart
        {...props}
        callback={(api) => {
          apiRef.current = api;
        }}
        options={{
          chart: { inverted: props.inverted },
          plotOptions: { series: { stacking: props.stacking } },
          accessibility: { enabled: true, keyboardNavigation: { enabled: true } },
          series,
          xAxis: castArray(props.xAxis)?.map((xAxisProps) => ({
            ...xAxisProps,
            title: { text: xAxisProps.title },
            plotLines: xPlotLines,
          })),
          yAxis: castArray(props.yAxis)?.map((yAxisProps, index) => ({
            ...yAxisProps,
            title: { text: yAxisProps.title },
            plotLines: yPlotLines,
            ...(index === 1 ? { opposite: true } : {}),
          })),
        }}
        sizeAxis={props.sizeAxis}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={props.visibleSeries}
        onVisibleItemsChange={onVisibleSeriesChange}
        className={testClasses.root}
      />
    );
  },
);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CoreChartProps,
  ErrorBarSeriesOptions,
  TooltipItem,
  TooltipSeriesProps,
  TooltipSlotProps,
} from "../core/interfaces";
import { isXThreshold } from "../core/utils";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces-cartesian";

export function useChartTooltipCartesian({
  tooltip,
}: {
  tooltip?: CartesianChartProps.TooltipOptions;
}): Partial<CoreChartProps> {
  const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
    const transformItem = (item: TooltipItem): CartesianChartProps.TooltipSeriesItem => {
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
    const transformSeriesProps = (props: TooltipSeriesProps): CartesianChartProps.TooltipSeriesRenderProps => {
      return {
        item: transformItem(props.item),
      };
    };
    const transformSlotProps = (props: TooltipSlotProps): CartesianChartProps.TooltipSlotRenderProps => {
      return {
        x: props.x,
        items: props.items.map(transformItem),
      };
    };
    return {
      series: tooltip?.series ? (props) => tooltip.series!(transformSeriesProps(props)) : undefined,
      header: tooltip?.header ? (props) => tooltip.header!(transformSlotProps(props)) : undefined,
      body: tooltip?.body ? (props) => tooltip.body!(transformSlotProps(props)) : undefined,
      footer: tooltip?.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
    };
  };
  return { getTooltipContent };
}

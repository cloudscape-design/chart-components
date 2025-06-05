// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CoreChartProps, TooltipSlotProps } from "../core/interfaces";
import { getOptionsId } from "../core/utils";
import { PieChartProps } from "./interfaces-pie";

export function useChartTooltipPie({ tooltip }: { tooltip?: PieChartProps.TooltipOptions }): Partial<CoreChartProps> {
  const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
    const transformSlotProps = (props: TooltipSlotProps): PieChartProps.TooltipSlotRenderProps => {
      const point = props.items[0].point;
      return {
        totalValue: point.total ?? 0,
        segmentValue: point.y ?? 0,
        segmentId: getOptionsId(point.options),
        segmentName: point.name ?? "",
      };
    };
    return {
      header: tooltip?.header ? (props) => tooltip.header!(transformSlotProps(props)) : undefined,
      body: tooltip?.body ? (props) => tooltip.body!(transformSlotProps(props)) : undefined,
      footer: tooltip?.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
    };
  };
  return { getTooltipContent };
}

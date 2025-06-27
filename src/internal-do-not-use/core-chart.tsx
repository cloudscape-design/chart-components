// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalCoreChart } from "../core/chart-core";
import type * as CoreInterfaces from "../core/interfaces";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";

function CoreChart(props: CoreInterfaces.CoreChartProps) {
  const baseComponentProps = useBaseComponent("ChartCore", { props: {} });
  return <InternalCoreChart {...props} {...baseComponentProps} />;
}

applyDisplayName(CoreChart, "CoreChart");

export default CoreChart;

export namespace CoreChartTypes {
  export type BaseChartOptions = CoreInterfaces.BaseChartOptions;
  export type BaseFilterOptions = CoreInterfaces.BaseFilterOptions;
  export type BaseI18nStrings = CoreInterfaces.BaseI18nStrings;
  export type BaseLegendOptions = CoreInterfaces.BaseLegendOptions;
  export type BaseNoDataOptions = CoreInterfaces.BaseNoDataOptions;

  export type CartesianI18nStrings = CoreInterfaces.CartesianI18nStrings;
  export type PieI18nStrings = CoreInterfaces.PieI18nStrings;
  export type CoreI18nStrings = CoreInterfaces.CoreI18nStrings;

  export type CoreCartesianOptions = CoreInterfaces.CoreCartesianOptions;
  export type CoreChartAPI = CoreInterfaces.CoreChartAPI;
  export type CoreChartProps = CoreInterfaces.CoreChartProps;
  export type CoreFooterOptions = CoreInterfaces.CoreFooterOptions;
  export type CoreHeaderOptions = CoreInterfaces.CoreHeaderOptions;
  export type CoreLegendItem = CoreInterfaces.CoreLegendItem;
  export type CoreLegendOptions = CoreInterfaces.CoreLegendOptions;

  export type CoreTooltipContent = CoreInterfaces.CoreTooltipContent;
  export type CoreTooltipOptions = CoreInterfaces.CoreTooltipOptions;
  export type GetLegendTooltipContent = CoreInterfaces.GetLegendTooltipContent;
  export type GetLegendTooltipContentProps = CoreInterfaces.GetLegendTooltipContentProps;
  export type GetTooltipContent = CoreInterfaces.GetTooltipContent;
  export type GetTooltipContentProps = CoreInterfaces.GetTooltipContentProps;
  export type TooltipContent = CoreInterfaces.TooltipContent;
  export type TooltipContentItem = CoreInterfaces.TooltipContentItem;
  export type TooltipPointFormatted = CoreInterfaces.TooltipPointFormatted;
  export type TooltipPointProps = CoreInterfaces.TooltipPointProps;
  export type TooltipSlotProps = CoreInterfaces.TooltipSlotProps;

  export type InternalChartOptions = CoreInterfaces.InternalChartOptions;
  export type InternalXAxisOptions = CoreInterfaces.InternalXAxisOptions;
  export type InternalYAxisOptions = CoreInterfaces.InternalYAxisOptions;

  export type ChartHighlightProps = CoreInterfaces.ChartHighlightProps;
}

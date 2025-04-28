// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as BaseTypes from "../core/interfaces-base";
import { NonCancelableEventHandler } from "../internal/events";

export interface CartesianChartProps extends BaseTypes.BaseChartProps {
  /**
   * Inverts X and Y axes. Use it to show horizontal columns (bars).
   * This property corresponds to [chart.inverted](https://api.highcharts.com/highcharts/chart.inverted).
   */
  inverted?: boolean;

  /**
   * Specifies series stacking behavior. Use it for column- or area- series.
   */
  stacked?: boolean;

  /**
   * Chart series and data.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series).
   *
   * Supported series types:
   * * [area](https://api.highcharts.com/highcharts/series.area).
   * * [areaspline](https://api.highcharts.com/highcharts/series.areaspline).
   * * [column](https://api.highcharts.com/highcharts/series.column).
   * * [errorbar](https://api.highcharts.com/highcharts/series.errorbar).
   * * [line](https://api.highcharts.com/highcharts/series.line).
   * * [scatter](https://api.highcharts.com/highcharts/series.scatter).
   * * [spline](https://api.highcharts.com/highcharts/series.spline).
   * * x-threshold - The line-like series to represent x-axis threshold (vertical, when `inverted=false`).
   * * y-threshold - The line-like series to represent y-axis threshold (horizontal, when `inverted=false`).
   */
  series: CartesianChartProps.SeriesOptions[];

  /**
   * Chart tooltip that replaces [tooltip](https://api.highcharts.com/highcharts/tooltip).
   *
   * Supported properties:
   * * `enabled` - (optional, boolean) - Use it to hide the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Use it to specify max tooltip size.
   * * `placement` - (optional, "target" | "middle" | "bottom") - Use it to specify preferred tooltip placement.
   * * `title` - (optional, function) - Use it to provide a custom tooltip title.
   * * `content` - (optional, function) - Use it to provide a custom tooltip content.
   * * `footer` - (optional, function) - Use it to add a tooltip footer.
   * * `series` - (optional, function) - Use it to extend the default series list, in order to use custom value formatting,
   * inject links, or add expandable items.
   */
  tooltip?: CartesianChartProps.TooltipOptions;

  /**
   * X-axis options that extend [xAxis](https://api.highcharts.com/highcharts/xAxis).
   *
   * Supported properties (Highcharts):
   * * `title` (optional, string) - The axis title.
   * * `type` (optional, 'linear' | 'datetime' | 'category' | 'logarithmic') - The axis type.
   * * * linear - Uses continuous proportional values scale.
   * * * datetime - Similar to linear, but takes epoch time as values.
   * * * category - Uses discrete scale, requires `categories` to be set.
   * * * logarithmic - Uses continuous logarithmic values scale.
   * * `min`, `max` (optional, number) - The axis value boundaries.
   * * `tickInterval` (optional, number) - The tick distance.
   * * `categories` (optional, Array<string>) - The predefined list of axis values to be used for categorical axes.
   *
   * Additional properties (Cloudscape):
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip header.
   * * `valueDecimals` (optional, number) - The number of decimal digits the axis values have, defaults to 2.
   */
  xAxis?: CartesianChartProps.XAxisOptions;

  /**
   * Y-axis options that extend [xAxis](https://api.highcharts.com/highcharts/yAxis).
   *
   * Supported properties (Highcharts):
   * * `title` (optional, string) - The axis title.
   * * `type` (optional, 'linear' | 'datetime' | 'category' | 'logarithmic') - The axis type.
   * * * linear - Uses continuous proportional values scale.
   * * * datetime - Similar to linear, but takes epoch time as values.
   * * * category - Uses discrete scale, requires `categories` to be set.
   * * * logarithmic - Uses continuous logarithmic values scale.
   * * `min`, `max` (optional, number) - The axis value boundaries.
   * * `tickInterval` (optional, number) - The tick distance.
   * * `categories` (optional, Array<string>) - The predefined list of axis values to be used for categorical axes.
   * * `reversedStacks` (optional, boolean) - Reverts series order in stacked series.
   *
   * Additional properties (Cloudscape):
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip header.
   * * `valueDecimals` (optional, number) - The number of decimal digits the axis values have, defaults to 2.
   */
  yAxis?: CartesianChartProps.YAxisOptions;

  /**
   * Defines placement of the vertical axis (can be either Y or X depending on `inverted`).
   */
  verticalAxisTitlePlacement?: "top" | "side";

  /**
   * List of series IDs to be visible. When unset, all series are visible by default, but can be hidden by clicking on the
   * legend. When a series does not have an ID, a series name is used instead.
   * When the property is provided, use `onToggleVisibleSeries` to update it when the legend series filtering is used.
   */
  visibleSeries?: readonly string[];

  /**
   * A callback, executed when series visibility is toggled by clicking on legend items.
   */
  onToggleVisibleSeries?: NonCancelableEventHandler<{ visibleSeries: string[] }>;

  /**
   * When set to `true`, adds a visual emphasis on the zero baseline axis.
   */
  emphasizeBaselineAxis?: boolean;
}

export namespace CartesianChartProps {
  export interface Ref {
    // Controls series visibility that works with both controlled and uncontrolled visibility mode.
    // This is useful to clear selected series from no-match state.
    setVisibleSeries(visibleSeries: readonly string[]): void;
  }

  export type SeriesOptions =
    | AreaSeriesOptions
    | AreaSplineSeriesOptions
    | ColumnSeriesOptions
    | ErrorBarSeriesOptions
    | LineSeriesOptions
    | ScatterSeriesOptions
    | SplineSeriesOptions
    | XThresholdSeriesOptions
    | YThresholdSeriesOptions;

  export type AreaSeriesOptions = BaseTypes.AreaSeriesOptions;
  export type AreaSplineSeriesOptions = BaseTypes.AreaSplineSeriesOptions;
  export type ColumnSeriesOptions = BaseTypes.ColumnSeriesOptions;
  export type ErrorBarSeriesOptions = BaseTypes.ErrorBarSeriesOptions;
  export type LineSeriesOptions = BaseTypes.LineSeriesOptions;
  export type ScatterSeriesOptions = BaseTypes.ScatterSeriesOptions;
  export type SplineSeriesOptions = BaseTypes.SplineSeriesOptions;
  export type XThresholdSeriesOptions = BaseTypes.XThresholdSeriesOptions;
  export type YThresholdSeriesOptions = BaseTypes.YThresholdSeriesOptions;

  interface AxisOptions {
    title?: string;
    type?: "linear" | "datetime" | "category" | "logarithmic";
    min?: number;
    max?: number;
    tickInterval?: number;
    categories?: string[];
    valueFormatter?: (value: number) => string;
    valueDecimals?: number;
  }

  export type XAxisOptions = AxisOptions;

  export interface YAxisOptions extends AxisOptions {
    reversedStacks?: boolean;
  }

  export interface TooltipOptions extends BaseTypes.ChartTooltipOptions {
    series?: (props: TooltipSeriesRenderProps) => TooltipSeriesFormatted;
    header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
    body?: (props: TooltipBodyRenderProps) => React.ReactNode;
    footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
  }

  export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
  export type TooltipBodyRenderProps = TooltipSlotRenderProps;
  export type TooltipFooterRenderProps = TooltipSlotRenderProps;
  interface TooltipSlotRenderProps {
    x: number;
    items: TooltipMatchedItem[];
  }
  interface TooltipSeriesRenderProps {
    item: TooltipMatchedItem;
  }

  export type TooltipMatchedItem = TooltipMatchedItemPoint | TooltipMatchedItemRange | TooltipMatchedItemThreshold;

  interface TooltipMatchedItemPoint {
    type: "point";
    x: number;
    y: number;
    series: CartesianChartProps.SeriesOptions;
    marker: React.ReactNode;
  }

  interface TooltipMatchedItemRange {
    type: "range";
    x: number;
    low: number;
    high: number;
    series: CartesianChartProps.SeriesOptions;
    marker: React.ReactNode;
  }

  interface TooltipMatchedItemThreshold {
    type: "all";
    x: number;
    series: CartesianChartProps.SeriesOptions;
    marker: React.ReactNode;
  }

  export interface TooltipSeriesFormatted {
    key: React.ReactNode;
    value: React.ReactNode;
    expandable?: boolean;
    subItems?: ReadonlyArray<{ key: React.ReactNode; value: React.ReactNode }>;
  }

  export type NoDataOptions = BaseTypes.ChartNoDataOptions;
}

// The internal chart options allow propagation of all Highcharts properties, including series types and axes options,
// not supported by the public CartesianChart component.
// This is done to facilitate easier prototyping and fast adoption of more Highcharts features.
export type InternalCartesianChartOptions = Omit<Highcharts.Options, "series" | "xAxis" | "yAxis"> & {
  series: InternalSeriesOptions[];
  xAxis: InternalXAxisOptions[];
  yAxis: InternalYAxisOptions[];
};

export type InternalSeriesOptions = CartesianChartProps.SeriesOptions | Highcharts.SeriesOptionsType;

export type InternalXAxisOptions = CartesianChartProps.XAxisOptions & Highcharts.XAxisOptions;

export type InternalYAxisOptions = CartesianChartProps.YAxisOptions & Highcharts.YAxisOptions;

export type InternalTooltipMatchedItem =
  | InternalTooltipMatchedItemPoint
  | InternalTooltipMatchedItemRange
  | InternalTooltipMatchedItemThreshold;

interface InternalTooltipMatchedItemPoint {
  type: "point";
  x: number;
  y: number;
  series: InternalSeriesOptions;
}

interface InternalTooltipMatchedItemRange {
  type: "range";
  x: number;
  low: number;
  high: number;
  series: InternalSeriesOptions;
}

interface InternalTooltipMatchedItemThreshold {
  type: "all";
  x: number;
  series: InternalSeriesOptions;
}

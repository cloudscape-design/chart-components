// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces";
import { NonCancelableEventHandler } from "../internal/events";

// CartesianChartProps is the type for CartesianChart React component properties. Unlike in Highcharts API,
// we pass options directly to the component, instead of grouping them all into a single "options" property.
// We do still organize related options in groups, e.g.: "SeriesOptions", "TooltipOptions".
export interface CartesianChartProps extends CoreTypes.BaseChartOptions, CoreTypes.CoreCartesianOptions {
  /**
   * Inverts X and Y axes. Use it to show horizontal columns (bars).
   * This property corresponds to [chart.inverted](https://api.highcharts.com/highcharts/chart.inverted).
   */
  inverted?: boolean;

  /**
   * Enables series stacking behavior. Use it for column- or area- series.
   * This property corresponds to "normal" stacking type in Highcharts ([plotOptions.series.stacking](https://api.highcharts.com/highcharts/plotOptions.series.stacking)).
   */
  stacking?: "normal";

  /**
   * Chart series options.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
   * with two additional series types: "x-threshold", and "y-threshold".
   *
   * Supported types:
   * * [area](https://api.highcharts.com/highcharts/series.area).
   * * [areaspline](https://api.highcharts.com/highcharts/series.areaspline).
   * * [column](https://api.highcharts.com/highcharts/series.column).
   * * [errorbar](https://api.highcharts.com/highcharts/series.errorbar) - requires "highcharts/highcharts-more" module.
   * * [line](https://api.highcharts.com/highcharts/series.line).
   * * [scatter](https://api.highcharts.com/highcharts/series.scatter).
   * * [spline](https://api.highcharts.com/highcharts/series.spline).
   * * x-threshold - The line-like series to represent x-axis threshold (vertical, when `inverted=false`).
   * * y-threshold - The line-like series to represent y-axis threshold (horizontal, when `inverted=false`).
   */
  series: readonly CartesianChartProps.SeriesOptions[];

  /**
   * Chart tooltip options.
   *
   * Supported options:
   * * `enabled` - (optional, boolean) - Hides the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
   * * `placement` - (optional, "middle" | "outside") - Specifies preferred tooltip placement.
   * * `point` - (optional, function) - Customizes tooltip series point rendering.
   * * `header` - (optional, function) - Provides a custom tooltip header.
   * * `body` - (optional, function) - Provides a custom tooltip content.
   * * `footer` - (optional, function) - Adds a tooltip footer.
   */
  tooltip?: CartesianChartProps.TooltipOptions;

  /**
   * X-axis options.
   * This property corresponds to [xAxis](https://api.highcharts.com/highcharts/xAxis), and extends it
   * with a custom value formatter.
   *
   * Supported options:
   * * `title` (optional, string) - Axis title.
   * * `type` (optional, 'linear' | 'datetime' | 'category' | 'logarithmic') - Axis type.
   * * * linear - Uses continuous proportional values scale.
   * * * datetime - Similar to linear, but takes epoch time as values.
   * * * category - Uses discrete scale, requires `categories` to be set.
   * * * logarithmic - Uses continuous logarithmic values scale.
   * * `min` (optional, number) - Axis min value boundary.
   * * `max` (optional, number) - Axis max value boundary.
   * * `tickInterval` (optional, number) - Distance between axis ticks.
   * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip header.
   */
  xAxis?: CartesianChartProps.XAxisOptions;

  /**
   * Y-axis options.
   * This property corresponds to [xAxis](https://api.highcharts.com/highcharts/yAxis), and extends it
   * with a custom value formatter.
   *
   * Supported options:
   * * `title` (optional, string) - Axis title.
   * * `type` (optional, 'linear' | 'datetime' | 'category' | 'logarithmic') - Axis type.
   * * * linear - Uses continuous proportional values scale.
   * * * datetime - Similar to linear, but takes epoch time as values.
   * * * category - Uses discrete scale, requires `categories` to be set.
   * * * logarithmic - Uses continuous logarithmic values scale.
   * * `min` (optional, number) - Axis min value boundary.
   * * `max` (optional, number) - Axis max value boundary.
   * * `tickInterval` (optional, number) - Distance between axis ticks.
   * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
   * * `reversedStacks` (optional, boolean) - Reverts series order in stacked series.
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip series value.
   */
  yAxis?: CartesianChartProps.YAxisOptions;

  /**
   * Specifies visible series by their IDs. When unset, all series are visible by default, and the visibility state
   * is managed internally by the component. When a series does not have an ID, its name is used instead.
   * When the property is provided, use `onChangeVisibleSeries` to manage state updates.
   */
  visibleSeries?: readonly string[];

  /**
   * A callback, triggered when series visibility changes as result of user interacting with the legend or filter.
   */
  onChangeVisibleSeries?: NonCancelableEventHandler<{ visibleSeries: string[] }>;

  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CoreTypes.CartesianI18nStrings;
}

export namespace CartesianChartProps {
  export interface Ref {
    // Controls series visibility that works with both controlled and uncontrolled visibility mode.
    setVisibleSeries(visibleSeries: readonly string[]): void;
    // Same as `setVisibleSeries`, but applies to all series and requires no series IDs on input. This is useful when
    // implementing clear-filter action in no-match state.
    showAllSeries(): void;
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

  export type AreaSeriesOptions = CoreTypes.AreaSeriesOptions;
  export type AreaSplineSeriesOptions = CoreTypes.AreaSplineSeriesOptions;
  export type ColumnSeriesOptions = CoreTypes.ColumnSeriesOptions;
  export type ErrorBarSeriesOptions = CoreTypes.ErrorBarSeriesOptions;
  export type LineSeriesOptions = CoreTypes.LineSeriesOptions;
  export type ScatterSeriesOptions = CoreTypes.ScatterSeriesOptions;
  export type SplineSeriesOptions = CoreTypes.SplineSeriesOptions;
  export type XThresholdSeriesOptions = CoreTypes.XThresholdSeriesOptions;
  export type YThresholdSeriesOptions = CoreTypes.YThresholdSeriesOptions;

  interface AxisOptions {
    title?: string;
    type?: "linear" | "datetime" | "category" | "logarithmic";
    min?: number;
    max?: number;
    tickInterval?: number;
    categories?: string[];
    valueFormatter?: (value: null | number) => string;
  }

  export type XAxisOptions = AxisOptions;

  export interface YAxisOptions extends AxisOptions {
    reversedStacks?: boolean;
  }

  export interface TooltipOptions {
    enabled?: boolean;
    placement?: "middle" | "outside";
    size?: "small" | "medium" | "large";
    point?: (props: TooltipPointRenderProps) => TooltipPointFormatted;
    header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
    body?: (props: TooltipBodyRenderProps) => React.ReactNode;
    footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
  }
  export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
  export type TooltipBodyRenderProps = TooltipSlotRenderProps;
  export type TooltipFooterRenderProps = TooltipSlotRenderProps;
  export interface TooltipSlotRenderProps {
    x: number;
    items: TooltipPointItem[];
  }
  export interface TooltipPointRenderProps {
    item: TooltipPointItem;
  }
  export interface TooltipPointItem {
    x: number;
    y: number | null;
    errorRanges: { low: number; high: number; series: CartesianChartProps.ErrorBarSeriesOptions }[];
    series: NonErrorBarSeriesOptions;
  }
  export type TooltipPointFormatted = CoreTypes.TooltipPointFormatted;

  export type LegendOptions = CoreTypes.BaseLegendOptions;

  export type FilterOptions = CoreTypes.BaseFilterOptions;

  export type NoDataOptions = CoreTypes.BaseNoDataOptions;
}

// Internal types

export type NonErrorBarSeriesOptions = Exclude<
  CartesianChartProps.SeriesOptions,
  CartesianChartProps.ErrorBarSeriesOptions
>;

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces-core";
import * as SeriesTypes from "../core/interfaces-core-series";
import { NonCancelableEventHandler } from "../internal/events";

export interface CartesianChartProps extends CoreTypes.CloudscapeHighchartsBase {
  /**
   * Inverts X and Y axes. Use it to show horizontal columns (bars).
   * This property corresponds to [chart.inverted](https://api.highcharts.com/highcharts/chart.inverted).
   */
  inverted?: boolean;

  /**
   * Chart plot options.
   * This property corresponds to [plotOptions](https://api.highcharts.com/highcharts/plotOptions).
   *
   * Supported settings:
   * * `series` - Series options that apply to all series at once.
   * * * `stacking` (optional, 'normal') - Specifies series stacking behavior. Use it for stacked columns and areas.
   */
  plotOptions?: {
    series?: {
      stacking?: "normal";
    };
  };

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
   * * awsui-x-threshold - The line-like series to represent x-axis threshold (vertical, when `inverted=false`).
   * * awsui-y-threshold - The line-like series to represent y-axis threshold (horizontal, when `inverted=false`).
   */
  series: CartesianChartProps.Series[];

  /**
   * Chart tooltip that replaces [tooltip](https://api.highcharts.com/highcharts/tooltip).
   *
   * Supported properties:
   * * `title` - (optional, function) - Use it to provide a custom tooltip title.
   * * `content` - (optional, function) - Use it to provide a custom tooltip content.
   * * `footer` - (optional, function) - Use it to add a tooltip footer.
   * * `series` - (optional, function) - Use it to extend the default series list, in order to use custom value formatting,
   * inject links, or add expandable items.
   */
  tooltip?: CartesianChartProps.TooltipProps;

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
  xAxis?: CartesianChartProps.AxisProps;

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
  yAxis?: CartesianChartProps.AxisProps;

  /**
   * List of series IDs to be visible. When unset, all series are visible by default, but can be hidden by clicking on the
   * legend. When a series does not have an ID, a series name is used instead.
   * When the property is provided, use `onToggleVisibleSeries` to update it when the legend series filtering is used.
   */
  visibleSeries?: string[];

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
    // Makes all series visible when series visibility is not controlled.
    // This is useful for implementing "Clear filter" action of the no-match state.
    clearFilter(): void;
  }

  export type Series =
    | AreaSeries
    | AreaSplineSeries
    | ColumnSeries
    | ErrorBarSeries
    | LineSeries
    | ScatterSeries
    | SplineSeries
    | XThresholdSeries
    | YThresholdSeries;

  export type AreaSeries = SeriesTypes.AreaSeries;
  export type AreaSplineSeries = SeriesTypes.AreaSplineSeries;
  export type ColumnSeries = SeriesTypes.ColumnSeries;
  export type ErrorBarSeries = SeriesTypes.ErrorBarSeries;
  export type LineSeries = SeriesTypes.LineSeries;
  export type ScatterSeries = SeriesTypes.ScatterSeries;
  export type SplineSeries = SeriesTypes.SplineSeries;
  export type XThresholdSeries = SeriesTypes.XThresholdSeries;
  export type YThresholdSeries = SeriesTypes.YThresholdSeries;

  export interface AxisProps {
    title?: string;
    type?: "linear" | "datetime" | "category" | "logarithmic";
    min?: number;
    max?: number;
    tickInterval?: number;
    categories?: string[];
    valueFormatter?: (value: number) => string;
    valueDecimals?: number;
  }

  export type XAxisProps = AxisProps;

  export interface YAxisProps extends AxisProps {
    reversedStacks?: boolean;
  }

  export interface TooltipProps {
    series?: (detail: TooltipSeriesDetailItem) => TooltipSeriesFormatted;
    header?: (detail: TooltipDetails) => React.ReactNode;
    body?: (detail: TooltipDetails) => React.ReactNode;
    footer?: (detail: TooltipDetails) => React.ReactNode;
    placement?: "target" | "bottom";
  }

  export interface TooltipDetails {
    x: number;
    items: TooltipSeriesDetailItem[];
  }

  export type TooltipSeriesDetailItem =
    | TooltipSeriesDetailItemPoint
    | TooltipSeriesDetailItemRange
    | TooltipSeriesDetailItemThreshold;

  interface TooltipSeriesDetailItemPoint {
    type: "point";
    x: number;
    y: number;
    series: CartesianChartProps.Series;
  }

  interface TooltipSeriesDetailItemRange {
    type: "range";
    x: number;
    low: number;
    high: number;
    series: CartesianChartProps.Series;
  }

  interface TooltipSeriesDetailItemThreshold {
    type: "threshold";
    x: number;
    series: CartesianChartProps.Series;
  }

  export interface TooltipSeriesFormatted {
    key: React.ReactNode;
    value: React.ReactNode;
    expandable?: boolean;
    subItems?: ReadonlyArray<{ key: React.ReactNode; value: React.ReactNode }>;
  }

  export type NoDataProps = CoreTypes.ChartNoDataProps;
}

// The internal chart options allow propagation of all Highcharts properties, including series types and axes options,
// not supported by the public CartesianChart component.
// This is done to facilitate easier prototyping and fast adoption of more Highcharts features.
export type InternalCartesianChartOptions = Omit<Highcharts.Options, "series" | "xAxis" | "yAxis"> & {
  series: InternalSeriesOptions[];
  xAxis: InternalXAxisOptions[];
  yAxis: InternalYAxisOptions[];
};

export type InternalSeriesOptions = CartesianChartProps.Series | Highcharts.SeriesOptionsType;

export type InternalXAxisOptions = CartesianChartProps.XAxisProps & Highcharts.XAxisOptions;

export type InternalYAxisOptions = CartesianChartProps.YAxisProps & Highcharts.YAxisOptions;

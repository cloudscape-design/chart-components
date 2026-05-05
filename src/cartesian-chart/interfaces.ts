// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces";
import { NonCancelableEventHandler } from "../types/events";

// CartesianChartProps is the type for CartesianChart React component properties. Unlike in Highcharts API,
// we pass options directly to the component, instead of grouping them all into a single "options" property.
// We do still organize related options in groups, e.g.: "SeriesOptions", "TooltipOptions".
export interface CartesianChartProps
  extends CoreTypes.BaseChartOptions, CoreTypes.CoreCartesianOptions, CoreTypes.WithCartesianI18nStrings {
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
   * Defines series options of the chart.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
   * with two additional series types: "x-threshold", and "y-threshold".
   *
   * Supported types:
   * * [area](https://api.highcharts.com/highcharts/series.area).
   * * [areaspline](https://api.highcharts.com/highcharts/series.areaspline).
   * * [column](https://api.highcharts.com/highcharts/series.column).
   * * [errorbar](https://api.highcharts.com/highcharts/series.errorbar) - requires "highcharts/highcharts-more" module.
   * * [line](https://api.highcharts.com/highcharts/series.line).
   * * [bubble](https://api.highcharts.com/highcharts/series.bubble) - requires "highcharts/highcharts-more" module.
   * * [scatter](https://api.highcharts.com/highcharts/series.scatter).
   * * [spline](https://api.highcharts.com/highcharts/series.spline).
   * * x-threshold - The line-like series to represent x-axis threshold (vertical, when `inverted=false`).
   * * y-threshold - The line-like series to represent y-axis threshold (horizontal, when `inverted=false`).
   */
  series: readonly CartesianChartProps.SeriesOptions[];

  /**
   * Defines tooltip options of the chart, including:
   * * `enabled` - (optional, boolean) - Hides the tooltip when set to false.
   * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
   * * `placement` - (optional, "middle" | "outside") - Specifies preferred tooltip placement.
   * * `point` - (optional, function) - Customizes tooltip series point rendering.
   * * `header` - (optional, function) - Renders a custom tooltip header.
   * * `body` - (optional, function) - Renders a custom tooltip body.
   * * `footer` - (optional, function) - Renders a custom tooltip footer.
   */
  tooltip?: CartesianChartProps.TooltipOptions;

  /**
   * Defines options of the chart's x axis.
   * This property corresponds to [xAxis](https://api.highcharts.com/highcharts/xAxis), and extends it
   * with a custom value formatter.
   *
   * Supported options:
   * * `title` (optional, string) - Axis title.
   * * `type` (optional, "linear" | "datetime" | "category" | "logarithmic") - Axis type.
   * * * "linear" - Uses continuous proportional values scale.
   * * * "datetime" - Similar to linear, but takes epoch time as values.
   * * * "category" - Uses discrete scale, requires `categories` to be set.
   * * * "logarithmic" - Uses continuous logarithmic values scale.
   * * `min` (optional, number) - Axis min value boundary.
   * * `max` (optional, number) - Axis max value boundary.
   * * `tickInterval` (optional, number) - Distance between axis ticks.
   * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip header.
   */
  xAxis?: CartesianChartProps.XAxisOptions;

  /**
   * Defines options of the chart's y axis.
   * This property corresponds to [yAxis](https://api.highcharts.com/highcharts/yAxis), and extends it
   * with a custom value formatter.
   *
   * Use a single object for a single y axis, or a tuple of two objects for a dual-axis chart.
   * When using a tuple, both axes must have an `id`. The second axis is automatically rendered on the opposite (inline-end) side.
   * Series reference their axis by setting `yAxis` to the axis `id`.
   *
   * Supported options:
   * * `title` (optional, string) - Axis title.
   * * `type` (optional, "linear" | "datetime" | "category" | "logarithmic") - Axis type.
   * * * "linear" - Uses continuous proportional values scale.
   * * * "datetime" - Similar to linear, but takes epoch time as values.
   * * * "category" - Uses discrete scale, requires `categories` to be set.
   * * * "logarithmic" - Uses continuous logarithmic values scale.
   * * `min` (optional, number) - Axis min value boundary.
   * * `max` (optional, number) - Axis max value boundary.
   * * `tickInterval` (optional, number) - Distance between axis ticks.
   * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
   * * `reversedStacks` (optional, boolean) - Reverts series order in stacked series.
   * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
   * applies to the tooltip points values.
   */
  yAxis?: CartesianChartProps.YAxisOptions | [CartesianChartProps.YAxisWithId, CartesianChartProps.YAxisWithId];

  /**
   * One or multiple axes to provide size details formatting for bubble series.
   *
   * Supported options:
   * * `id` (optional, string) - Use it to connect axes with respective series when multiple size axes are present. The axis id must correspond `sizeAxis` property of the bubble series.
   * * `title` (string) - Axis title, shown in the tooltip details for bubble series.
   * * `valueFormatter` (optional, function) - Value formatter for `size` values of the bubble series data.
   */
  sizeAxis?: CartesianChartProps.SizeAxisOptions | readonly CartesianChartProps.SizeAxisOptions[];

  /**
   * Enables zoom functionality on the chart. When enabled, users can zoom into a range
   * on the x-axis using three interaction methods:
   *
   * 1. **Drag-to-zoom** — Click and drag on the chart plot area to select a range.
   * 2. **Zoom mode (click-based)** — A "Zoom" button appears in the top-right corner of the chart.
   *    Clicking it enters zoom mode where popovers are disabled. The first click on the chart sets
   *    the start point, and the second click sets the end point, zooming to that range. Direction
   *    buttons appear at the selection line for fine-tuning. Press Escape or click "Exit zoom" to cancel.
   * 3. **Keyboard zoom** — While focused on a data point, hold Shift and press Left/Right arrow keys
   *    to extend a selection range. Release Shift or press Enter to zoom. Press Escape to cancel.
   *
   * After zooming, a "Reset" button appears to restore the full data range.
   *
   * Supported options:
   * * `enabled` (optional, boolean) — Enables zoom functionality.
   * * `hideButtons` (optional, boolean) — Hides the built-in zoom control buttons (Zoom, Exit zoom, Reset).
   *   Use this when providing custom zoom UI via ref methods (`enterZoomMode`, `exitZoomMode`, `resetZoom`).
   */
  zoom?: CartesianChartProps.ZoomOptions;

  /**
   * Specifies which series to show using their IDs. By default, all series are visible and managed by the component.
   * If a series doesn't have an ID, its name is used. When using this property, manage state updates with `onVisibleSeriesChange`.
   */
  visibleSeries?: readonly string[];

  /**
   * A callback function, triggered when series visibility changes as a result of user interaction with the legend or filter.
   */
  onVisibleSeriesChange?: NonCancelableEventHandler<{ visibleSeries: string[] }>;

  /**
   * The current zoom range. When provided, the component operates in controlled mode.
   * Pass `null` to reset to full range. When omitted, zoom state is managed internally.
   */
  zoomRange?: CartesianChartProps.ZoomRange | null;

  /**
   * Called when the zoom range changes due to user interaction.
   * In controlled mode, update `zoomRange` in this handler.
   */
  onZoomRangeChange?: NonCancelableEventHandler<CartesianChartProps.ZoomChangeDetail>;
}

export namespace CartesianChartProps {
  export interface Ref {
    /**
     * Controls series visibility and works with both controlled and uncontrolled visibility modes.
     */
    setVisibleSeries(visibleSeries: readonly string[]): void;
    /**
     * Functions similarly to `setVisibleSeries`, but applies to all series and doesn't require series IDs as input.
     * Use this when implementing clear-filter actions in no-match states.
     */
    showAllSeries(): void;
    /**
     * Enters zoom mode. In zoom mode, popovers are disabled and clicks on the chart set zoom range points.
     */
    enterZoomMode(): void;
    /**
     * Exits zoom mode without applying zoom. Returns to the idle state.
     */
    exitZoomMode(): void;
    /**
     * Resets the zoom to show the full data range.
     */
    resetZoom(): void;
  }

  export type SeriesOptions =
    | AreaSeriesOptions
    | AreaSplineSeriesOptions
    | BubbleSeriesOptions
    | ColumnSeriesOptions
    | ErrorBarSeriesOptions
    | LineSeriesOptions
    | ScatterSeriesOptions
    | SplineSeriesOptions
    | XThresholdSeriesOptions
    | YThresholdSeriesOptions;

  export type AreaSeriesOptions = CoreTypes.AreaSeriesOptions;
  export type AreaSplineSeriesOptions = CoreTypes.AreaSplineSeriesOptions;
  export type BubbleSeriesOptions = CoreTypes.BubbleSeriesOptions;
  export type ColumnSeriesOptions = CoreTypes.ColumnSeriesOptions;
  export type ErrorBarSeriesOptions = CoreTypes.ErrorBarSeriesOptions;
  export type LineSeriesOptions = CoreTypes.LineSeriesOptions;
  export type ScatterSeriesOptions = CoreTypes.ScatterSeriesOptions;
  export type SplineSeriesOptions = CoreTypes.SplineSeriesOptions;
  export type XThresholdSeriesOptions = CoreTypes.XThresholdSeriesOptions;
  export type YThresholdSeriesOptions = CoreTypes.YThresholdSeriesOptions;

  interface AxisOptions {
    id?: string;
    title?: string;
    type?: "linear" | "datetime" | "category" | "logarithmic";
    min?: number;
    max?: number;
    tickInterval?: number;
    categories?: string[];
    valueFormatter?: (value: null | number) => string;
  }

  export interface SizeAxisOptions {
    id?: string;
    title: string;
    valueFormatter?: (value: null | number) => string;
  }

  export type XAxisOptions = AxisOptions;

  export interface YAxisOptions extends AxisOptions {
    reversedStacks?: boolean;
  }

  export interface YAxisWithId extends YAxisOptions {
    id: string;
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
    size?: number | null;
    errorRanges: { low: number; high: number; series: CartesianChartProps.ErrorBarSeriesOptions }[];
    series: NonErrorBarSeriesOptions;
  }
  export type TooltipPointFormatted = CoreTypes.BaseTooltipPointFormatted;

  export type SeriesZone = CoreTypes.SeriesZone;

  export type LegendOptions = CoreTypes.BaseLegendOptions;

  export type FilterOptions = CoreTypes.BaseFilterOptions;

  export type NoDataOptions = CoreTypes.BaseNoDataOptions;

  export interface ZoomOptions {
    /**
     * Enables zoom functionality. @defaultValue false
     */
    enabled?: boolean;
    /**
     * When set to `true`, hides all built-in zoom control buttons (Zoom, Exit zoom, Reset).
     * Use this when you want to provide your own zoom UI or control zoom programmatically via ref methods.
     */
    hideButtons?: boolean;
  }

  export interface ZoomRange {
    /** Start value of the x-axis zoomed range. */
    x?: { startValue: number; endValue: number };
  }

  export interface ZoomChangeDetail {
    /** The new zoom range, or `null` when zoom is reset to full range. */
    zoomRange: ZoomRange | null;
  }
}

// Internal types

export type NonErrorBarSeriesOptions = Exclude<
  CartesianChartProps.SeriesOptions,
  CartesianChartProps.ErrorBarSeriesOptions
>;

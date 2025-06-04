// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as BaseTypes from "../core/interfaces-base";
import { NonCancelableEventHandler } from "../internal/events";

export interface PieChartProps extends BaseTypes.BaseChartProps {
  /**
   * Chart series and data.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series).
   *
   * Supported series types:
   * * [pie](https://api.highcharts.com/highcharts/series.pie).
   * * donut - the pie series with predefined inner radius.
   */
  series: null | PieChartProps.SeriesOptions;

  /**
   * Chart tooltip that replaces [tooltip](https://api.highcharts.com/highcharts/tooltip).
   *
   * Supported properties:
   * * `enabled` - (optional, boolean) - Use it to hide the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Use it to specify max tooltip size.
   * * `placement` - (optional, "target" | "middle" | "outside") - Use it to specify preferred tooltip placement.
   * * `title` - (optional, function) - Use it to provide a custom tooltip title.
   * * `content` - (optional, function) - Use it to provide a custom tooltip content.
   * * `footer` - (optional, function) - Use it to add a tooltip footer.
   */
  tooltip?: PieChartProps.TooltipOptions;

  /**
   * Chart segment options.
   */
  segmentOptions?: PieChartProps.SegmentOptions;

  /**
   * List of segments IDs to be visible. When unset, all segments are visible by default, but can be hidden by clicking on the
   * legend. When a segment does not have an ID, a segment name is used instead.
   * When the property is provided, use `onChangeVisibleSegments` to update it when the legend segment filtering is used.
   */
  visibleSegments?: readonly string[];

  /**
   * A callback, executed when segments visibility is toggled by clicking on legend items.
   */
  onChangeVisibleSegments?: NonCancelableEventHandler<{ visibleSegments: string[] }>;

  /**
   * Inner title of the donut chart.
   */
  innerValue?: string;

  /**
   * Inner description of the donut chart.
   */
  innerDescription?: string;
}

export namespace PieChartProps {
  export interface Ref {
    // Controls segments visibility that works with both controlled and uncontrolled visibility mode.
    // This is useful to clear selected segments from no-match state.
    setVisibleSegments(visibleSegments: readonly string[]): void;
    showAllSegments(): void;
  }

  export type SeriesOptions = PieSeriesOptions | DonutSeriesOptions;

  export type PieSeriesOptions = BaseTypes.PieSeriesOptions;

  export type DonutSeriesOptions = BaseTypes.DonutSeriesOptions;

  export type PieSegmentOptions = BaseTypes.PieSegmentOptions;

  export type NoDataOptions = BaseTypes.ChartNoDataOptions;

  export interface TooltipOptions extends BaseTypes.ChartTooltipOptions {
    header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
    body?: (props: TooltipBodyRenderProps) => React.ReactNode;
    footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
  }

  export interface SegmentOptions {
    title?: null | ((props: SegmentDescriptionTitleProps) => string);
    description?: null | ((props: SegmentDescriptionRenderProps) => string);
  }

  export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
  export type TooltipBodyRenderProps = TooltipSlotRenderProps;
  export type TooltipFooterRenderProps = TooltipSlotRenderProps;
  export interface TooltipSlotRenderProps {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }

  export type SegmentDescriptionTitleProps = SegmentDescriptionRenderProps;
  export interface SegmentDescriptionRenderProps {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }
}

export type InternalSeriesOptions = PieChartProps.SeriesOptions | Highcharts.SeriesOptionsType;

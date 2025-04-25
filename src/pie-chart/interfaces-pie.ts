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
   * When the property is provided, use `onToggleVisibleSegment` to update it when the legend segment filtering is used.
   */
  visibleSegments?: string[];

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
    clearFilter(): void;
  }

  export type SeriesOptions = PieSeriesOptions | DonutSeriesOptions;

  export type PieSeriesOptions = BaseTypes.PieSeriesOptions;

  export type DonutSeriesOptions = BaseTypes.DonutSeriesOptions;

  export type PieDataItem = BaseTypes.PieDataItemOptions;

  export type NoDataOptions = BaseTypes.ChartNoDataOptions;

  export interface TooltipOptions extends BaseTypes.ChartTooltipOptions {
    header?: (detail: PieChartProps.TooltipHeaderRenderProps) => React.ReactNode;
    body?: (detail: PieChartProps.TooltipBodyRenderProps) => React.ReactNode;
    footer?: (detail: PieChartProps.TooltipFooterRenderProps) => React.ReactNode;
  }

  export interface SegmentOptions {
    title?: null | ((detail: PieChartProps.SegmentDescriptionTitleProps) => string);
    description?: null | ((detail: PieChartProps.SegmentDescriptionRenderProps) => string);
  }

  export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
  export type TooltipBodyRenderProps = TooltipSlotRenderProps;
  export type TooltipFooterRenderProps = TooltipSlotRenderProps;
  interface TooltipSlotRenderProps {
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

// The internal chart options allow propagation of all Highcharts properties.
// This is done to facilitate easier prototyping and fast adoption of more Highcharts features.
export type InternalPieChartOptions = Omit<Highcharts.Options, "series"> & {
  series: InternalSeriesOptions[];
};

export type InternalSeriesOptions = PieChartProps.SeriesOptions | Highcharts.SeriesOptionsType;

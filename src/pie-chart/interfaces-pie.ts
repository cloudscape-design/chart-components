// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces-core";
import * as SeriesTypes from "../core/interfaces-core-series";
import { NonCancelableEventHandler } from "../internal/events";

export interface PieChartProps extends CoreTypes.CloudscapeHighchartsBase {
  /**
   * Chart series and data.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series).
   *
   * Supported series types:
   * * [pie](https://api.highcharts.com/highcharts/series.pie).
   * * donut - the pie series with predefined inner radius.
   */
  series: null | PieChartProps.Series;

  /**
   * Chart tooltip that replaces [tooltip](https://api.highcharts.com/highcharts/tooltip).
   *
   * Supported properties:
   * * `title` - (optional, function) - Use it to provide a custom tooltip title.
   * * `content` - (optional, function) - Use it to provide a custom tooltip content.
   * * `footer` - (optional, function) - Use it to add a tooltip footer.
   */
  tooltip?: PieChartProps.TooltipProps;

  /**
   * Chart segment settings.
   */
  segment?: PieChartProps.SegmentProps;

  /**
   * List of segments IDs to be visible. When unset, all segments are visible by default, but can be hidden by clicking on the
   * legend. When a segment does not have an ID, a segment name is used instead.
   * When the property is provided, use `onToggleVisibleSegment` to update it when the legend segment filtering is used.
   */
  visibleSegments?: string[];

  /**
   * A callback, executed when segments visibility is toggled by clicking on legend items.
   */
  onToggleVisibleSegment?: NonCancelableEventHandler<{ visibleSegments: string[] }>;

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

  export type Series = PieSeries | DonutSeries;

  export type PieSeries = SeriesTypes.PieSeries;

  export type DonutSeries = SeriesTypes.DonutSeries;

  export type PieDataItem = SeriesTypes.PieDataItem;

  export type NoDataProps = CoreTypes.ChartNoDataProps;

  export interface TooltipProps {
    title?: (detail: PieChartProps.TooltipDetails) => React.ReactNode;
    content?: (detail: PieChartProps.TooltipDetails) => React.ReactNode;
    footer?: (detail: PieChartProps.TooltipDetails) => React.ReactNode;
  }

  export interface SegmentProps {
    description?: (detail: PieChartProps.SegmentDescriptionDetail) => string;
  }

  export interface TooltipDetails {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }

  export interface SegmentDescriptionDetail {
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

export type InternalSeriesOptions = PieChartProps.Series | Highcharts.SeriesOptionsType;

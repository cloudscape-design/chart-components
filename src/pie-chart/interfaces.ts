// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces";
import { NonCancelableEventHandler } from "../internal/events";

// PieChartProps is the type for PieChart React component properties. Unlike in Highcharts API,
// we pass options directly to the component, instead of grouping them all into a single "options" property.
// We do still organize related options in groups, e.g.: "SeriesOptions", "TooltipOptions".
export interface PieChartProps extends CoreTypes.BaseChartOptions {
  /**
   * Chart series options.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
   * with an additional "donut" series type.
   *
   * Supported series types:
   * * [pie](https://api.highcharts.com/highcharts/series.pie).
   * * donut - the pie series with predefined inner radius.
   */
  series: null | PieChartProps.SeriesOptions;

  /**
   * Chart tooltip options.
   *
   * Supported options:
   * * `enabled` - (optional, boolean) - Use it to hide the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Use it to specify max tooltip size.
   * * `header` - (optional, function) - Use it to provide a custom tooltip header.
   * * `body` - (optional, function) - Use it to provide a custom tooltip content.
   * * `footer` - (optional, function) - Use it to add a tooltip footer.
   */
  tooltip?: PieChartProps.TooltipOptions;

  /**
   * List of segments IDs to be visible. When unset, all segments are visible by default, but can be hidden by clicking on the
   * legend. When a segment does not have an ID, a segment name is used instead.
   * When the property is provided, use `onChangeVisibleSegments` to update it when the legend segment filtering is used.
   */

  /**
   * Specifies visible segments by their IDs. When unset, all segments are visible by default, and the visibility state
   * is managed internally by the component. When a segment does not have an ID, its name is used instead.
   * When the property is provided, use `onChangeVisibleSegments` to manage state updates.
   */
  visibleSegments?: readonly string[];

  /**
   * A callback, triggered when segments visibility changes as result of user interacting with the legend or filter.
   */
  onChangeVisibleSegments?: NonCancelableEventHandler<{ visibleSegments: string[] }>;

  /**
   * Segment title.
   */
  segmentTitle?: (props: PieChartProps.SegmentTitleRenderProps) => string;

  /**
   * Segment description.
   */
  segmentDescription?: (props: PieChartProps.SegmentDescriptionRenderProps) => string;

  /**
   * Title of the inner chart area. Only supported for donut series.
   */
  innerAreaTitle?: string;

  /**
   * Description of the inner chart area. Only supported for donut series.
   */
  innerAreaDescription?: string;
}

export namespace PieChartProps {
  export interface Ref {
    // Controls segments visibility that works with both controlled and uncontrolled visibility mode.
    // This is useful to clear selected segments from no-match state.
    setVisibleSegments(visibleSegments: readonly string[]): void;
    showAllSegments(): void;
  }

  export type SeriesOptions = PieSeriesOptions | DonutSeriesOptions;

  export type PieSeriesOptions = CoreTypes.PieSeriesOptions;

  export type DonutSeriesOptions = CoreTypes.DonutSeriesOptions;

  export type PieSegmentOptions = CoreTypes.PieSegmentOptions;

  export type NoDataOptions = CoreTypes.ChartNoDataOptions;

  export interface TooltipOptions extends CoreTypes.ChartTooltipOptions {
    header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
    body?: (props: TooltipBodyRenderProps) => React.ReactNode;
    footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
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

  export type SegmentTitleRenderProps = SegmentDescriptionRenderProps;
  export interface SegmentDescriptionRenderProps {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }
}

export type InternalSeriesOptions = PieChartProps.SeriesOptions | Highcharts.SeriesOptionsType;

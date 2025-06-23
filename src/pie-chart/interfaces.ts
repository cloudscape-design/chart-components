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
   * * `enabled` - (optional, boolean) - Hides the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
   * * `details` - (optional, function) - Provides a list of key-value pairs as tooltip's body.
   * * `header` - (optional, function) - Provides a custom tooltip header.
   * * `body` - (optional, function) - Provides a custom tooltip content.
   * * `footer` - (optional, function) - Adds a tooltip footer.
   */
  tooltip?: PieChartProps.TooltipOptions;

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
   * Segment title renderer.
   */
  segmentTitle?: (props: PieChartProps.SegmentTitleRenderProps) => string;

  /**
   * Segment description renderer.
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

  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CoreTypes.PieI18nStrings;
}

export namespace PieChartProps {
  export interface Ref {
    // Controls segments visibility that works with both controlled and uncontrolled visibility mode.
    setVisibleSegments(visibleSegments: readonly string[]): void;
    // Same as `setVisibleSegments`, but applies to all segments and requires no segments IDs on input. This is useful when
    // implementing clear-filter action in no-match state.
    showAllSegments(): void;
  }

  export type SeriesOptions = PieSeriesOptions | DonutSeriesOptions;

  export type PieSeriesOptions = CoreTypes.PieSeriesOptions;

  export type DonutSeriesOptions = CoreTypes.DonutSeriesOptions;

  export type PieSegmentOptions = CoreTypes.PieSegmentOptions;

  export interface TooltipOptions {
    enabled?: boolean;
    size?: "small" | "medium" | "large";
    details?: (props: TooltipDetailsRenderProps) => readonly TooltipDetail[];
    header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
    body?: (props: TooltipBodyRenderProps) => React.ReactNode;
    footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
  }

  export type TooltipDetailsRenderProps = TooltipSlotRenderProps;
  export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
  export type TooltipBodyRenderProps = TooltipSlotRenderProps;
  export type TooltipFooterRenderProps = TooltipSlotRenderProps;
  interface TooltipSlotRenderProps {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }

  export interface TooltipDetail {
    key: React.ReactNode;
    value: React.ReactNode;
  }

  export type SegmentTitleRenderProps = SegmentDescriptionRenderProps;
  export interface SegmentDescriptionRenderProps {
    segmentId?: string;
    segmentName: string;
    segmentValue: number;
    totalValue: number;
  }

  export type LegendOptions = CoreTypes.BaseLegendOptions;

  export type FilterOptions = CoreTypes.BaseFilterOptions;

  export type NoDataOptions = CoreTypes.BaseNoDataOptions;
}

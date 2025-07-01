// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as CoreTypes from "../core/interfaces";
import { NonCancelableEventHandler } from "../internal/events";

// PieChartProps is the type for PieChart React component properties. Unlike in Highcharts API,
// we pass options directly to the component, instead of grouping them all into a single "options" property.
// We do still organize related options in groups, e.g.: "SeriesOptions", "TooltipOptions".
export interface PieChartProps extends CoreTypes.BaseChartOptions, CoreTypes.WithPieI18nStrings {
  /**
   * Defines series options of the chart.
   * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
   * with an additional "donut" series type.
   *
   * Supported series types:
   * * [pie](https://api.highcharts.com/highcharts/series.pie).
   * * donut - the pie series with predefined inner radius.
   */
  series: null | PieChartProps.SeriesOptions;

  /**
   * Defines tooltip options of the chart, including:
   * * `enabled` - (optional, boolean) - Hides the tooltip.
   * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
   * * `details` - (optional, function) - Provides a list of key-value pairs as tooltip's body.
   * * `header` - (optional, function) - Renders a custom tooltip header.
   * * `body` - (optional, function) - Renders a custom tooltip body.
   * * `footer` - (optional, function) - Renders a custom tooltip footer.
   */
  tooltip?: PieChartProps.TooltipOptions;

  /**
   * Specifies which segments to show using their IDs. By default, all segments are visible and managed by the component.
   * If a segment doesn't have an ID, its name is used. When using this property, manage state updates with `onVisibleSegmentsChange`.
   */
  visibleSegments?: readonly string[];

  /**
   * A callback function, triggered when segments visibility changes as a result of user interaction with the legend or filter.
   */
  onVisibleSegmentsChange?: NonCancelableEventHandler<{ visibleSegments: string[] }>;

  /**
   * A function that determines the title of a segment displayed on the chart. The title appears above the segment
   * description defined by `segmentDescription`. By default, it displays the segment name. You can hide the title
   * by returning an empty string from the function.
   */
  segmentTitle?: (props: PieChartProps.SegmentTitleRenderProps) => string;

  /**
   * A function determining the segment description displayed on the chart below the segment title.
   */
  segmentDescription?: (props: PieChartProps.SegmentDescriptionRenderProps) => string;

  /**
   * Title displayed in the donut chart's inner area.
   */
  innerAreaTitle?: string;

  /**
   * Description text displayed in the donut chart's inner area.
   */
  innerAreaDescription?: string;
}

export namespace PieChartProps {
  export interface Ref {
    /**
     * Controls segments visibility and works with both controlled and uncontrolled visibility modes.
     */
    setVisibleSegments(visibleSegments: readonly string[]): void;
    /**
     * Functions similarly to `setVisibleSeries`, but applies to all series and doesn't require series IDs as input.
     * Use this when implementing clear-filter actions in no-match states.
     */
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

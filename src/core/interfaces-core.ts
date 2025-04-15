// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";
import {
  BaseChartProps,
  BaseI18nStrings,
  BaseLegendProps,
  BaseNoDataProps,
  BaseTooltipProps,
  Point,
} from "./interfaces-base";

export interface CloudscapeHighchartsProps
  extends Pick<BaseChartProps, "fitHeight" | "chartMinHeight" | "chartMinWidth"> {
  /**
   * The Highcharts instance. When null, the fallback() is rendered instead.
   */
  highcharts: null | object;
  /**
   * The Highcharts options. Cloudscape injects custom styles and settings, but all can be
   * overridden with explicitly provided options. An exception is event handlers - those are
   * not overridden, but merged with Cloudscape event handlers so that both are getting called.
   */
  options: Highcharts.Options;
  /**
   * The Cloudscape tooltip, that comes with a vertical cursor when used on cartesian series.
   * The tooltip content is only shown when `getContent` property is defined, which is called
   * for each visited { x, y } point.
   */
  tooltip?: CoreTooltipProps;
  /**
   * The Cloudscape legend, that is rendered outside the Highcharts container. It uses Cloudscape markers
   * and menu actions.
   */
  legend?: CoreLegendProps;
  /**
   * Represents chart's empty, no-match, loading, and error states. It requires the Highcharts nodata module.
   */
  noData?: CoreNoDataProps;
  /**
   * Custom content to be rendered when `highcharts=null`. It defaults to a spinner.
   */
  fallback?: React.ReactNode;
  /**
   * The callback to init the chart's API when it is ready. The API includes the Highcharts chart object, and
   * additional Cloudscape methods:
   * - `showTooltipOnPoint(Highcharts.Point)` - shows Cloudscape tooltip for the given point, if tooltip content is defined.
   * - `hideTooltip()` - hides Cloudscape tooltip until the next user event or `showTooltipOnPoint(point)` call.
   */
  callback?: (chart: CloudscapeChartAPI) => void;
  /**
   * The list of series or points IDs that should be hidden (using Highcharts `item.setVisible(false)`).
   * When the item ID is not set, the name is used instead.
   */
  hiddenItems?: string[];
  /**
   * A callback triggered when clicking on a legend item.
   */
  onItemVisibilityChange?: (hiddenItems: string[]) => void;
  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CoreI18nStrings;
  /**
   * This is used to provide a test-utils selector. Do not use this property to provide custom styles.
   */
  className?: string;

  // TODO: document
  verticalAxisTitlePlacement?: "top" | "side";
}

export interface CloudscapeChartAPI {
  chart: Highcharts.Chart;
  highcharts: typeof Highcharts;
  showTooltipOnPoint(point: Highcharts.Point): void;
  hideTooltip(): void;
}

export interface CoreTooltipProps extends BaseTooltipProps {
  getContent?: (point: Point) => null | CoreTooltipContent;
}

export interface CoreLegendProps extends BaseLegendProps {
  getItemStatus?: (seriesOrItemId: string) => ChartSeriesMarkerStatus;
}

export type CoreNoDataProps = BaseNoDataProps;

export interface CoreTooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

export type CoreI18nStrings = BaseI18nStrings;

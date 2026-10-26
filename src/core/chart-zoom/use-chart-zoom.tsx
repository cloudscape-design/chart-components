// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from "react";
import type Highcharts from "highcharts";

import LiveRegion from "@cloudscape-design/components/live-region";

import { fireNonCancelableEvent } from "../../internal/events";
import { InternalZoomProps, ZoomRange } from "./interfaces";
import { getZoomAffordanceOptions } from "./zoom-affordance";
import ZoomControls from "./zoom-controls";
import { useZoomI18n } from "./zoom-i18n";
import { getSeriesMinRange, hasColumnLikeSeries, SeriesOptionsLike } from "./zoom-values";

interface ZoomExtremes {
  min: number;
  max: number;
}

interface UseChartZoomProps extends InternalZoomProps {
  // Series options, used to derive the axis minRange. Taken from the options rather than from the chart,
  // because the value is needed to render the chart in the first place.
  series: undefined | readonly SeriesOptionsLike[];
  // The default series type, which applies to the series that do not declare one.
  chartType?: string;
  // The chart's root element, used to move focus to the chart once the reset button is gone.
  rootRef: React.RefObject<HTMLElement>;
}

export interface ChartZoom {
  // True when zooming is enabled with the zoom property.
  enabled: boolean;
  // Merges the zoomed range into the first x axis' options.
  getXAxisZoomOptions: (xAxisOptions: Highcharts.XAxisOptions) => Highcharts.XAxisOptions;
  // Plot options for error bar series, merged under the ones the consumer declared.
  errorBarOptions: Highcharts.PlotErrorbarOptions;
  controls: null | React.ReactNode;
  liveRegion: null | React.ReactNode;
}

// Zooming into a range of the x axis. The range is controlled by the consumer with the zoomRange property,
// and the chart marks it on the plot and offers to reset it.
export function useChartZoom({
  zoom,
  zoomRange,
  onZoomRangeChange,
  series,
  chartType,
  rootRef,
}: UseChartZoomProps): ChartZoom {
  const i18n = useZoomI18n();
  const enabled = zoom?.enabled ?? false;
  const [announcement, setAnnouncement] = useState("");
  // Set when the reset button is pressed. The button is removed once the consumer applies the reset, and
  // focus would then fall to the document body, so it is moved to the chart instead.
  const focusAfterResetRef = useRef(false);

  const extremes = extremesFromRange(zoomRange);
  const zoomed = extremes !== null;
  const minRange = useMemo(() => (enabled ? getSeriesMinRange(series) : undefined), [enabled, series]);
  const columnLike = useMemo(() => hasColumnLikeSeries(series, chartType), [series, chartType]);

  useEffect(() => {
    if (!zoomed && focusAfterResetRef.current) {
      focusAfterResetRef.current = false;
      rootRef.current?.querySelector<HTMLElement>('[role="application"]')?.focus();
    }
  }, [zoomed, rootRef]);

  function resetZoom() {
    focusAfterResetRef.current = true;
    setAnnouncement(i18n.zoomResetAnnouncementText);
    fireNonCancelableEvent(onZoomRangeChange, { zoomRange: null });
  }

  return {
    enabled,
    getXAxisZoomOptions: (xAxisOptions) =>
      enabled
        ? {
            // A minRange the consumer declared takes precedence over the one derived from the data.
            minRange: xAxisOptions.minRange ?? minRange,
            // Highcharts reads null as "no bound", so the zoomed range can be cleared by rendering the
            // axis without one, falling back to the bounds the consumer defined.
            min: extremes ? extremes.min : (xAxisOptions.min ?? null),
            max: extremes ? extremes.max : (xAxisOptions.max ?? null),
            // While zoomed, the range is marked with a band and a boundary line at each end.
            ...getZoomAffordanceOptions(xAxisOptions, extremes),
          }
        : {},
    // Error bars are drawn like columns, so Highcharts pads the axis by half a point range on each side for
    // them, and the plot then shows more than the zoomed range. Without bars in the chart there is nothing
    // that needs that room, so the error bars are placed on their x values instead, which removes the padding.
    errorBarOptions: enabled && !columnLike ? { pointPlacement: "on" } : {},
    controls: enabled && zoomed && !zoom?.hideButtons ? <ZoomControls i18n={i18n} onResetZoom={resetZoom} /> : null,
    liveRegion: enabled ? <LiveRegion hidden={true}>{announcement}</LiveRegion> : null,
  };
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

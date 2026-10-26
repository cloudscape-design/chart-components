// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from "react";
import type Highcharts from "highcharts";

import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";
import LiveRegion from "@cloudscape-design/components/live-region";

import { fireNonCancelableEvent } from "../../internal/events";
import { InternalZoomProps, ZoomRange } from "./interfaces";
import { getZoomAffordanceOptions } from "./zoom-affordance";
import ZoomControls from "./zoom-controls";
import { useZoomI18n } from "./zoom-i18n";
import { hasColumnLikeSeries } from "./zoom-values";

interface ZoomExtremes {
  min: number;
  max: number;
}

interface UseChartZoomProps extends InternalZoomProps {
  // Series options, used to tell whether the chart draws bars.
  series: undefined | readonly object[];
  // The default series type, which applies to the series that do not declare one.
  chartType?: string;
  // Moves focus to the chart, once the reset button that held it is removed.
  focusChart: () => void;
}

export interface ChartZoom {
  // True when zooming is enabled with the zoom property.
  enabled: boolean;
  // True once zoom has been enabled. Highcharts merges option updates into the previous options, so the
  // zoom keeps declaring the options it sets after it is disabled, to give the consumer's values back.
  managesXAxis: boolean;
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
  focusChart,
}: UseChartZoomProps): ChartZoom {
  const i18n = useZoomI18n();
  const enabled = zoom?.enabled ?? false;
  const [announcement, setAnnouncement] = useState("");
  // Set when the reset button is pressed, and handled once the consumer applies the reset: the reset is
  // announced then, and not before. Focus is moved to the chart only if it was lost with the removed button.
  const resetRequestedRef = useRef(false);
  const [managesXAxis, setManagesXAxis] = useState(enabled);
  if (enabled && !managesXAxis) {
    setManagesXAxis(true);
  }

  const extremes = enabled ? extremesFromRange(zoomRange) : null;
  const columnLike = useMemo(() => hasColumnLikeSeries(series, chartType), [series, chartType]);
  const onFocusChart = useStableCallback(focusChart);
  const resetAnnouncement = i18n.zoomResetAnnouncementText;
  const zoomedMin = extremes?.min;
  const zoomedMax = extremes?.max;

  useEffect(() => {
    const resetRequested = resetRequestedRef.current;
    resetRequestedRef.current = false;
    if (zoomedMin !== undefined || zoomedMax !== undefined) {
      // A new zoom clears the previous reset announcement, so that the next reset is announced again.
      setAnnouncement("");
    } else if (resetRequested) {
      setAnnouncement(resetAnnouncement);
      if (!document.activeElement || document.activeElement === document.body) {
        onFocusChart();
      }
    }
  }, [zoomedMin, zoomedMax, resetAnnouncement, onFocusChart]);

  function resetZoom() {
    resetRequestedRef.current = true;
    fireNonCancelableEvent(onZoomRangeChange, { zoomRange: null });
  }

  return {
    enabled,
    managesXAxis,
    getXAxisZoomOptions: (xAxisOptions) =>
      managesXAxis
        ? {
            // Highcharts widens any range narrower than five times the closest point distance unless the
            // axis declares a minRange. Zero lets the chart show the range it is given.
            minRange: enabled ? (xAxisOptions.minRange ?? 0) : xAxisOptions.minRange,
            // Highcharts reads null as "no bound", so the zoomed range is cleared by rendering the axis
            // without one, falling back to the bounds the consumer defined.
            min: extremes ? extremes.min : (xAxisOptions.min ?? null),
            max: extremes ? extremes.max : (xAxisOptions.max ?? null),
            // While zoomed, the range is marked with a band and a boundary line at each end.
            ...getZoomAffordanceOptions(xAxisOptions, extremes),
          }
        : {},
    // Error bars are drawn like columns, so Highcharts pads the axis by half a point range on each side for
    // them, and the plot then shows more than the zoomed range. Without bars in the chart there is nothing
    // that needs that room, so the error bars are placed on their x values instead, which removes the padding.
    errorBarOptions: managesXAxis ? { pointPlacement: enabled && !columnLike ? "on" : undefined } : {},
    controls: extremes && !zoom?.hideZoomControls ? <ZoomControls i18n={i18n} onResetZoom={resetZoom} /> : null,
    liveRegion: enabled ? <LiveRegion hidden={true}>{announcement}</LiveRegion> : null,
  };
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

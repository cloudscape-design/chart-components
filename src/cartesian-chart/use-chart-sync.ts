// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef } from "react";

import { CartesianChartProps } from "./interfaces";

export interface UseChartSyncOptions {
  /** Master toggle to enable/disable all sync. @defaultValue true */
  enabled?: boolean;
  /** Sync crosshair position across charts. @defaultValue true */
  crosshair?: boolean;
  /** Sync legend highlight across charts. @defaultValue true */
  highlight?: boolean;
  /** Sync zoom range across charts. @defaultValue true */
  zoom?: boolean;
  /** Sync series visibility across charts. @defaultValue true */
  visibility?: boolean;
}

/**
 * Hook that synchronizes multiple CartesianChart instances purely via refs.
 * All sync events are handled internally — no props needed on the charts other than `ref`.
 *
 * @param refs Array of refs attached to each CartesianChart.
 * @param options Which interactions to sync (all enabled by default).
 */
export function useChartSync(
  refs: React.RefObject<CartesianChartProps.Ref | null>[],
  options: UseChartSyncOptions = {},
): void {
  const { enabled = true, crosshair = true, highlight = true, zoom = true, visibility = true } = options;
  const isBroadcasting = useRef(false);

  const broadcast = useCallback(
    (sourceIndex: number, action: (ref: CartesianChartProps.Ref) => void) => {
      if (!enabled || isBroadcasting.current) {
        return;
      }
      isBroadcasting.current = true;
      refs.forEach((ref, i) => {
        if (i !== sourceIndex && ref.current) {
          action(ref.current);
        }
      });
      isBroadcasting.current = false;
    },
    [enabled, refs],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const unsubscribes: (() => void)[] = [];

    const timer = setTimeout(() => {
      refs.forEach((ref, index) => {
        if (!ref.current) {
          return;
        }
        const unsub = ref.current.subscribe({
          onCrosshairChange: crosshair
            ? (detail) => broadcast(index, (r) => (detail ? r.setCrosshair(detail.xValue) : r.clearCrosshair()))
            : undefined,
          onHighlightChange: highlight
            ? (detail) => broadcast(index, (r) => (detail ? r.highlightSeries(detail.seriesId) : r.clearHighlight()))
            : undefined,
          onZoomChange: zoom
            ? (detail) =>
                broadcast(index, (r) => (detail ? r.setZoomRange(detail.startValue, detail.endValue) : r.resetZoom()))
            : undefined,
          onVisibleSeriesChange: visibility
            ? (detail) => broadcast(index, (r) => r.setVisibleSeries(detail.visibleSeries))
            : undefined,
        });
        unsubscribes.push(unsub);
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [refs, enabled, crosshair, highlight, zoom, visibility, broadcast]);
}

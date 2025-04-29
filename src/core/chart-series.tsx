// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef } from "react";
import type Highcharts from "highcharts";

import { getPointId, getSeriesId } from "./utils";

export function useChartSeries({ hiddenItems }: { hiddenItems?: readonly string[] }) {
  const chartRef = useRef<null | Highcharts.Chart>(null);

  const updateVisibility = useCallback((hiddenItemsIds: readonly string[]) => {
    if (!chartRef.current) {
      throw new Error("Invariant violation: updating series visibility before chart is ready.");
    }

    const hiddenItemsSet = new Set(hiddenItemsIds);

    let updatesCounter = 0;
    const getVisibleAndCount = (id: string, visible: boolean) => {
      const nextVisible = !hiddenItemsSet.has(id);
      updatesCounter += nextVisible !== visible ? 1 : 0;
      return nextVisible;
    };

    for (const series of chartRef.current.series) {
      series.setVisible(getVisibleAndCount(getSeriesId(series), series.visible), false);
      for (const point of series.data) {
        if (typeof point.setVisible === "function") {
          point.setVisible(getVisibleAndCount(getPointId(point), point.visible), false);
        }
      }
    }

    // The call `seriesOrPoint.setVisible(visible, false)` does not trigger the chart redraw, as it would otherwise
    // impact the performance. Instead, we trigger the redraw explicitly, if any change to visibility has been made.
    if (updatesCounter > 0) {
      chartRef.current.redraw();
    }
  }, []);

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const hiddenItemsIndex = hiddenItems ? hiddenItems.join("::") : null;
  useEffect(() => {
    if (chartRef.current && hiddenItemsIndex !== null) {
      updateVisibility(hiddenItemsIndex.split("::").filter(Boolean));
    }
  }, [hiddenItemsIndex, updateVisibility]);

  return {
    onChartReady: (chart: Highcharts.Chart) => {
      chartRef.current = chart;

      // The chart becomes ready after the first useEffect fires, so the initial visibility update must happen here.
      if (hiddenItems) {
        updateVisibility(hiddenItems);
      }
    },
  };
}

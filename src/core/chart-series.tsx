// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef } from "react";
import type Highcharts from "highcharts";

import { InternalCoreChartSeriesAPI } from "./interfaces-core";
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

  const seriesAPI: InternalCoreChartSeriesAPI = useMemo(() => {
    return {
      highlightMatchedItems: (itemId: string) => {
        if (!chartRef.current) {
          throw new Error("Invariant violation: using series API before chart is ready.");
        }

        for (const s of chartRef.current.series) {
          if (s.type !== "pie") {
            s.setState(getSeriesId(s) !== itemId ? "inactive" : "normal");
          }
          if (s.type === "pie") {
            for (const p of s.data) {
              p.setState(getPointId(p) !== itemId ? "inactive" : "normal");
            }
          }
        }
        // All plot lines that define ID, and this ID does not match the highlighted item are dimmed.
        iteratePlotLines(chartRef.current, (line) => {
          if (line.options.id && line.options.id !== itemId) {
            line.svgElem?.attr({ opacity: 0.4 });
          }
        });
      },
      clearItemsHighlight: () => {
        if (!chartRef.current) {
          throw new Error("Invariant violation: using series API before chart is ready.");
        }

        // When a legend item loses highlight we assume no series should be highlighted at that point,
        // so removing inactive state from all series, points, and plot lines.
        for (const s of chartRef.current.series) {
          s.setState("normal");
          for (const p of s.data) {
            p.setState("normal");
          }
        }
        iteratePlotLines(chartRef.current, (line) => {
          if (line.options.id) {
            line.svgElem?.attr({ opacity: 1 });
          }
        });
      },
    };
  }, []);

  // When series or items visibility change, we call setVisible Highcharts method on series and/or items
  // for the change to take an effect.
  const hiddenItemsIndex = hiddenItems ? hiddenItems.join("::") : null;
  useEffect(() => {
    if (chartRef.current && hiddenItemsIndex !== null) {
      updateVisibility(hiddenItemsIndex.split("::").filter(Boolean));
    }
  }, [hiddenItemsIndex, updateVisibility]);

  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    chartRef.current = this;

    // The chart becomes ready after the first useEffect fires, so the initial visibility update must happen here.
    if (hiddenItems) {
      updateVisibility(hiddenItems);
    }
  };

  return { options: { onChartRender }, api: seriesAPI };
}

// The `axis.plotLinesAndBands` API is not covered with TS.
function iteratePlotLines(chart: Highcharts.Chart, cb: (line: Highcharts.PlotLineOrBand) => void) {
  chart.axes.forEach((axis) => {
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => cb(line));
    }
  });
}

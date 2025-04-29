// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useRef } from "react";
import type Highcharts from "highcharts";

import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { ChartSeriesMarker, ChartSeriesMarkerType } from "../internal/components/series-marker";
import AsyncStore from "../internal/utils/async-store";
import { ChartLegendItem } from "./interfaces-base";
import { InternalCoreChartLegendAPI, RegisteredLegendAPI } from "./interfaces-core";
import { getPointColor, getPointId, getSeriesColor, getSeriesId, getSeriesMarkerType } from "./utils";

// The custom legend implementation does not rely on the Highcharts legend. When Highcharts legend is disabled,
// the chart object does not include information on legend items. Instead, we assume that all series but pie are
// shown in the legend, and all pie series points are shown in the legend. Each item be it a series or a point should
// have an ID, and all items with non-matched IDs are dimmed.

export function useLegend() {
  const legendStore = useRef(new LegendStore()).current;

  const legendRef = useRef<RegisteredLegendAPI>(null) as React.MutableRefObject<null | RegisteredLegendAPI>;

  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    legendStore.onChartRender(this);
  };

  const legendAPI: InternalCoreChartLegendAPI = useMemo(
    () => ({
      registerLegend: (legend) => (legendRef.current = legend),
      unregisterLegend: () => (legendRef.current = null),
      store: legendStore,
      legend: {
        highlightItems: (ids) => legendRef.current?.highlightItems(ids),
        clearHighlight: () => legendRef.current?.clearHighlight(),
      },
    }),
    [legendStore],
  );

  return { options: { onChartRender }, api: legendAPI };
}

class LegendStore extends AsyncStore<{ items: readonly ChartLegendItem[] }> {
  private _chart: null | Highcharts.Chart = null;
  private markersCache = new Map<string, React.ReactNode>();

  constructor() {
    super({ items: [] });
  }

  private get chart() {
    if (!this._chart) {
      throw new Error("Invariant violation: using legend API before initializing chart.");
    }
    return this._chart;
  }

  // The chart markers derive from type and color and are cached to avoid unnecessary renders,
  // and allow comparing them by reference.
  private renderMarker(type: ChartSeriesMarkerType, color: string): React.ReactNode {
    const key = `${type}:${color}`;
    const marker = this.markersCache.get(key) ?? <ChartSeriesMarker type={type} color={color} />;
    this.markersCache.set(key, marker);
    return marker;
  }

  public onChartRender = (chart: Highcharts.Chart) => {
    this._chart = chart;
    this.updateItemsIfNeeded();
  };

  private updateItemsIfNeeded() {
    const nextItems = this.computeLegendItems();
    const currentItems = this.get().items;
    if (!isEqualArrays(nextItems, currentItems, isEqualLegendItems)) {
      this.set(() => ({ items: nextItems }));
    }
  }

  private computeLegendItems() {
    const legendItems: ChartLegendItem[] = [];

    for (const s of this.chart.series) {
      if (s.type !== "pie") {
        const color = s.visible ? getSeriesColor(s) : colorTextInteractiveDisabled;
        legendItems.push({
          id: getSeriesId(s),
          name: s.name,
          marker: this.renderMarker(getSeriesMarkerType(s), color),
          visible: s.visible,
        });
      }

      for (const point of s.data) {
        if (s.type === "pie") {
          const color = s.visible ? getPointColor(point) : colorTextInteractiveDisabled;
          legendItems.push({
            id: getPointId(point),
            name: point.name,
            marker: this.renderMarker(getSeriesMarkerType(s), color),
            visible: point.visible,
          });
        }
      }
    }

    return legendItems;
  }
}

function isEqualArrays<T>(a: readonly T[], b: readonly T[], eq: (a: T, b: T) => boolean) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function isEqualLegendItems(a: ChartLegendItem, b: ChartLegendItem) {
  return a.id === b.id && a.name === b.name && a.marker === b.marker && a.visible === b.visible;
}

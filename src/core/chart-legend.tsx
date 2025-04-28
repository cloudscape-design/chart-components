// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useRef } from "react";
import type Highcharts from "highcharts";

import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";
import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { ChartSeriesMarker, ChartSeriesMarkerType } from "../internal/components/series-marker";
import AsyncStore from "../internal/utils/async-store";
import { ChartLegendItem, ChartLegendOptions } from "./interfaces-base";
import { ChartLegendRef, InternalCoreChartLegendAPI } from "./interfaces-core";
import { getPointColor, getPointId, getSeriesColor, getSeriesId, getSeriesMarkerType } from "./utils";

export function useLegend(
  legendProps?: ChartLegendOptions & {
    onItemVisibilityChange?: (hiddenItems: string[]) => void;
  },
) {
  const onItemVisibilityChangeCb = useStableCallback(legendProps?.onItemVisibilityChange ?? (() => {}));
  const legendStore = useRef(new LegendStore({ onItemVisibilityChange: onItemVisibilityChangeCb })).current;

  const legendRef = useRef<ChartLegendRef>(null) as React.MutableRefObject<null | ChartLegendRef>;

  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    legendStore.onChartRender(this);
  };

  const legendAPI: InternalCoreChartLegendAPI = useMemo(
    () => ({
      ref: (legend) => (legendRef.current = legend),
      store: legendStore,
      legend: {
        highlightItems: (ids) => legendRef.current?.highlightItems(ids),
        clearHighlight: () => legendRef.current?.clearHighlight(),
      },
      onItemVisibilityChange: legendStore.onItemVisibilityChange,
      onItemHighlightEnter: legendStore.onItemHighlightEnter,
      onItemHighlightExit: legendStore.onItemHighlightExit,
    }),
    [legendStore],
  );

  return { options: { onChartRender }, api: legendAPI };
}

class LegendStore extends AsyncStore<{ items: readonly ChartLegendItem[] }> {
  private _chart: null | Highcharts.Chart = null;
  private onItemVisibilityChangeCb?: (hiddenItems: string[]) => void;
  private markersCache = new Map<string, React.ReactNode>();

  constructor({ onItemVisibilityChange }: { onItemVisibilityChange: (hiddenItems: string[]) => void }) {
    super({ items: [] });
    this.onItemVisibilityChangeCb = onItemVisibilityChange;
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
    this.updateItemsIfNeeded(this.computeLegendItems());
  };

  public onItemHighlightEnter = (itemId: string) => {
    for (const s of this.chart.series) {
      if (s.type !== "pie") {
        s.setState(getSeriesId(s) !== itemId ? "inactive" : "normal");
      }
      if (s.type === "pie") {
        for (const p of s.data) {
          p.setState(getPointId(p) !== itemId ? "inactive" : "normal");
        }
      }
    }
    this.chart.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id && line.options.id !== itemId) {
          line.svgElem?.attr({ opacity: 0.4 });
        }
      });
    });
  };

  public onItemHighlightExit = () => {
    for (const s of this.chart.series) {
      s.setState("normal");
      for (const p of s.data) {
        p.setState("normal");
      }
    }
    this.chart.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id) {
          line.svgElem?.attr({ opacity: 1 });
        }
      });
    });
  };

  public onItemVisibilityChange = (hiddenItems: string[]) => {
    this.onItemVisibilityChangeCb?.(hiddenItems);
    const items = this.computeLegendItems();
    if (!isEqualArrays(items, this.get().items, isEqualLegendItems)) {
      this.set(() => ({ items }));
    }
  };

  private computeLegendItems() {
    const chart = this.chart;
    const legendItems: ChartLegendItem[] = [];

    for (const s of chart.series) {
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

  private updateItemsIfNeeded(nextItems: readonly ChartLegendItem[]) {
    const currentItems = this.get().items;
    if (!isEqualArrays(nextItems, currentItems, isEqualLegendItems)) {
      this.set(() => ({ items: nextItems }));
    }
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ChartSeriesMarker, ChartSeriesMarkerType } from "../../internal/components/series-marker";
import AsyncStore from "../../internal/utils/async-store";
import { isEqualArrays } from "../../internal/utils/utils";
import { ChartLegendItem } from "../interfaces-base";
import { InternalChartLegendItemSpec, ReactiveChartState } from "../interfaces-core";

// Handles reactive state the chart components can subscribe to.
export class ChartStore {
  private store = new AsyncStore<ReactiveChartState>({
    tooltip: { visible: false, pinned: false, point: null, group: [] },
    legend: { items: [] },
    noData: { container: null, noMatch: false },
    axes: { verticalAxesTitles: [] },
    chartLabel: "",
  });
  private markersCache = new Map<string, React.ReactNode>();

  public get = this.store.get.bind(this.store);
  public subscribe = this.store.subscribe.bind(this.store);
  public unsubscribe = this.store.unsubscribe.bind(this.store);

  public setTooltipPoint(point: Highcharts.Point, matchingGroup: Highcharts.Point[]) {
    this.store.set((prev) => ({ ...prev, tooltip: { visible: true, pinned: false, point, group: matchingGroup } }));
  }

  public setTooltipGroup(group: Highcharts.Point[]) {
    this.store.set((prev) => ({ ...prev, tooltip: { visible: true, pinned: false, point: null, group } }));
  }

  public hideTooltip() {
    this.store.set((prev) => ({ ...prev, tooltip: { ...prev.tooltip, visible: false, pinned: false } }));
  }

  public pinTooltip() {
    this.store.set((prev) => ({ ...prev, tooltip: { ...prev.tooltip, visible: true, pinned: true } }));
  }

  public setNoData(noData: ReactiveChartState["noData"]) {
    this.store.set((prev) => ({ ...prev, noData }));
  }

  public setLegendItems(nextItemSpecs: readonly InternalChartLegendItemSpec[]) {
    const currentItems = this.get().legend.items;
    const nextItems = nextItemSpecs.map(({ id, name, color, markerType, marker: customMarker, visible }) => {
      const marker = customMarker ?? this.renderMarker(markerType, color, visible);
      return { id, name, marker, visible };
    });
    if (!isEqualArrays(currentItems, nextItems, isEqualLegendItems)) {
      this.store.set((prev) => ({ ...prev, legend: { items: nextItems } }));
    }
  }

  public setVerticalAxesTitles(nextTitles: readonly string[]) {
    const currentTitles = this.get().axes.verticalAxesTitles;
    if (!isEqualArrays(currentTitles, nextTitles, (s1, s2) => s1 === s2)) {
      this.store.set((prev) => ({ ...prev, axes: { verticalAxesTitles: nextTitles } }));
    }
  }

  public setChartLabel(chartLabel: string) {
    this.store.set((prev) => ({ ...prev, chartLabel }));
  }

  // The chart markers derive from type and color and are cached to avoid unnecessary renders,
  // and allow comparing them by reference.
  private renderMarker(type: ChartSeriesMarkerType, color: string, visible: boolean): React.ReactNode {
    const key = `${type}:${color}:${visible}`;
    const marker = this.markersCache.get(key) ?? <ChartSeriesMarker type={type} color={color} visible={visible} />;
    this.markersCache.set(key, marker);
    return marker;
  }
}

function isEqualLegendItems(a: ChartLegendItem, b: ChartLegendItem) {
  return a.id === b.id && a.name === b.name && a.marker === b.marker && a.visible === b.visible;
}

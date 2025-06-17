// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarker, ChartSeriesMarkerType } from "../../internal/components/series-marker";
import AsyncStore from "../../internal/utils/async-store";
import { isEqualArrays } from "../../internal/utils/utils";
import { CoreLegendItem } from "../interfaces";
import { getChartLegendItems, getPointId, getSeriesId } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

// The reactive state is used to propagate changes in legend items to the core legend React component.
export interface ReactiveLegendState {
  items: readonly CoreLegendItem[];
}

// Chart helper that implements custom legend behaviors.
export class ChartExtraLegend extends AsyncStore<ReactiveLegendState> {
  private context: ChartExtraContext;
  private visibilityMode: "internal" | "external" = "external";

  constructor(context: ChartExtraContext) {
    super({ items: [] });
    this.context = context;
  }

  public onChartRender = () => {
    this.initLegend();
    this.updateItemsVisibility();
  };

  // If visible items are explicitly provided, we use them to update visibility of chart's series or points (by ID).
  // If not provided, the visibility state is managed internally.
  public updateItemsVisibility = () => {
    if (this.context.state.visibleItems) {
      this.visibilityMode = "external";
      updateItemsVisibility(this.context.chart(), this.get().items, this.context.state.visibleItems);
    } else {
      this.visibilityMode = "internal";
    }
  };

  // A callback to be called when items visibility changes from the outside or from the legend.
  public onItemVisibilityChange = (visibleItems: readonly string[]) => {
    const currentItems = this.get().items;
    const updatedItems = currentItems.map((i) => ({ ...i, visible: visibleItems.includes(i.id) }));
    if (this.visibilityMode === "internal") {
      this.updateLegendItems(updatedItems);
      updateItemsVisibility(this.context.chart(), this.get().items, visibleItems);
    }
    this.context.handlers.onVisibleItemsChange?.(updatedItems);
  };

  // Updates legend highlight state when chart's point is highlighted.
  public onHighlightPoint = (point: Highcharts.Point) => {
    const visibleItems = point.series.type === "pie" ? [getPointId(point)] : [getSeriesId(point.series)];
    this.onHighlightItems(visibleItems);
  };

  // Updates legend highlight state when chart's group of points is highlighted.
  public onHighlightGroup = (group: readonly Highcharts.Point[]) => {
    const visibleItems = group.map((point) => getSeriesId(point.series));
    this.onHighlightItems(visibleItems);
  };

  // Updates legend highlight state given an explicit list of item IDs. This is used to update state
  // when a legend item gets hovered or focused.
  public onHighlightItems = (highlightedItems: readonly string[]) => {
    const currentItems = this.get().items;
    const updatedItems = currentItems.map(({ ...i }) => ({ ...i, highlighted: highlightedItems.includes(i.id) }));
    this.updateLegendItems(updatedItems);
  };

  // Clears legend highlight state.
  public onClearHighlight = () => {
    const nextItems = this.get().items.map(({ ...item }) => ({ ...item, highlighted: false }));
    this.updateLegendItems(nextItems);
  };

  private initLegend = () => {
    const itemSpecs = getChartLegendItems(this.context.chart());
    const legendItems = itemSpecs.map(({ id, name, color, markerType, visible }) => {
      const marker = this.renderMarker(markerType, color, visible);
      return { id, name, marker, visible, highlighted: false };
    });
    this.updateLegendItems(legendItems);
  };

  private updateLegendItems = (nextItems: CoreLegendItem[]) => {
    function isLegendItemsEqual(a: CoreLegendItem, b: CoreLegendItem) {
      return (
        a.id === b.id &&
        a.name === b.name &&
        a.marker === b.marker &&
        a.visible === b.visible &&
        a.highlighted === b.highlighted
      );
    }
    if (!isEqualArrays(this.get().items, nextItems, isLegendItemsEqual)) {
      this.set(() => ({ items: nextItems }));
    }
  };

  // The chart markers derive from type and color and are cached to avoid unnecessary renders,
  // and allow comparing them by reference.
  private markersCache = new Map<string, React.ReactNode>();
  public renderMarker(type: ChartSeriesMarkerType, color: string, visible = true): React.ReactNode {
    const key = `${type}:${color}:${visible}`;
    const marker = this.markersCache.get(key) ?? <ChartSeriesMarker type={type} color={color} visible={visible} />;
    this.markersCache.set(key, marker);
    return marker;
  }
}

function updateItemsVisibility(
  chart: Highcharts.Chart,
  legendItems: readonly CoreLegendItem[],
  visibleItems?: readonly string[],
) {
  const availableItemsSet = new Set(legendItems.map((i) => i.id));
  const visibleItemsSet = new Set(visibleItems);

  let updatesCounter = 0;
  const getVisibleAndCount = (id: string, visible: boolean) => {
    const nextVisible = visibleItemsSet.has(id);
    updatesCounter += nextVisible !== visible ? 1 : 0;
    return nextVisible;
  };

  for (const series of chart.series) {
    if (availableItemsSet.has(getSeriesId(series))) {
      series.setVisible(getVisibleAndCount(getSeriesId(series), series.visible), false);
    }
    for (const point of series.data) {
      if (typeof point.setVisible === "function" && availableItemsSet.has(getPointId(point))) {
        point.setVisible(getVisibleAndCount(getPointId(point), point.visible), false);
      }
    }
  }

  // The call `seriesOrPoint.setVisible(visible, false)` does not trigger the chart redraw, as it would otherwise
  // impact the performance. Instead, we trigger the redraw explicitly, if any change to visibility has been made.
  if (updatesCounter > 0) {
    chart.redraw();
  }
}

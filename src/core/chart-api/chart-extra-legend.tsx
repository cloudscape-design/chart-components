// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarker, ChartSeriesMarkerType } from "../../internal/components/series-marker";
import AsyncStore from "../../internal/utils/async-store";
import { isEqualArrays } from "../../internal/utils/utils";
import { ChartLegendItem } from "../interfaces-base";
import { RegisteredLegendAPI } from "../interfaces-core";
import { getChartLegendItems, matchLegendItems, updateChartItemsVisibility } from "../utils";
import { ChartExtraContext } from "./chart-extra-context";

// The reactive state is used to propagate changes in legend items to the core legend React component.
export interface ReactiveLegendState {
  items: readonly ChartLegendItem[];
}

// Chart helper that implements custom legend behaviors.
export class ChartExtraLegend extends AsyncStore<ReactiveLegendState> {
  private context: ChartExtraContext;
  private registeredLegend: null | RegisteredLegendAPI = null;

  constructor(context: ChartExtraContext) {
    super({ items: [] });
    this.context = context;
  }

  public onChartRender = () => {
    this.initLegend();
    this.updateChartItemsVisibility(this.context.state.visibleItems);
  };

  public registerLegend = (legend: RegisteredLegendAPI) => {
    this.registeredLegend = legend;
  };

  public unregisterLegend = () => {
    this.registeredLegend = null;
  };

  public updateChartItemsVisibility = (visibleItems?: readonly string[]) => {
    if (visibleItems) {
      const currentVisibleItems = this.get().items;
      updateChartItemsVisibility(this.context.chart(), currentVisibleItems, visibleItems);
    }
  };

  public onItemVisibilityChange = (visibleItems: readonly string[]) => {
    const currentLegendItems = this.get().items;
    const updatedLegendItems = currentLegendItems.map((item) => ({ ...item, visible: visibleItems.includes(item.id) }));
    this.context.handlers.onLegendItemsChange?.(updatedLegendItems);
  };

  public highlightMatchedItems = (points: Highcharts.Point[]) => {
    const matchedLegendItems = new Set<string>();
    for (const point of points) {
      const matched = matchLegendItems(this.get().items, point);
      matched.forEach((m) => matchedLegendItems.add(m));
    }
    this.registeredLegend?.highlightItems([...matchedLegendItems]);
  };

  public clearHighlightedItems = () => {
    this.registeredLegend?.clearHighlight();
  };

  private initLegend = () => {
    const nextItemSpecs = getChartLegendItems(this.context.chart());
    const currentItems = this.get().items;
    const nextItems = nextItemSpecs.map(({ id, name, color, markerType, visible }) => {
      const marker = this.renderMarker(markerType, color, visible);
      return { id, name, marker, visible };
    });
    if (!isEqualArrays(currentItems, nextItems, isEqualLegendItems)) {
      this.set(() => ({ items: nextItems }));
    }
  };

  // The chart markers derive from type and color and are cached to avoid unnecessary renders,
  // and allow comparing them by reference.
  private markersCache = new Map<string, React.ReactNode>();
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

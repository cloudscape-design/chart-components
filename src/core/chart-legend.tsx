// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";

import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { ChartLegend as ChartLegendComponent, ChartLegendRef } from "../internal/components/chart-legend";
import { ChartSeriesMarker, ChartSeriesMarkerType } from "../internal/components/series-marker";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { ChartLegendOptions } from "./interfaces-base";
import { CloudscapeChartAPI } from "./interfaces-core";
import { getPointId, getSeriesId, getSeriesMarkerType } from "./utils";

interface LegendStateItemProps {
  id: string;
  name: string;
  color: string;
  markerType: ChartSeriesMarkerType;
  visible: boolean;
}

export function useLegend(
  getChart: () => CloudscapeChartAPI,
  legendProps?: ChartLegendOptions & {
    onItemVisibilityChange?: (hiddenItems: string[]) => void;
  },
) {
  const legendStore = useRef(new LegendStore(getChart)).current;
  legendStore.onItemVisibilityChangeCb = legendProps?.onItemVisibilityChange;

  const onChartRender = legendStore.onChartRender;
  const onItemVisibilityChange = legendStore.onItemVisibilityChange;
  const onItemHighlightEnter = legendStore.onItemHighlightEnter;
  const onItemHighlightExit = legendStore.onItemHighlightExit;

  return {
    options: { onChartRender },
    props: {
      legendStore,
      ...legendProps,
      onItemVisibilityChange,
      onItemHighlightEnter,
      onItemHighlightExit,
    },
    api: {
      highlightLegendItems: (ids: string[]) => legendStore.legendRef.highlightItems(ids),
      clearLegendHighlight: () => legendStore.legendRef?.clearHighlight(),
    },
  };
}

export function ChartLegend({
  legendStore,
  title,
  actions,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendOptions & {
  legendStore: LegendStore;
  onItemVisibilityChange: (visibleItems: string[]) => void;
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
}) {
  const legendItems = useSelector(legendStore, (state) => state.legendItems);
  return (
    <ChartLegendComponent
      ref={legendStore.legendRefCb}
      legendTitle={title}
      items={legendItems.map((item) => ({
        id: item.id,
        name: item.name,
        visible: item.visible,
        marker: (
          <ChartSeriesMarker
            key={item.id}
            color={item.visible ? item.color : colorTextInteractiveDisabled}
            type={item.markerType}
          />
        ),
      }))}
      actions={actions}
      onItemVisibilityChange={onItemVisibilityChange}
      onItemHighlightEnter={onItemHighlightEnter}
      onItemHighlightExit={onItemHighlightExit}
    />
  );
}

export class LegendStore extends AsyncStore<{ legendItems: LegendStateItemProps[] }> {
  private getAPI: () => CloudscapeChartAPI;
  public onItemVisibilityChangeCb?: (hiddenItems: string[]) => void;
  public legendRefCb = (ref: ChartLegendRef) => {
    this.legendRef = ref;
  };
  public legendRef: ChartLegendRef = { highlightItems: () => {}, clearHighlight: () => {} };

  constructor(getAPI: () => CloudscapeChartAPI) {
    super({ legendItems: [] });
    this.getAPI = getAPI;
  }

  private get api() {
    return this.getAPI();
  }

  public onChartRender = () => {
    const legendItems = this.computeLegendItems();

    if (!isEqualArrays(legendItems, this.get().legendItems, isEqualLegendItems)) {
      this.set(() => ({ legendItems }));
    }
  };

  public onItemHighlightEnter = (itemId: string) => {
    for (const s of this.api.chart.series) {
      if (s.type !== "pie") {
        s.setState(getSeriesId(s) !== itemId ? "inactive" : "normal");
      }
      if (s.type === "pie") {
        for (const p of s.data) {
          p.setState(getPointId(p) !== itemId ? "inactive" : "normal");
        }
      }
    }
    this.api.chart.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id && line.options.id !== itemId) {
          line.svgElem?.attr({ opacity: 0.4 });
        }
      });
    });
  };

  public onItemHighlightExit = () => {
    for (const s of this.api.chart.series) {
      s.setState("normal");
      for (const p of s.data) {
        p.setState("normal");
      }
    }
    this.api.chart.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id) {
          line.svgElem?.attr({ opacity: 1 });
        }
      });
    });
  };

  public onItemVisibilityChange = (hiddenItems: string[]) => {
    this.onItemVisibilityChangeCb?.(hiddenItems);
    const legendItems = this.computeLegendItems();
    if (!isEqualArrays(legendItems, this.get().legendItems, isEqualLegendItems)) {
      this.set(() => ({ legendItems }));
    }
  };

  private computeLegendItems() {
    const chart = this.api.chart;
    const legendItems: LegendStateItemProps[] = [];

    for (const s of chart.series) {
      if (s.type !== "pie") {
        legendItems.push({
          id: getSeriesId(s),
          name: s.name,
          color: typeof s.color === "string" ? s.color : "black",
          markerType: getSeriesMarkerType(s),
          visible: s.visible,
        });
      }

      for (const point of s.data) {
        if (s.type === "pie") {
          legendItems.push({
            id: getPointId(point),
            name: point.name,
            color: typeof point.color === "string" ? point.color : "black",
            markerType: getSeriesMarkerType(s),
            visible: point.visible,
          });
        }
      }
    }

    return legendItems;
  }
}

function isEqualArrays<T>(a: T[], b: T[], eq: (a: T, b: T) => boolean) {
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

function isEqualLegendItems(a: LegendStateItemProps, b: LegendStateItemProps) {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.color === b.color &&
    a.markerType === b.markerType &&
    a.visible === b.visible
  );
}

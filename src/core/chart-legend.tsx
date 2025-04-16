// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";

import Box from "@cloudscape-design/components/box";

import { ChartLegend as ChartLegendComponent, ChartLegendRef } from "../internal/components/chart-legend";
import { ChartSeriesMarkerStatus, ChartSeriesMarkerType } from "../internal/components/series-marker";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { CloudscapeChartAPI, CoreLegendProps } from "./interfaces-core";
import { getPointId, getSeriesId, getSeriesMarkerType } from "./utils";

interface LegendItemProps {
  id: string;
  name: string;
  color: string;
  markerType: ChartSeriesMarkerType;
  active: boolean;
}

export interface LegendAPI {
  highlightItem: (itemId: string) => void;
  clearHighlight: () => void;
}

export function useLegend(
  getChart: () => CloudscapeChartAPI,
  legendProps?: CoreLegendProps & {
    getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
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
      highlightItem: (itemId: string) => legendStore.legendRef.highlightItem(itemId),
      clearHighlight: () => legendStore.legendRef.clearHighlight(),
    } as LegendAPI,
  };
}

export function ChartLegend({
  legendStore,
  getItemStatus,
  title,
  infoTooltip,
  tooltipMode,
  placement,
  preferences,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: CoreLegendProps & {
  legendStore: LegendStore;
  onItemVisibilityChange: (visibleItems: string[]) => void;
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
}) {
  const legendItems = useSelector(legendStore, (state) => state.legendItems);
  return (
    <Box padding={{ horizontal: "m" }}>
      <ChartLegendComponent
        ref={legendStore.legendRefCb}
        legendTitle={title}
        items={legendItems.map((item) => ({
          id: item.id,
          name: item.name,
          color: item.color,
          active: item.active,
          type: item.markerType,
          status: getItemStatus?.(item.id),
        }))}
        infoTooltip={infoTooltip}
        tooltipMode={tooltipMode}
        placement={placement}
        preferences={preferences}
        onItemVisibilityChange={onItemVisibilityChange}
        onItemHighlightEnter={onItemHighlightEnter}
        onItemHighlightExit={onItemHighlightExit}
      />
    </Box>
  );
}

class LegendStore extends AsyncStore<{ legendItems: LegendItemProps[] }> {
  private getAPI: () => CloudscapeChartAPI;
  public onItemVisibilityChangeCb?: (hiddenItems: string[]) => void;
  public legendRefCb = (ref: ChartLegendRef) => {
    this.legendRef = ref;
  };
  public legendRef: ChartLegendRef = { highlightItem: () => {}, clearHighlight: () => {} };

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
    const legendItems: LegendItemProps[] = [];

    for (const s of chart.series) {
      if (s.type !== "pie") {
        legendItems.push({
          id: getSeriesId(s),
          name: s.name,
          color: typeof s.color === "string" ? s.color : "black",
          markerType: getSeriesMarkerType(s),
          active: s.visible,
        });
      }

      for (const point of s.data) {
        if (s.type === "pie") {
          legendItems.push({
            id: getPointId(point),
            name: point.name,
            color: typeof point.color === "string" ? point.color : "black",
            markerType: "large-circle",
            active: point.visible,
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

function isEqualLegendItems(a: LegendItemProps, b: LegendItemProps) {
  return (
    a.id === b.id && a.name === b.name && a.color === b.color && a.markerType === b.markerType && a.active === b.active
  );
}

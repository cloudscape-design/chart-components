// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useUniqueId } from "@dnd-kit/utilities";
import type Highcharts from "highcharts";

import { colorBackgroundLayoutMain } from "@cloudscape-design/design-tokens";

import { ChartSeriesMarkerG, ChartSeriesMarkerType } from "../internal/components/chart-series-marker";
import Portal from "../internal/components/portal";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { LegendMarkersProps } from "./interfaces-core";
import { getLegendItemType, getSimpleColor } from "./utils";

interface LegendItemProps {
  id: string;
  color: string;
  type: ChartSeriesMarkerType;
  container: Element;
}

// The custom legend markers override Highcharts legend markers. This is done for consistency with Cloudscape
// markers that we also use in the tooltip, and to provide additional customization.
// The Highcharts legend API does not allow overriding the markers explicitly, so we use legend.labelFormatter
// to render a fake TSPAN and then provide custom content using React portal. When overriding, we ensure the
// legend item sizes remain unchanged. We don't hide the original markers but overlay them with custom markers.

export function useLegendMarkers(
  highcharts: null | typeof Highcharts,
  getChart: () => Highcharts.Chart,
  legendMarkersProps?: LegendMarkersProps,
) {
  const markersId = useUniqueId("legend-markers");

  const legendMarkersStore = useRef(new LegendMarkersStore(getChart, markersId)).current;
  legendMarkersStore.highcharts = highcharts;

  const options: Highcharts.Options = {
    legend: {
      labelFormatter: function () {
        legendMarkersStore.onRenderLabel();
        return renderToStaticMarkup(
          <tspan>
            <tspan id={`${markersId}-${this.name}`}></tspan>
            <tspan>{this.name}</tspan>
          </tspan>,
        );
      },
    },
  };

  return { options, props: { legendMarkersStore, ...legendMarkersProps } };
}

export function ChartLegendMarkers({
  getItemStatus,
  legendMarkersStore,
}: LegendMarkersProps & { legendMarkersStore: LegendMarkersStore }) {
  const legendItems = useSelector(legendMarkersStore, (state) => state.legendItems);

  return (
    <>
      {legendItems.map((item) => (
        <Portal container={item.container} key={item.id}>
          <rect x={-1} y={4} width={18} height={18} fill={colorBackgroundLayoutMain}></rect>

          <g transform="translate(1, 6)">
            <ChartSeriesMarkerG type={item.type} color={item.color} status={getItemStatus?.(item.id)} />
          </g>
        </Portal>
      ))}
    </>
  );
}

class LegendMarkersStore extends AsyncStore<{ legendItems: LegendItemProps[] }> {
  public highcharts: null | typeof Highcharts = null;
  private getChart: () => Highcharts.Chart;
  private markersId: string;
  private timeoutId: null | number = null;

  constructor(getChart: () => Highcharts.Chart, markersId: string) {
    super({ legendItems: [] });
    this.getChart = getChart;
    this.markersId = markersId;
  }

  // This function is called for every legend item rendering, but we only need to compute the state once.
  // That is why we add a simple timeout-based debouncing - it ensures we don't cause many async state updates
  // unnecessarily.
  public onRenderLabel = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const highcharts = this.highcharts;
      const chartLegendItems = this.getChart().legend.allItems;
      const containers: Element[] = [];
      for (const container of Array.from(document.querySelectorAll(`[id*="${this.markersId}-"]`))) {
        const parent = container.parentElement?.parentElement?.parentElement;
        if (parent) {
          containers.push(parent);
        }
      }
      if (chartLegendItems.length === containers.length) {
        this.set(() => ({
          legendItems: chartLegendItems.map((item, index) => ({
            id: item.options.id ?? item.name ?? index.toString(),
            type: getLegendItemType(highcharts, item),
            color: getSimpleColor(item.color),
            container: containers[index],
          })),
        }));
      }
    }, 0) as unknown as number;
  };
}

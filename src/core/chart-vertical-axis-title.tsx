// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import Box from "@cloudscape-design/components/box";

import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { castArray } from "../internal/utils/utils";
import { CoreChartAPI } from "./interfaces-core";

// The custom no-data implementation relies on the Highcharts noData module.
// We render a custom empty DIV as `lang.noData` and then provide actual content using React portal.

export function useChartVerticalAxisTitle(
  getAPI: () => CoreChartAPI,
  { verticalAxisTitlePlacement }: { verticalAxisTitlePlacement?: "top" | "side" },
) {
  const verticalAxisTitleStore = useRef(new VerticalAxisTitleStore(getAPI)).current;

  const chartRender: Highcharts.ChartRenderCallbackFunction = verticalAxisTitleStore.onChartRender;

  const rendered =
    verticalAxisTitlePlacement === "top" ? (
      <VerticalAxisTitle
        verticalAxisTitlePlacement={verticalAxisTitlePlacement}
        verticalAxisTitleStore={verticalAxisTitleStore}
      />
    ) : null;

  return { options: { chartRender }, rendered };
}

export function VerticalAxisTitle({
  verticalAxisTitlePlacement = "top",
  verticalAxisTitleStore,
}: {
  verticalAxisTitlePlacement?: "top" | "side";
  verticalAxisTitleStore: VerticalAxisTitleStore;
}) {
  const titles = useSelector(verticalAxisTitleStore, (s) => s.titles);
  if (verticalAxisTitlePlacement === "side") {
    return null;
  }
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
      {titles.map((text, index) => (
        <Box key={index} fontWeight="bold" margin={{ bottom: "xxs" }}>
          {text}
        </Box>
      ))}
    </div>
  );
}

class VerticalAxisTitleStore extends AsyncStore<{ visible: boolean; titles: string[] }> {
  private getAPI: () => CoreChartAPI;

  constructor(getAPI: () => CoreChartAPI) {
    super({ visible: false, titles: [] });
    this.getAPI = getAPI;
  }

  public onChartRender: Highcharts.ChartRenderCallbackFunction = () => {
    const chart = this.getAPI().chart;
    const isInverted = !!chart.options.chart?.inverted;

    let titles: string[] = [];
    if (isInverted) {
      titles = (castArray(chart.options.xAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }
    if (!isInverted) {
      titles = (castArray(chart.options.yAxis) ?? [])
        .filter((axis) => axis.visible)
        .map((axis) => axis.title?.text ?? "")
        .filter(Boolean);
    }

    this.set(() => ({ visible: titles.length > 0, titles }));
  };
}

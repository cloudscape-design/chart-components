// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";

import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { StandaloneLegend, StandaloneLegendAPI } from "../../lib/components/internal-do-not-use/standalone-legend";
import { PageSettingsForm } from "../common/page-settings";
import { Page } from "../common/templates";

const series: Highcharts.SeriesOptionsType[] = [
  {
    name: "A",
    type: "line",
    data: [],
  },
  {
    name: "B",
    type: "line",
    data: [],
  },
  {
    name: "C",
    type: "line",
    data: [],
  },
  {
    name: "X",
    type: "scatter",
    data: [{ x: 1601012700000, y: 500000 }],
    marker: { symbol: "square" },
    showInLegend: false,
  },
];

export default function () {
  const legendAPI = useRef<StandaloneLegendAPI | null>(null);
  return (
    <Page
      title="Standalone legend demo"
      subtitle="The page demonstrates the use of the standalone legend."
      settings={
        <PageSettingsForm
          selectedSettings={["showLegend", "legendPosition", "showLegendTitle", "showLegendActions", "useFallback"]}
        />
      }
    >
      <SpaceBetween direction="vertical" size="m">
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => legendAPI.current?.clearHighlight()}>Clear Highlight</Button>
          <Button onClick={() => legendAPI.current?.highlightItems(["B"])}>Highlight B</Button>
          <Button onClick={() => legendAPI.current?.setItemsVisible(["B"])}>Set only B visible</Button>
          <Button onClick={() => legendAPI.current?.setItemsVisible(["A", "B", "C"])}>Set all visible</Button>
        </SpaceBetween>
        <StandaloneLegend
          series={series}
          callback={(api) => {
            legendAPI.current = api;
          }}
        />
      </SpaceBetween>
    </Page>
  );
}

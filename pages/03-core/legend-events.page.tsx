// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CoreLegend } from "../../lib/components/internal-do-not-use/core-legend";
import { Page } from "../common/templates";

// Sample legend items
const legendItems = [
  {
    id: "series-a",
    name: "Series A",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#1f77b4", borderRadius: 2 }} />,
    visible: true,
    highlighted: false,
  },
  {
    id: "series-b",
    name: "Series B",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#ff7f0e", borderRadius: 2 }} />,
    visible: true,
    highlighted: false,
  },
  {
    id: "series-c",
    name: "Series C",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#2ca02c", borderRadius: 2 }} />,
    visible: true,
    highlighted: false,
  },
];

export default function LegendEventsDemo() {
  // State for chart with exit handler
  const [highlightedItemWithExit, setHighlightedItemWithExit] = useState<string | null>(null);

  // State for chart without exit handler
  const [highlightedItemWithoutExit, setHighlightedItemWithoutExit] = useState<string | null>(null);

  const handleLegendItemHighlightWithExit = (event: { detail: { item: { name: string } } }) => {
    const itemName = event.detail.item.name;
    setHighlightedItemWithExit(itemName);
  };

  const handleLegendItemHighlightExitWithExit = () => {
    setHighlightedItemWithExit(null);
  };

  const handleLegendItemHighlightWithoutExit = (event: { detail: { item: { name: string } } }) => {
    const itemName = event.detail.item.name;
    setHighlightedItemWithoutExit(itemName);
  };

  // Note: No exit handler for the second chart to demonstrate the issue

  return (
    <Page
      title="Legend Events"
      subtitle="Demonstrates the difference between having onLegendItemHighlightExit and not having it"
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Chart WITH exit handler */}
        <Box>
          <SpaceBetween direction="vertical" size="m">
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Box variant="h2">Legend WITH onClearHighlight</Box>
              <Badge color={highlightedItemWithExit ? "blue" : "grey"}>
                {highlightedItemWithExit ? `Hovered: ${highlightedItemWithExit}` : "Not Hovered"}
              </Badge>
            </SpaceBetween>

            <CoreLegend
              items={legendItems}
              title="Legend with Exit Handler"
              ariaLabel="Legend with exit handler"
              onItemHighlight={handleLegendItemHighlightWithExit}
              onClearHighlight={handleLegendItemHighlightExitWithExit}
            />
          </SpaceBetween>
        </Box>

        {/* Chart WITHOUT exit handler */}
        <Box>
          <SpaceBetween direction="vertical" size="m">
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Box variant="h2">Legend WITHOUT onClearHighlight</Box>
              <Badge color={highlightedItemWithoutExit ? "red" : "grey"}>
                {highlightedItemWithoutExit ? `Stuck: ${highlightedItemWithoutExit}` : "Not Hovered"}
              </Badge>
            </SpaceBetween>

            <CoreLegend
              items={legendItems}
              title="Legend without Exit Handler"
              ariaLabel="Legend without exit handler"
              onItemHighlight={handleLegendItemHighlightWithoutExit}
              // Note: No onClearHighlight prop - this demonstrates the issue
            />
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";

import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CoreLegend } from "../../lib/components/internal-do-not-use/core-legend";
import { Page } from "../common/templates";

// Base legend items data
const baseLegendItems = [
  {
    id: "series-a",
    name: "Series A",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#1f77b4", borderRadius: 2 }} />,
    visible: true,
  },
  {
    id: "series-b",
    name: "Series B",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#ff7f0e", borderRadius: 2 }} />,
    visible: true,
  },
  {
    id: "series-c",
    name: "Series C",
    marker: <div style={{ width: 12, height: 12, backgroundColor: "#2ca02c", borderRadius: 2 }} />,
    visible: true,
  },
];

export default function LegendEventsDemo() {
  // State for tracking which item is highlighted in each legend
  const [highlightedItemWithExit, setHighlightedItemWithExit] = useState<string | null>(null);
  const [highlightedItemWithoutExit, setHighlightedItemWithoutExit] = useState<string | null>(null);

  // Create legend items with dynamic highlighted state for the legend WITH exit handler
  const legendItemsWithExit = useMemo(
    () =>
      baseLegendItems.map((item) => ({
        ...item,
        highlighted: item.name === highlightedItemWithExit,
      })),
    [highlightedItemWithExit],
  );

  // Create legend items with dynamic highlighted state for the legend WITHOUT exit handler
  const legendItemsWithoutExit = useMemo(
    () =>
      baseLegendItems.map((item) => ({
        ...item,
        highlighted: item.name === highlightedItemWithoutExit,
      })),
    [highlightedItemWithoutExit],
  );

  // Handler for legend WITH exit handler - controls both legends
  const handleLegendItemHighlightWithExit = (event: { detail: { item: { name: string } } }) => {
    const itemName = event.detail.item.name;
    setHighlightedItemWithExit(itemName);
    // Cross-control: also highlight the corresponding item in the other legend
    setHighlightedItemWithoutExit(itemName);
  };

  // Handler for exit event - only clears the legend WITH exit handler
  const handleLegendItemHighlightExitWithExit = () => {
    setHighlightedItemWithExit(null);
    // Cross-control: also clear the other legend (this shows proper bidirectional control)
    setHighlightedItemWithoutExit(null);
  };

  // Handler for legend WITHOUT exit handler - controls both legends
  const handleLegendItemHighlightWithoutExit = (event: { detail: { item: { name: string } } }) => {
    const itemName = event.detail.item.name;
    setHighlightedItemWithoutExit(itemName);
    // Cross-control: also highlight the corresponding item in the other legend
    setHighlightedItemWithExit(itemName);
  };

  // Note: No exit handler for the second legend - this demonstrates the issue

  return (
    <Page
      title="Legend Events"
      subtitle="Demonstrates the difference between having onLegendItemHighlightExit and not having it"
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Legend WITH exit handler */}
        <Box>
          <SpaceBetween direction="vertical" size="m">
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Box variant="h2">Legend WITH onClearHighlight (Controls Both)</Box>
              <Badge color={highlightedItemWithExit ? "blue" : "grey"}>
                {highlightedItemWithExit ? `Controlling: ${highlightedItemWithExit}` : "Not Controlling"}
              </Badge>
            </SpaceBetween>

            <CoreLegend
              items={legendItemsWithExit}
              title="Master Legend (Has Exit Handler)"
              ariaLabel="Legend with exit handler that controls both legends"
              onItemHighlight={handleLegendItemHighlightWithExit}
              onClearHighlight={handleLegendItemHighlightExitWithExit}
            />
          </SpaceBetween>
        </Box>

        {/* Legend WITHOUT exit handler */}
        <Box>
          <SpaceBetween direction="vertical" size="m">
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Box variant="h2">Legend WITHOUT onClearHighlight (Controls Both)</Box>
              <Badge color={highlightedItemWithoutExit ? "red" : "grey"}>
                {highlightedItemWithoutExit ? `Stuck Controlling: ${highlightedItemWithoutExit}` : "Not Controlling"}
              </Badge>
            </SpaceBetween>

            <CoreLegend
              items={legendItemsWithoutExit}
              title="Broken Legend (No Exit Handler)"
              ariaLabel="Legend without exit handler that controls both legends"
              onItemHighlight={handleLegendItemHighlightWithoutExit}
              // Note: No onClearHighlight prop - this demonstrates the issue
            />
          </SpaceBetween>
        </Box>

        <Alert type="success">
          <strong>Expected Behavior:</strong>
          <br />• <strong>Top Legend (With Exit Handler):</strong> When you hover and then move away, both legends clear
          their highlights properly - demonstrating proper bidirectional control.
          <br />• <strong>Bottom Legend (Without Exit Handler):</strong> When you hover and then move away, both legends
          remain stuck in the highlighted state - demonstrating the broken one-way control that the exit handler fixes.
          <br />
          <br />
          This shows how the exit handler is essential for proper cross-component communication and state management.
        </Alert>
      </SpaceBetween>
    </Page>
  );
}

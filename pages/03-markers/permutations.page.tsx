// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import SpaceBetween from "@cloudscape-design/components/space-between";
import {
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
} from "@cloudscape-design/design-tokens";

import { ChartSeriesMarker, ChartSeriesMarkerProps } from "../../lib/components/internal/components/series-marker";
import PermutationsView, { createPermutations } from "../common/permutations";
import { Page } from "../common/templates";
import { ScreenshotArea } from "../screenshot-area";

const permutationsForColors = [
  colorChartsPaletteCategorical1,
  colorChartsPaletteCategorical2,
  colorChartsPaletteCategorical3,
  colorChartsPaletteCategorical4,
  colorChartsPaletteCategorical5,
  colorChartsPaletteCategorical6,
  colorChartsPaletteCategorical7,
  colorChartsPaletteCategorical8,
  colorChartsPaletteCategorical9,
  colorChartsPaletteCategorical10,
].map((color) =>
  createPermutations<ChartSeriesMarkerProps>([
    {
      type: ["line", "dashed", "area", "large-circle", "circle", "square", "diamond", "triangle", "triangle-down"],
      color: [color],
      status: ["normal", "warning"],
    },
  ]),
);

export default function MarkerPermutations() {
  return (
    <Page
      title="Marker permutations"
      subtitle="This page lists all markers that we currently support. Each marker can have any color,
      and can be combined with a warning indicator. The markers are deliberately made similar to Highcharts
      markers, as we cannot override Highcharts markers in the legend."
    >
      <ScreenshotArea>
        <SpaceBetween size="m">
          {permutationsForColors.map((permutations, index) => (
            <PermutationsView
              key={index}
              permutations={permutations}
              render={(permutation) => <ChartSeriesMarker {...permutation} />}
              direction="horizontal"
            />
          ))}
        </SpaceBetween>
      </ScreenshotArea>
    </Page>
  );
}

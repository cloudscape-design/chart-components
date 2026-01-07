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
  colorChartsThresholdInfo,
  colorChartsThresholdNegative,
  colorChartsThresholdNeutral,
  colorChartsThresholdPositive,
} from "@cloudscape-design/design-tokens";

import { ChartSeriesMarker, ChartSeriesMarkerProps } from "../../lib/components/internal/components/series-marker";
import PermutationsView, { createPermutations } from "../common/permutations";
import { Page, PageSection } from "../common/templates";

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
  colorChartsThresholdInfo,
  colorChartsThresholdNegative,
  colorChartsThresholdNeutral,
  colorChartsThresholdPositive,
].map((color) =>
  createPermutations<ChartSeriesMarkerProps>([
    {
      type: [
        "line",
        "dashed",
        "large-square",
        "hollow-square",
        "circle",
        "square",
        "diamond",
        "triangle",
        "triangle-down",
      ],
      color: [color],
    },
  ]),
);

const permutationsForWarningColors = permutationsForColors.map((permutations) =>
  permutations.map((permutation) => ({ ...permutation, status: "warning" as const })),
);

export default function MarkerPermutations() {
  return (
    <Page title="Marker permutations" subtitle="This page lists all markers that we currently support.">
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

      <PageSection title="Warning state">
        <SpaceBetween size="m">
          {permutationsForWarningColors.map((permutations, index) => (
            <PermutationsView
              key={index}
              permutations={permutations}
              render={(permutation) => <ChartSeriesMarker {...permutation} />}
              direction="horizontal"
            />
          ))}
        </SpaceBetween>
      </PageSection>
    </Page>
  );
}

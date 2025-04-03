// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CodeSnippet } from "../common/code-snippet";
import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as AreaChartExample from "./examples/area-chart";

const TotalFooterGuidance = (
  <SpaceBetween size="s">
    <Box variant="span">See implementation of the custom total row tooltip footer in the new charts:</Box>

    <CodeSnippet
      content={`let areaChart = (
  <CartesianChart
    tooltip={{
      footer(detail) {
        return (
          <div>
            <hr />
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <span>Total</span>
              <span>{detail.items.reduce((sum, item) => sum + (item.type === "point" ? item.y : 0), 0)}</span>
            </div>
          </div>
        );
      },
    }}
    {...otherChartProps}
  />
);`}
    />
  </SpaceBetween>
);

export default function () {
  return (
    <Page title="Migration: Area charts">
      <PageSection
        title="Simple area chart"
        docs={{
          functional: {
            bullets: [
              `In the old area chart the tooltip features a total value row. In the new area chart the total row
                    can be added as a custom tooltip footer, but it is not available by default.`,
            ],
          },
          visualDesign: {
            bullets: [
              `In the old area- and line charts the series point markers are always circles. In the new charts
              the markers the point markers can vary, and by default depend on the series order.`,
            ],
          },
          behavior: {
            bullets: [
              `In the old area- and line charts it is possible to highlight the entire row, as well as individual data points.
              When highlighting a row the hollow markers are shown for each matched series. In the new charts only the closest
              marker is shown at a time, but all matched series are present in the tooltip.`,
            ],
          },
          implementation: {
            bullets: [{ content: TotalFooterGuidance }],
          },
        }}
      >
        <MigrationDemo
          examples={[
            {
              old: <AreaChartExample.ComponentOld hideFilter={true} />,
              new: <AreaChartExample.ComponentNew />,
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

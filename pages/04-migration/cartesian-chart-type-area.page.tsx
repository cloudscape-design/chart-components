// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CodeSnippet } from "../common/code-snippet";
import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as AreaChartExample from "./examples/area-chart";

const TotalFooterGuidance = (
  <SpaceBetween size="s">
    <Box variant="span">
      In the old area chart the tooltip features a total value row. In the new area chart the total row can be added as
      a custom tooltip footer, but it is not available by default.
    </Box>

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
              <span>{numberFormatter(detail.items.reduce((sum, item) => sum + (item.type === "point" ? item.y : 0), 0))}</span>
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
        title="Stacked area chart"
        docs={{
          behavior: {
            bullets: [
              `In the old charts one can highlight a row if the cursor is not close enough to any of the points. In the new charts
              the highlight always lands on the point. The series that contains the highlighted point is then highlighted in the plot
              and the legend.`,
            ],
          },
          visualDesign: {
            bullets: [
              `In the old area- and line charts the series point markers are always circles. In the new charts
              the point markers can vary, this depends on the series order.`,
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

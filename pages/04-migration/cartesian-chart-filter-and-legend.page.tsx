// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as LineChartExample from "./examples/line-chart";
import * as PieChartExample from "./examples/pie-chart";

export default function () {
  return (
    <Page title="Migration: Filter and legend">
      <PageSection
        title="Filtering"
        docs={{
          functional: {
            bullets: [
              `The legacy charts feature an optional series filter at the top-left. The new charts allow series filtering by clicking on the legend items instead.
              The new charts also support an in-legend actions filter, for use cases with many series or segments.`,
            ],
          },
        }}
      />

      <PageSection
        title="Legend"
        docs={{
          visualDesign: {
            bullets: [
              "The new charts legend items can be toggled, which is represented with the new inactive item state.",
            ],
          },
        }}
      />

      <PageSection title="Demos">
        <MigrationDemo
          examples={[
            {
              tags: ["line chart"],
              old: <LineChartExample.ComponentOld />,
              new: (
                <FilterOffsetBox>
                  <LineChartExample.ComponentNew legendFilter={true} />
                </FilterOffsetBox>
              ),
              containerHeight: 450,
            },
            {
              tags: ["pie chart"],
              old: <PieChartExample.ComponentOld />,
              new: (
                <FilterOffsetBox>
                  <PieChartExample.ComponentNew legendFilter={true} />
                </FilterOffsetBox>
              ),
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

function FilterOffsetBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ blockSize: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ blockSize: "75px" }}></div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

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
          visualDesign: {
            bullets: [
              {
                content:
                  "Legacy charts featured an optional series filter at the top-left. The new charts allow series filtering by clicking on the legend items instead.",
              },
            ],
          },
          behavior: {
            bullets: [
              {
                content:
                  "The thresholds are now treated differently. A legacy area/line/bar chart with thresholds only is not considered empty. A new cartesian chart with threshold only is considered empty (or no-match).",
              },
            ],
          },
        }}
      />

      <PageSection title="Legend" docs={{ functional: { bullets: [] } }} />

      <PageSection title="Demos">
        <MigrationDemo
          examples={[
            {
              tags: ["line chart"],
              old: <LineChartExample.ComponentOld />,
              new: (
                <FilterOffsetBox>
                  <LineChartExample.ComponentNew />
                </FilterOffsetBox>
              ),
              containerHeight: 450,
            },
            {
              tags: ["pie chart"],
              old: <PieChartExample.ComponentOld />,
              new: (
                <FilterOffsetBox>
                  <PieChartExample.ComponentNew />
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

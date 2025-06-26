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
              `The legacy charts feature an optional series filter at the top-left. The new charts alow allow series filtering by clicking on the legend items.
              The new charts additionally support in-legend actions slot, that can be used for in-context filter.`,
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
              tags: ["line chart", "header filter"],
              old: <LineChartExample.ComponentOld />,
              new: <LineChartExample.ComponentNew headerFilter={true} />,
              containerHeight: 450,
            },
            {
              tags: ["line chart", "legend filter"],
              old: null,
              new: <LineChartExample.ComponentNew legendFilter={true} />,
              containerHeight: 375,
            },
            {
              tags: ["pie chart", "header filter"],
              old: <PieChartExample.ComponentOld />,
              new: <PieChartExample.ComponentNew headerFilter={true} />,
              containerHeight: 450,
            },
            {
              tags: ["pie chart", "legend filter"],
              old: <PieChartExample.ComponentOld />,
              new: <PieChartExample.ComponentNew legendFilter={true} />,
              containerHeight: 375,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

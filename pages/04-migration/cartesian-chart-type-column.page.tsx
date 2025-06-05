// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as BarChartExample from "./examples/bar-chart";

export default function () {
  return (
    <Page
      title="Migration: Bar charts"
      subtitle="This page compares bar chart features between legacy and new Cloudscape charts."
    >
      <PageSection title="Single-series bar chart">
        <MigrationDemo
          examples={[
            {
              tags: ["vertical"],
              old: <BarChartExample.ComponentOld single={true} />,
              new: <BarChartExample.ComponentNew single={true} />,
              containerHeight: 300,
            },
            {
              tags: ["horizontal"],
              old: <BarChartExample.ComponentOld single={true} inverted={true} />,
              new: <BarChartExample.ComponentNew single={true} inverted={true} />,
              containerHeight: 300,
            },
          ]}
        />
      </PageSection>

      <PageSection title="Grouped bar chart">
        <MigrationDemo
          examples={[
            {
              tags: ["vertical"],
              old: <BarChartExample.ComponentOld />,
              new: <BarChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["horizontal"],
              old: <BarChartExample.ComponentOld inverted={true} />,
              new: <BarChartExample.ComponentNew inverted={true} />,
              containerHeight: 400,
            },
          ]}
        />
      </PageSection>

      <PageSection title="Stacked bar chart">
        <MigrationDemo
          examples={[
            {
              tags: ["vertical"],
              old: <BarChartExample.ComponentOld stacking={true} />,
              new: <BarChartExample.ComponentNew stacking={true} />,
              containerHeight: 300,
            },
            {
              tags: ["horizontal"],
              old: <BarChartExample.ComponentOld stacking={true} inverted={true} />,
              new: <BarChartExample.ComponentNew stacking={true} inverted={true} />,
              containerHeight: 300,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

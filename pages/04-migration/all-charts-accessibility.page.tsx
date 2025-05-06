// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as BarChartExample from "./examples/bar-chart";
import * as PieChartExample from "./examples/pie-chart";

export default function () {
  return (
    <Page title="Migration: Accessibility">
      <PageSection
        title="RTL"
        docs={{
          behavior: {
            before: `The RTL behavior is consistent between old and new charts. In cartesian charts, the horizontal axis placement,
             and ticks direction are reversed. The keyboard navigation follows the visual order of data points.`,
          },
        }}
      ></PageSection>

      <PageSection
        title="Motion"
        docs={{
          behavior: {
            before: `The reduced motion behavior is consistent between old and new charts. When reduced motion is preferred, all
            chart animations are turned off.`,
          },
        }}
      ></PageSection>

      <PageSection title="Color contrast">TODO</PageSection>

      <PageSection title="Keyboard navigation">TODO</PageSection>

      <PageSection title="Screen readers">TODO</PageSection>

      <PageSection title="Demos">
        <MigrationDemo
          examples={[
            {
              tags: ["cartesian", "vertical"],
              old: <BarChartExample.ComponentOld single={true} />,
              new: <BarChartExample.ComponentNew single={true} />,
              containerHeight: 300,
            },
            {
              tags: ["cartesian", "horizontal"],
              old: <BarChartExample.ComponentOld single={true} inverted={true} />,
              new: <BarChartExample.ComponentNew single={true} inverted={true} />,
              containerHeight: 300,
            },
            {
              tags: ["pie"],
              old: <PieChartExample.ComponentOld hideFilter={true} />,
              new: <PieChartExample.ComponentNew />,
              containerHeight: 300,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

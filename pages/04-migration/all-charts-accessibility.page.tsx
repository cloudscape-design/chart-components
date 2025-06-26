// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as AreaChartExample from "./examples/area-chart";
import * as BarChartExample from "./examples/bar-chart";
import * as LineChartExample from "./examples/line-chart";
import * as PieChartExample from "./examples/pie-chart";
import * as PieChartNoDataExample from "./examples/pie-chart-no-data";
import * as ScatterChartExample from "./examples/scatter-chart";

export default function () {
  return (
    <Page title="Migration: Accessibility">
      <PageSection
        docs={{
          custom: [
            { title: "RTL", before: "Should be no difference between old and new charts." },
            {
              title: "Motion",
              before: `There are currently no animations in the new charts. Should we add some, those will respect the no-motion preference.`,
            },
            {
              title: "Color contrast",
              before: `The new charts use the same colors and do not employ fill patterns. There are new series like scatter that can
        suffer more issues due to possible close proximity of the points, where the marker shape might not be sufficient
        due to overlaps. The suggested solution is to use the legend/filter and the tooltip to reduce overlaps and
        identify series by names.`,
            },
            {
              title: "Keyboard navigation",
              before: `In the new charts we use a custom navigation solution, similar to the legacy charts. Unlike in legacy charts it
              is possible to focus individual series in the stacked and grouped bar charts, which is also consistent with pointer highlight
              behavior.`,
            },
            {
              title: "Screen readers",
              before: `The new charts have ARIA label and description, similar to the old ones. However, due to the API constraints, we had
              to replace certain ARIA role-descriptions with ARIA labels. The points and segments are announced when navigated with the keyboard,
              using the same technique as in the legacy charts.`,
            },
          ],
        }}
      />

      <PageSection title="Demos">
        <MigrationDemo
          examples={[
            {
              tags: ["area"],
              old: <AreaChartExample.ComponentOld hideFilter={true} />,
              new: <AreaChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["line"],
              old: <LineChartExample.ComponentOld hideFilter={true} />,
              new: <LineChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["column", "grouped"],
              old: <BarChartExample.ComponentOld />,
              new: <BarChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["column", "stacked"],
              old: <BarChartExample.ComponentOld stacking={true} />,
              new: <BarChartExample.ComponentNew stacking={true} />,
              containerHeight: 300,
            },
            {
              tags: ["column", "stacked", "inverted"],
              old: <BarChartExample.ComponentOld stacking={true} inverted={true} />,
              new: <BarChartExample.ComponentNew stacking={true} inverted={true} />,
              containerHeight: 300,
            },
            {
              tags: ["pie"],
              old: <PieChartExample.ComponentOld hideFilter={true} />,
              new: <PieChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["scatter"],
              old: null,
              new: <ScatterChartExample.ComponentNew />,
              containerHeight: 300,
            },
            {
              tags: ["pie", "no-data"],
              old: <PieChartNoDataExample.ComponentOld statusType="finished" series="empty" />,
              new: <PieChartNoDataExample.ComponentNew statusType="finished" series="empty" />,
              containerHeight: 300,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

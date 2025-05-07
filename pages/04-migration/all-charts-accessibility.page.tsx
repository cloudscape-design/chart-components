// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";

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
      <PageSection title="RTL">
        The RTL behavior is consistent between old and new charts. In cartesian charts, the horizontal axis placement,
        and ticks direction are reversed. The keyboard navigation follows the visual order of data points.
      </PageSection>

      <PageSection title="Motion">
        The reduced motion behavior is consistent between old and new charts. When reduced motion is preferred, all
        chart animations are turned off.
      </PageSection>

      <PageSection title="Color contrast">
        The new charts use the same colors and do not employ fill patterns. There are new series like scatter that can
        suffer more issues due to possible close proximity of the points, where the marker shape might not be sufficient
        due to overlaps. The suggested solution is to use the legend filtering and the tooltip to reduce overlaps and
        identify series by names.
      </PageSection>

      <PageSection title="Keyboard navigation">
        <Box variant="p">
          <b>All charts:</b> In the old charts the focus first lands on the chart plot container, at which point the
          keyboard navigation is available. Pressing arrow keys will move the focus to the chart elements. In the new
          charts the focus immediately lands on the first data point. There is also a bug: when the chart is empty, the
          focus still lands on it, but there is no visible focus outline.
        </Box>

        <Box variant="p">
          <b>Area-, line-, and scatter charts:</b> In the old charts, the navigation can be on x-ticks (represented with
          vertical marker) or on series (represented with focused points). This allows to choose whether to iterate by
          x-value or by series. In the new charts, there is no navigation on x-ticks. This makes it hard to e.g.
          navigate the scatter chart if necessary to iterate points as x-value increases. There is also a bug in
          datetime stacked area chart: the navigation between series (when pressing up/down arrows) is inconsistent and
          often moves focus to the next/previous point of the same series instead.
        </Box>

        <Box variant="p">
          <b>Grouped and stacked column charts:</b> In the old charts the column groups or stacks are always navigated
          as a single entity, consistent with how hovering works. In the new charts the focus langs on individual
          series, which is pointless from the user perspective. In stacked charts, the focus outline is also partially
          cut off.
        </Box>

        <Box variant="p">
          <b>Inverted cartesian charts:</b> In the old charts the x axis is always iterated with left/right arrow keys,
          while the series are always iterated with up/down arrow keys, even when the axes are inverted. In the new
          charts the navigation keys swap when the chart is inverted.
        </Box>

        <Box variant="p">
          <b>Pie/donut charts:</b> The keyboard navigation works similar between old- and new charts.
        </Box>
      </PageSection>

      <PageSection title="Screen readers">
        The new charts can have ARIA label and description, same as the old ones. Highcharts also adds extra annotations
        describing axes and more. The points are announced when navigated with the keyboard.
      </PageSection>

      <PageSection title="Visual">
        <Box variant="p">
          <b>Stacked column charts:</b> In stacked column series with disproportional values the smaller series might
          become invisible due to scale, and only accessible via the filtering/tooltip. However, in the old charts we
          ensure that the series is preferred over the in-between margins, while in the old charts there is no such
          optimization.
        </Box>
      </PageSection>

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
              old: <BarChartExample.ComponentOld stacked={true} />,
              new: <BarChartExample.ComponentNew stacked={true} />,
              containerHeight: 300,
            },
            {
              tags: ["column", "stacked", "inverted"],
              old: <BarChartExample.ComponentOld stacked={true} inverted={true} />,
              new: <BarChartExample.ComponentNew stacked={true} inverted={true} />,
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

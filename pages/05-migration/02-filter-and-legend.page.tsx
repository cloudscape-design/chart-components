// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Page } from "../common/templates";
import { MigrationSection } from "./common";
import * as LineChartExample from "./examples/line-chart";
import * as PieChartExample from "./examples/pie-chart";

export default function () {
  return (
    <Page title="Migration: Filter and Legend">
      <MigrationSection
        title="Filtering"
        examples={[]}
        details={{
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

      <MigrationSection title="Legend" examples={[]} details={{ functional: { bullets: [] } }} />

      <MigrationSection
        title="Demos"
        examples={[
          {
            tags: ["line chart"],
            old: <LineChartExample.ComponentOld />,
            new: <LineChartExample.ComponentNew />,
            containerHeight: { old: 450, new: 400 },
          },
          {
            tags: ["pie chart"],
            old: <PieChartExample.ComponentOld />,
            new: <PieChartExample.ComponentNew />,
            containerHeight: { old: 450, new: 400 },
          },
        ]}
      />
    </Page>
  );
}

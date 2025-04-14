// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as LineChartExample from "./examples/line-chart";

export default function () {
  return (
    <Page title="Migration: Line charts">
      <PageSection
        title="Simple line chart"
        docs={{
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
        }}
      >
        <MigrationDemo
          examples={[
            {
              old: <LineChartExample.ComponentOld hideFilter={true} />,
              new: <LineChartExample.ComponentNew />,
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

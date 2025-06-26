// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as PieChartExample from "./examples/pie-chart";

export default function () {
  return (
    <Page title="Migration: Pie charts">
      <PageSection>
        <MigrationDemo
          examples={[
            {
              old: <PieChartExample.ComponentOld type="donut" hideFilter={true} />,
              new: <PieChartExample.ComponentNew type="donut" />,
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

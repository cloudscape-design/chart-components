// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as LineChartExample from "./examples/line-chart";

export default function () {
  return (
    <Page title="Migration: Line charts">
      <PageSection title="Simple line chart">
        <MigrationDemo
          examples={[
            {
              old: <LineChartExample.ComponentOld />,
              new: <LineChartExample.ComponentNew />,
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

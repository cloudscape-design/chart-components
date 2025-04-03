// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as StackedBarChartExample from "./examples/stacked-bar-chart";

export default function () {
  return (
    <Page
      title="Migration: Bar charts"
      subtitle="This page compares bar chart features between legacy and new Cloudscape charts."
    >
      <PageSection title="Stacked bar chart">
        <MigrationDemo
          examples={[
            {
              old: <StackedBarChartExample.ComponentOld />,
              new: <StackedBarChartExample.ComponentNew />,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

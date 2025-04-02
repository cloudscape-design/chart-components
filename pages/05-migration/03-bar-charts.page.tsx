// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Page } from "../common/templates";
import { MigrationSection } from "./common";
import * as StackedBarChartExample from "./examples/stacked-bar-chart";

export default function () {
  return (
    <Page
      title="Migration: Bar Charts"
      subtitle="This page compares bar chart features between legacy and new Cloudscape charts."
    >
      <MigrationSection
        title="Stacked bar chart"
        examples={[
          {
            old: <StackedBarChartExample.ComponentOld />,
            new: <StackedBarChartExample.ComponentNew />,
          },
        ]}
      />
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Page } from "../common/templates";
import { MigrationSection } from "./common";
import * as LineChartExample from "./examples/line-chart";

export default function () {
  return (
    <Page title="Migration: Line Charts" subtitle="???">
      <MigrationSection
        title="Simple line chart"
        examples={[
          {
            old: <LineChartExample.ComponentOld />,
            new: <LineChartExample.ComponentNew />,
            containerHeight: 450,
          },
        ]}
        details={{}}
      />
    </Page>
  );
}

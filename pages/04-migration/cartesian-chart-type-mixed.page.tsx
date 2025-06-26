// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as MixedChartExample from "./examples/mixed-chart";

export default function () {
  return (
    <Page title="Migration: Mixed charts">
      <PageSection>
        <MigrationDemo
          examples={[
            {
              old: <MixedChartExample.ComponentOld hideFilter={true} />,
              new: <MixedChartExample.ComponentNew />,
              containerHeight: 450,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

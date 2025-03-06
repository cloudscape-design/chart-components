// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ColumnLayout from "@cloudscape-design/components/column-layout";

import { PageSettingsDefaults } from "./common/page-settings";
import { Page, PageSection } from "./common/templates";
import { ExampleAreaRangeSimple } from "./more-charts/example-area-range-simple";
import { ExampleHeatmapSimple } from "./more-charts/example-heatmap-simple";
import { ExampleScatterSimple } from "./more-charts/example-scatter-simple";
import { ExampleTreemapSimple } from "./more-charts/example-treemap-simple";

export default function () {
  return (
    <PageSettingsDefaults settings={{}}>
      <Page title="More charts" subtitle="This pages demonstrates different chart types that Cloudscape can support.">
        <ColumnLayout columns={2} borders="all">
          <PageSection title="Simple scatter chart">
            <ExampleScatterSimple />
          </PageSection>
          <PageSection title="Simple treemap">
            <ExampleTreemapSimple />
          </PageSection>
          <PageSection title="Simple heatmap">
            <ExampleHeatmapSimple />
          </PageSection>
          <PageSection title="Simple area-range chart">
            <ExampleAreaRangeSimple />
          </PageSection>
        </ColumnLayout>
      </Page>
    </PageSettingsDefaults>
  );
}

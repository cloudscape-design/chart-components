// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { PageSettingsDefaults, usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import { TooltipSettings } from "../common/tooltip-settings";
import { ExampleAreaRangeSimple } from "./more-charts/example-area-range-simple";
import { ExampleHeatmapSimple } from "./more-charts/example-heatmap-simple";
import { ExampleScatterSimple } from "./more-charts/example-scatter-simple";
import { ExampleTreemapSimple } from "./more-charts/example-treemap-simple";

export default function () {
  const { settings, setSettings } = usePageSettings();
  return (
    <PageSettingsDefaults settings={{}}>
      <Page
        title="More charts"
        subtitle="This pages demonstrates different chart types that Cloudscape can support."
        settings={
          <SpaceBetween size="s">
            <TooltipSettings />
            <Checkbox
              checked={settings.showLegend}
              onChange={({ detail }) => setSettings({ showLegend: detail.checked })}
            >
              Show legend
            </Checkbox>
            <Checkbox
              checked={settings.showLegendTitle}
              onChange={({ detail }) => setSettings({ showLegendTitle: detail.checked })}
            >
              Show legend title
            </Checkbox>
          </SpaceBetween>
        }
      >
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

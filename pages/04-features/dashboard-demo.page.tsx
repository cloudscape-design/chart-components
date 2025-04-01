// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { usePageSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import { TooltipSettings } from "../common/tooltip-settings";
import { WidgetInstanceHours } from "./dashboard-demo/widget-instance-hours";
import { NetworkTrafficWidget } from "./dashboard-demo/widget-network-traffic";
import { WidgetOperationalMetrics } from "./dashboard-demo/widget-operational-metrics";
import { ZoneStatusWidget } from "./dashboard-demo/widget-zone-status";

export default function () {
  const { settings, setSettings } = usePageSettings();
  return (
    <Page
      title="Dashboard demo"
      subtitle="This pages features new charts implemented from the existing demos to demonstrate feature parity."
      settings={
        <SpaceBetween size="s">
          <TooltipSettings />
          <Checkbox
            checked={settings.applyLoadingState}
            onChange={({ detail }) => setSettings({ applyLoadingState: detail.checked })}
          >
            Apply loading state
          </Checkbox>
          <Checkbox
            checked={settings.applyEmptyState}
            onChange={({ detail }) => setSettings({ applyEmptyState: detail.checked })}
          >
            Apply empty state
          </Checkbox>
          <Checkbox
            checked={settings.applyErrorState}
            onChange={({ detail }) => setSettings({ applyErrorState: detail.checked })}
          >
            Apply error state
          </Checkbox>
          <Checkbox
            checked={settings.showLegend}
            onChange={({ detail }) => setSettings({ showLegend: detail.checked })}
          >
            Show legend
          </Checkbox>
          <FormField label="Container height">
            <Input
              type="number"
              value={settings.containerHeight.toString()}
              onChange={({ detail }) => setSettings({ containerHeight: parseInt(detail.value) })}
            />
          </FormField>
        </SpaceBetween>
      }
    >
      <ColumnLayout columns={2}>
        <div style={{ height: settings.containerHeight }}>
          <Container
            fitHeight={true}
            header={
              <Header
                actions={
                  <Button href="#" iconName="external" iconAlign="right" target="_blank">
                    View in Cloudwatch
                  </Button>
                }
              >
                Operational metrics
              </Header>
            }
          >
            <WidgetOperationalMetrics />
          </Container>
        </div>

        <div style={{ height: settings.containerHeight }}>
          <Container
            fitHeight={true}
            header={
              <Header variant="h2" description="Daily instance hours by instance type">
                Instance hours
              </Header>
            }
          >
            <WidgetInstanceHours />
          </Container>
        </div>

        <div style={{ height: settings.containerHeight }}>
          <Container
            header={
              <Header variant="h2" description="Incoming and outgoing network traffic">
                Network traffic
              </Header>
            }
            fitHeight={true}
          >
            <NetworkTrafficWidget />
          </Container>
        </div>

        <div style={{ height: settings.containerHeight }}>
          <Container
            fitHeight={true}
            header={
              <Header variant="h2">
                Zone status - <i>beta</i>
              </Header>
            }
          >
            <ZoneStatusWidget />
          </Container>
        </div>
      </ColumnLayout>
    </Page>
  );
}

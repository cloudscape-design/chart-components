// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";

import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import { WidgetInstanceHours } from "./dashboard-demo/widget-instance-hours";
import { NetworkTrafficWidget } from "./dashboard-demo/widget-network-traffic";
import { WidgetOperationalMetrics } from "./dashboard-demo/widget-operational-metrics";
import { ZoneStatusWidget } from "./dashboard-demo/widget-zone-status";

export default function () {
  const { settings } = useChartSettings();
  return (
    <Page
      title="Dashboard demo"
      subtitle="This pages features new charts implemented from the existing demos to demonstrate feature parity."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "containerHeight",
            "emptySeries",
            "seriesLoading",
            "seriesError",
            "showLegend",
            "showLegendTitle",
            "tooltipSize",
            "tooltipPlacement",
          ]}
        />
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

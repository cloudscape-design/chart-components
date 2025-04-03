// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { colorBorderDividerDefault } from "@cloudscape-design/design-tokens";

import { PieChart } from "../../lib/components";
import { ScreenshotArea } from "../app/screenshot-area";
import { PageSettings, usePageSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  chartType: "pie" | "awsui-donut";
  showBoundaries: boolean;
}

const chartTypeOptions = [{ value: "pie" }, { value: "awsui-donut" }];

export default function () {
  const { highcharts, settings, setSettings } = usePageSettings<ThisPageSettings>();
  const { chartType = "pie", showBoundaries = true } = settings;

  const borderColor = showBoundaries ? colorBorderDividerDefault : "transparent";

  return (
    <Page
      title="Pie chart: no data states"
      subtitle="The page demonstrates all possible no-data states of the pie / donut charts.
      Use page settings to change chart type, or show / hide container boundaries."
      settings={
        <SpaceBetween size="s">
          <Checkbox
            checked={settings.showLegend}
            onChange={({ detail }) => setSettings({ showLegend: detail.checked })}
          >
            Show legend
          </Checkbox>
          <Checkbox checked={showBoundaries} onChange={({ detail }) => setSettings({ showBoundaries: detail.checked })}>
            Show component boundaries
          </Checkbox>
          <FormField label="Chart type">
            <Select
              options={chartTypeOptions}
              selectedOption={chartTypeOptions.find((o) => chartType === o.value) ?? chartTypeOptions[0]}
              onChange={({ detail }) =>
                setSettings({
                  chartType: detail.selectedOption.value as ThisPageSettings["chartType"],
                })
              }
            />
          </FormField>
          <FormField label="Chart height">
            <Input
              type="number"
              value={settings.containerHeight.toString()}
              onChange={({ detail }) => setSettings({ containerHeight: parseInt(detail.value) })}
            />
          </FormField>
        </SpaceBetween>
      }
    >
      <ScreenshotArea>
        <PageSection title="Empty state: all" subtitle="No series provided">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in empty state"
              series={null}
              legend={{ enabled: settings.showLegend }}
              noData={{
                statusType: "finished",
                empty: (
                  <>
                    <Box textAlign="center" color="inherit">
                      <b>No data available</b>
                      <Box variant="p" color="inherit">
                        There is no available data to display
                      </Box>
                    </Box>
                  </>
                ),
              }}
            />
          </div>
        </PageSection>

        <PageSection title="Empty state: segments" subtitle="No segments provided">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in empty state"
              series={{ name: "Units", type: chartType, data: [] }}
              legend={{ enabled: settings.showLegend }}
              noData={{
                statusType: "finished",
                empty: (
                  <>
                    <Box textAlign="center" color="inherit">
                      <b>No data available</b>
                      <Box variant="p" color="inherit">
                        There is no available data to display
                      </Box>
                    </Box>
                  </>
                ),
              }}
            />
          </div>
        </PageSection>

        <PageSection title="No match state" subtitle="No visible segments">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in no-match state"
              series={{
                name: "Units",
                type: chartType,
                data: [
                  { name: "P1", y: 50 },
                  { name: "P2", y: 50 },
                ],
              }}
              legend={{ enabled: settings.showLegend }}
              noData={{
                statusType: "finished",
                noMatch: (
                  <>
                    <Box textAlign="center" color="inherit">
                      <b>No matching data</b>
                      <Box variant="p" color="inherit">
                        There is no matching data to display
                      </Box>
                      <Button>Clear filter</Button>
                    </Box>
                  </>
                ),
              }}
              visibleSegments={[]}
            />
          </div>
        </PageSection>

        <PageSection
          title="Loading state: all"
          subtitle="Neither segment descriptions nor segment values are available."
        >
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in loading state"
              series={{ name: "Units", type: chartType, data: [] }}
              legend={{ enabled: settings.showLegend }}
              noData={{
                statusType: "loading",
                loading: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
              }}
            />
          </div>
        </PageSection>

        <PageSection title="Loading state: data" subtitle="Segments are known, but data is loading.">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in loading state"
              series={{
                name: "Units",
                type: chartType,
                data: [
                  { name: "P1", y: null },
                  { name: "P2", y: null },
                ],
              }}
              legend={{ enabled: settings.showLegend }}
              visibleSegments={["P1", "P2"]}
              noData={{
                statusType: "finished",
                empty: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
              }}
            />
          </div>
        </PageSection>

        <PageSection
          title="Loading state: partial"
          subtitle={
            <>
              <p>Segments descriptions and values are partially available or are not up to date.</p>
              <p>Note: this is achieved by indicating the loading state outside of the chart component.</p>
            </>
          }
        >
          <SpaceBetween size="m">
            <StatusIndicator type="loading">Refreshing data</StatusIndicator>
            <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
              <PieChart
                highcharts={highcharts}
                chartHeight={settings.containerHeight}
                ariaLabel="Pie chart in loading state"
                series={{
                  name: "Units",
                  type: chartType,
                  data: [
                    { name: "P1", y: 50 },
                    { name: "P2", y: 50 },
                  ],
                }}
                legend={{ enabled: settings.showLegend }}
                visibleSegments={["P1", "P2"]}
              />
            </div>
          </SpaceBetween>
        </PageSection>

        <PageSection title="Error state: all" subtitle="Both segment descriptions and segment values failed to load.">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in error state"
              series={{ name: "Units", type: chartType, data: [] }}
              legend={{ enabled: settings.showLegend }}
              noData={{
                statusType: "error",
                error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
              }}
            />
          </div>
        </PageSection>

        <PageSection title="Error state: data" subtitle="Segments are present, but data failed to load.">
          <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
            <PieChart
              highcharts={highcharts}
              chartHeight={settings.containerHeight}
              ariaLabel="Pie chart in error state"
              series={{
                name: "Units",
                type: chartType,
                data: [
                  { name: "P1", y: null },
                  { name: "P2", y: null },
                ],
              }}
              legend={{ enabled: settings.showLegend }}
              visibleSegments={["P1", "P2"]}
              noData={{
                statusType: "error",
                error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
              }}
            />
          </div>
        </PageSection>

        <PageSection
          title="Error state: partial"
          subtitle={
            <>
              <p>Some segments or values failed to load or refresh.</p>
              <p>Note: this is achieved by indicating the error state outside of the chart component.</p>
            </>
          }
        >
          <SpaceBetween size="m">
            <Alert type="error">An error occurred</Alert>
            <div style={{ border: `1px solid ${borderColor}`, borderRadius: "4px" }}>
              <PieChart
                highcharts={highcharts}
                chartHeight={settings.containerHeight}
                ariaLabel="Pie chart in error state"
                series={{
                  name: "Units",
                  type: chartType,
                  data: [
                    { name: "P1", y: 50 },
                    { name: "P2", y: 50 },
                  ],
                }}
                legend={{ enabled: settings.showLegend }}
                visibleSegments={["P1", "P2"]}
              />
            </div>
          </SpaceBetween>
        </PageSection>
      </ScreenshotArea>
    </Page>
  );
}

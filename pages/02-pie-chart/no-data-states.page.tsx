// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { PieChart, PieChartProps } from "../../lib/components";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { FramedDemo, Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  chartType: "pie" | "donut";
}

const chartTypeOptions = [{ value: "pie" }, { value: "donut" }];

export default function () {
  const { settings, setSettings, chartProps } = useChartSettings<ThisPageSettings>();
  const { chartType = "pie" } = settings;
  const defaultProps: PieChartProps = { ...chartProps.pie, series: null, chartHeight: settings.height };
  return (
    <Page
      title="Pie chart: no data states"
      subtitle="The page demonstrates all possible no-data states of the pie / donut charts.
      Use page settings to change chart type, or show / hide container boundaries."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "height",
            "showLegend",
            {
              content: (
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
              ),
            },
          ]}
        />
      }
    >
      <PageSection title="Empty state: all" subtitle="No series provided">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in empty state"
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
        </FramedDemo>
      </PageSection>

      <PageSection title="Empty state: segments" subtitle="No segments provided">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in empty state"
            series={{ name: "Units", type: chartType, data: [] }}
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
        </FramedDemo>
      </PageSection>

      <PageSection title="No match state" subtitle="No visible segments">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in no-match state"
            series={{
              name: "Units",
              type: chartType,
              data: [
                { name: "P1", y: 50 },
                { name: "P2", y: 50 },
              ],
            }}
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
        </FramedDemo>
      </PageSection>

      <PageSection title="Loading state: all" subtitle="Neither segment descriptions nor segment values are available.">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in loading state"
            series={{ name: "Units", type: chartType, data: [] }}
            noData={{
              statusType: "loading",
              loading: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
            }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Loading state: data" subtitle="Segments are known, but data is loading.">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in loading state"
            series={{
              name: "Units",
              type: chartType,
              data: [
                { name: "P1", y: null },
                { name: "P2", y: null },
              ],
            }}
            visibleSegments={["P1", "P2"]}
            noData={{
              statusType: "finished",
              empty: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
            }}
          />
        </FramedDemo>
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
          <FramedDemo>
            <PieChart
              {...defaultProps}
              ariaLabel="Pie chart in loading state"
              series={{
                name: "Units",
                type: chartType,
                data: [
                  { name: "P1", y: 50 },
                  { name: "P2", y: 50 },
                ],
              }}
              visibleSegments={["P1", "P2"]}
            />
          </FramedDemo>
        </SpaceBetween>
      </PageSection>

      <PageSection title="Error state: all" subtitle="Both segment descriptions and segment values failed to load.">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in error state"
            series={{ name: "Units", type: chartType, data: [] }}
            noData={{
              statusType: "error",
              error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
            }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Error state: data" subtitle="Segments are present, but data failed to load.">
        <FramedDemo>
          <PieChart
            {...defaultProps}
            ariaLabel="Pie chart in error state"
            series={{
              name: "Units",
              type: chartType,
              data: [
                { name: "P1", y: null },
                { name: "P2", y: null },
              ],
            }}
            visibleSegments={["P1", "P2"]}
            noData={{
              statusType: "error",
              error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
            }}
          />
        </FramedDemo>
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
          <FramedDemo>
            <PieChart
              {...defaultProps}
              ariaLabel="Pie chart in error state"
              series={{
                name: "Units",
                type: chartType,
                data: [
                  { name: "P1", y: 50 },
                  { name: "P2", y: 50 },
                ],
              }}
              visibleSegments={["P1", "P2"]}
            />
          </FramedDemo>
        </SpaceBetween>
      </PageSection>
    </Page>
  );
}

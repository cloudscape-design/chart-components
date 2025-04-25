// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { percentageFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { FramedDemo, Page, PageSection } from "../common/templates";

export default function () {
  const { settings, chartProps } = useChartSettings();

  const defaultProps: CartesianChartProps = {
    ...chartProps.cartesian,
    series: [],
    chartHeight: settings.height,
    xAxis: { title: "X axis", min: 0, max: 1000 },
    yAxis: { title: "Y axis", min: 0, max: 1, valueFormatter: percentageFormatter },
  };

  return (
    <Page
      title="Cartesian chart: no data states"
      subtitle="The page demonstrates all possible no-data states of the cartesian charts."
      settings={<PageSettingsForm selectedSettings={["height", "showLegend"]} />}
    >
      <PageSection title="Empty state: all" subtitle="No series provided">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in empty state"
            series={[]}
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

      <PageSection title="Empty state: data" subtitle="No data provided">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in empty state"
            series={[{ type: "line", name: "Load", data: [] }]}
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
            visibleSeries={["Load"]}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="No match state" subtitle="No visible series">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in no-match state"
            series={[
              {
                type: "line",
                name: "Load",
                data: [
                  { x: 0, y: 0.1 },
                  { x: 1000, y: 0.9 },
                ],
              },
            ]}
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
            visibleSeries={[]}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Loading state: all" subtitle="Neither series nor series data is available.">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in loading state"
            series={[]}
            noData={{
              statusType: "loading",
              loading: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
            }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Loading state: data" subtitle="Series are known, but data is loading.">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in loading state"
            series={[{ type: "line", name: "Load", data: [] }]}
            noData={{
              statusType: "loading",
              loading: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
            }}
            visibleSeries={["Load"]}
          />
        </FramedDemo>
      </PageSection>

      <PageSection
        title="Loading state: partial"
        subtitle={
          <>
            <div>Series and series data are partially available or are not up to date.</div>
            <div>Note: this is achieved by indicating the loading state outside of the chart component.</div>
          </>
        }
      >
        <SpaceBetween size="m">
          <StatusIndicator type="loading">Refreshing data</StatusIndicator>
          <FramedDemo>
            <CartesianChart
              {...defaultProps}
              ariaLabel="Cartesian chart in loading state"
              series={[
                {
                  type: "line",
                  name: "Load",
                  data: [
                    { x: 0, y: 0.1 },
                    { x: 1000, y: 0.9 },
                  ],
                },
              ]}
              visibleSeries={["Load"]}
            />
          </FramedDemo>
        </SpaceBetween>
      </PageSection>

      <PageSection title="Error state: all" subtitle="Both series and series data failed to load.">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in error state"
            series={[]}
            noData={{
              statusType: "error",
              error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
            }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Error state: data" subtitle="Series are present, but data failed to load.">
        <FramedDemo>
          <CartesianChart
            {...defaultProps}
            ariaLabel="Cartesian chart in error state"
            series={[
              {
                type: "line",
                name: "Load",
                data: [],
              },
            ]}
            visibleSeries={["Load"]}
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
            <div>Some series or data failed to load or refresh.</div>
            <div>Note: this is achieved by indicating the error state outside of the chart component.</div>
          </>
        }
      >
        <SpaceBetween size="m">
          <Alert type="error">An error occurred</Alert>
          <FramedDemo>
            <CartesianChart
              {...defaultProps}
              ariaLabel="Cartesian chart in loading state"
              series={[
                {
                  type: "line",
                  name: "Load",
                  data: [
                    { x: 0, y: 0.1 },
                    { x: 1000, y: 0.9 },
                  ],
                },
              ]}
              visibleSeries={["Load"]}
            />
          </FramedDemo>
        </SpaceBetween>
      </PageSection>
    </Page>
  );
}

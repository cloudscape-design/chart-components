// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CodeSnippet } from "../common/code-snippet";
import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as CartesianChartStatesExample from "./examples/cartesian-chart-no-data";
import * as PieChartStatesExample from "./examples/pie-chart-no-data";

const containerHeight = 300;

const EmptyStatesDevGuidance = (
  <SpaceBetween size="s">
    <Box variant="span">
      In the new charts, the no data states are defined with <Box variant="code">noData</Box> property, that includes
      status, and state content. If loading and error content is not explicitly defined, the text is taken from the{" "}
      <Box variant="code">i18nStrings</Box> (built-in or explicitly provided).
    </Box>

    <CodeSnippet
      content={`let oldChart = (
  <PieChart
    {...props}
    statusType="error"
    empty={<EmptyStateIndicator />}
    noMatch={<NoMatchStateIndicator />}
    loadingText={i18n.loadingText} // Supported with built-in i18n
    errorText={i18n.errorText} // Supported with built-in i18n
    recoveryText={i18n.recoveryText} // Supported with built-in i18n
    onRecoveryClick={onRecoveryClick}
  />
);

let newChart = (
  <PieChart
    {...props}
    i18nStrings={{
      loadingText: i18n.loadingText, // Supported with built-in i18n
      errorText: i18n.errorText, // Supported with built-in i18n
      recoveryText: i18n.recoveryText, // Supported with built-in i18n
    }}
    noData={{
      statusType: "error",
      empty: <EmptyStateIndicator />,
      noMatch: <NoMatchStateIndicator />,
      loading: <LoadingStateIndicator />, // Overrides the default loading state indicator (that uses i18n strings)
      error: <ErrorStateIndicator />, // Overrides the default error state indicator (that uses i18n strings)
      onRecoveryClick: onRecoveryClick,
    }}
  />
);`}
    />
  </SpaceBetween>
);

export default function () {
  return (
    <Page
      title="Migration: No-data states"
      subtitle="This page is dedicated to chart no-data state (empty, no-match, loading, error) differences between old and new charts."
    >
      <PageSection
        title="All no-data states"
        docs={{
          functional: {
            bullets: [
              `In the old cartesian charts series without data do not count towards empty or no-match state, so no indicator is shown.
              In the new cartesian charts the empty or no-match state can be added if all series are empty.`,
              "In the new charts the threshold series are always empty. These series get their data points only if there are other non-empty " +
                "series available in the chart. This means, the empty or no-match state can be shown on top of thresholds.",
            ],
          },
          implementation: {
            before: EmptyStatesDevGuidance,
          },
        }}
      />

      <PageSection title="Empty state">
        <MigrationDemo
          examples={[
            {
              tags: ["no series"],
              old: <CartesianChartStatesExample.ComponentOld statusType="finished" series="none" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="finished" series="none" />,
              containerHeight,
            },
            {
              tags: ["no data", "cartesian chart"],
              old: <CartesianChartStatesExample.ComponentOld statusType="finished" series="empty" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="finished" series="empty" />,
              containerHeight,
            },
            {
              tags: ["no data", "cartesian chart", "threshold"],
              old: <CartesianChartStatesExample.ComponentOld statusType="finished" series="threshold" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="finished" series="threshold" />,
              containerHeight,
            },
            {
              tags: ["no data", "pie chart"],
              old: <PieChartStatesExample.ComponentOld statusType="finished" series="empty" />,
              new: <PieChartStatesExample.ComponentNew statusType="finished" series="empty" />,
              containerHeight,
            },
          ]}
        />
      </PageSection>

      <PageSection title="No match state">
        <MigrationDemo
          examples={[
            {
              tags: ["cartesian chart"],
              old: <CartesianChartStatesExample.ComponentOld statusType="finished" series="data" hideSeries={true} />,
              new: <CartesianChartStatesExample.ComponentNew statusType="finished" series="data" hideSeries={true} />,
              containerHeight,
            },
            {
              tags: ["pie chart"],
              old: <PieChartStatesExample.ComponentOld statusType="finished" series="data" hideSeries={true} />,
              new: <PieChartStatesExample.ComponentNew statusType="finished" series="data" hideSeries={true} />,
              containerHeight,
            },
          ]}
        />
      </PageSection>

      <PageSection title="Loading state">
        <MigrationDemo
          examples={[
            {
              tags: ["no series"],
              old: <CartesianChartStatesExample.ComponentOld statusType="loading" series="none" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="loading" series="none" />,
              containerHeight,
            },
            {
              tags: ["no data", "cartesian chart"],
              old: <CartesianChartStatesExample.ComponentOld statusType="loading" series="empty" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="loading" series="empty" />,
              containerHeight,
            },
            {
              tags: ["no data", "pie chart"],
              old: <PieChartStatesExample.ComponentOld statusType="loading" series="empty" />,
              new: <PieChartStatesExample.ComponentNew statusType="loading" series="empty" />,
              containerHeight,
            },
          ]}
        />
      </PageSection>

      <PageSection title="Error state">
        <MigrationDemo
          examples={[
            {
              tags: ["no series"],
              old: <CartesianChartStatesExample.ComponentOld statusType="error" series="none" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="error" series="none" />,
              containerHeight,
            },
            {
              tags: ["no data", "cartesian chart"],
              old: <CartesianChartStatesExample.ComponentOld statusType="error" series="empty" />,
              new: <CartesianChartStatesExample.ComponentNew statusType="error" series="empty" />,
              containerHeight,
            },
            {
              tags: ["no data", "pie chart"],
              old: <PieChartStatesExample.ComponentOld statusType="error" series="empty" />,
              new: <PieChartStatesExample.ComponentNew statusType="error" series="empty" />,
              containerHeight,
            },
          ]}
        />
      </PageSection>
    </Page>
  );
}

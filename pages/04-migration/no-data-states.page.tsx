// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CodeSnippet } from "../common/code-snippet";
import { MigrationDemo, Page, PageSection } from "../common/templates";
import * as CartesianChartStatesExample from "./examples/cartesian-chart-no-data";
import * as PieChartStatesExample from "./examples/pie-chart-no-data";

const containerHeight = 300;

const ErrorSlotDevGuidance = (
  <SpaceBetween size="s">
    <Box variant="span">
      The <Box variant="code">errorText</Box> and <Box variant="code">onRecoveryClick</Box> of the legacy charts were
      replaced by the <Box variant="code">error</Box> slot in the new charts.
    </Box>

    <CodeSnippet
      content={`let oldChart = <PieChart {...props} statusType="error" errorText="The data couldn't be fetched. Try again later." onRecoveryClick={onRecoveryClick} />;

let newChart = <PieChart {...props} noData={{ statusType: "error", error: <Error onRecoveryClick={onRecoveryClick} /> }} />;

function Error({ onRecoveryClick }) {
  return (
    <span>
      <StatusIndicator type="error">The data couldn't be fetched. Try again later.</StatusIndicator>{" "}
      <Button variant="inline-link" onClick={onRecoveryClick}>Retry</Button>
    </span>
  );
}`}
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
            ],
          },
          visualDesign: {
            bullets: [
              "In the new pie chart no-data state we show an empty circle.",
              `In the old charts there is a bottom margin present when the chart is empty.
              This creates a small difference in vertical alignment of the no-data state indicator.`,
            ],
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

      <PageSection
        title="Error state"
        docs={{
          implementation: { bullets: [{ content: ErrorSlotDevGuidance }] },
        }}
      >
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

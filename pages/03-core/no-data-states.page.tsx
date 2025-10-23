// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";
import { omit } from "lodash";

import Box from "@cloudscape-design/components/box";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { FramedDemo, Page, PageSection } from "../common/templates";

export default function () {
  const { chartProps } = useChartSettings();

  const xAxis = {
    title: { text: "X values" },
    min: 0,
    max: 100,
  };

  const yAxis = {
    title: { text: "Y values" },
    min: 0,
    max: 100,
  };

  const noDataContent = (
    <Box textAlign="center" color="inherit">
      <b>No data available</b>
      <Box variant="p" color="inherit">
        There is no available data to display
      </Box>
    </Box>
  );

  return (
    <Page
      title="Core chart: no data states"
      subtitle="The page demonstrates all possible no-data states of the core chart."
      settings={<PageSettingsForm selectedSettings={["height", "showLegend"]} />}
    >
      <PageSection title="Empty state: all" subtitle="No series provided">
        <FramedDemo>
          <CoreChart
            {...omit(chartProps.cartesian, "ref")}
            highcharts={Highcharts}
            options={{ series: [] }}
            noData={{ statusType: "finished", empty: noDataContent }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Empty state: all (side legend)" subtitle="No series provided">
        <FramedDemo>
          <CoreChart
            {...omit(chartProps.cartesian, "ref")}
            highcharts={Highcharts}
            options={{ series: [] }}
            legend={{ ...chartProps.cartesian.legend, position: "side" }}
            noData={{ statusType: "finished", empty: noDataContent }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Empty state: data" subtitle="No data provided">
        <FramedDemo>
          <CoreChart
            {...omit(chartProps.cartesian, "ref")}
            ariaLabel="Cartesian chart in empty state"
            options={{
              xAxis,
              yAxis,
              series: [{ type: "line", name: "Load", data: [] }],
            }}
            noData={{ statusType: "finished", empty: noDataContent }}
          />
        </FramedDemo>
      </PageSection>

      <PageSection title="Empty state: data (side legend)" subtitle="No data provided">
        <FramedDemo>
          <CoreChart
            {...omit(chartProps.cartesian, "ref")}
            ariaLabel="Cartesian chart in empty state"
            legend={{ ...chartProps.cartesian.legend, position: "side" }}
            options={{
              xAxis,
              yAxis,
              series: [{ type: "line", name: "Load", data: [] }],
            }}
            noData={{ statusType: "finished", empty: noDataContent }}
          />
        </FramedDemo>
      </PageSection>
    </Page>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContext } from "react";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { percentageFormatter } from "../common/formatters";
import { PageSettingsContext, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const visitTypes = ["Desktop", "Mobile", "Tablet", "Embedded", "Crawler"];
const shares = categories.map(() => {
  const weights = visitTypes.map(() => 1 + pseudoRandom() * 9);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const rounded = weights.map((weight) => Math.round((weight / total) * 100));
  rounded[0] += 100 - rounded.reduce((sum, share) => sum + share, 0);
  return rounded.map((share) => share / 100);
});
const series: CartesianChartProps.SeriesOptions[] = visitTypes.map((name, index) => ({
  type: "column",
  name,
  data: shares.map((monthShares) => monthShares[index]),
}));

export default function () {
  const settings = useContext(PageSettingsContext);
  return (
    <PageSettingsContext.Provider value={{ ...settings, zoom: true }}>
      <FullHeightStackedBars />
    </PageSettingsContext.Provider>
  );
}

function FullHeightStackedBars() {
  return (
    <Page
      title="Full height stacked bars"
      settings={<PageSettingsForm selectedSettings={["zoom", "hideZoomControls", "showLegend"]} />}
    >
      <PageSection title="Stacked columns">
        <StackedBarsChart ariaLabel="Stacked columns" inverted={false} />
      </PageSection>
      <PageSection title="Stacked horizontal bars">
        <StackedBarsChart ariaLabel="Stacked horizontal bars" inverted={true} />
      </PageSection>
    </Page>
  );
}

function StackedBarsChart({ ariaLabel, inverted }: { ariaLabel: string; inverted: boolean }) {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      ariaLabel={ariaLabel}
      chartHeight={400}
      inverted={inverted}
      stacking="normal"
      series={series}
      xAxis={{ type: "category", title: "Month", categories }}
      yAxis={{ title: "Share of visits", min: 0, max: 1, valueFormatter: percentageFormatter }}
    />
  );
}

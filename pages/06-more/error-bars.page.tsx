// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";

interface ThisPageSettings extends PageSettings, ErrorProps {
  errorSize: number;
  errorColor?: string;
}

interface ErrorProps {
  size: number;
  color?: string;
}

function errorRange(value: number, delta: number) {
  return { low: value - delta, high: value + delta };
}

const categories = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];
const costsData = [6562, 8768, 9742, 10464, 16777, 9956, 5876];
const costsErrorData = (size: number) => costsData.map((value) => ({ ...errorRange(value, size / 2) }));
const costsLastYearData = [5373, 7563, 7900, 12342, 14311, 11830, 8505];
const costsLastYearErrorData = (size: number) => costsLastYearData.map((value) => ({ ...errorRange(value, size / 2) }));

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const errorProps = { size: settings.errorSize ?? 800, color: settings.errorColor || undefined };
  return (
    <Page
      title="Error bars"
      settings={
        <SpaceBetween size="m">
          <FormField label="Error size">
            <Input
              type="number"
              value={errorProps.size.toString()}
              onChange={({ detail }) => setSettings({ errorSize: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Error color">
            <Input
              placeholder="#000000"
              value={errorProps.color ?? ""}
              onChange={({ detail }) => setSettings({ errorColor: detail.value })}
            />
          </FormField>
        </SpaceBetween>
      }
    >
      <ColumnLayout columns={2}>
        <PageSection title="Mixed chart">
          <MixedChart errorProps={errorProps} />
        </PageSection>
        <PageSection title="Grouped column chart">
          <GroupedColumnChart errorProps={errorProps} />
        </PageSection>
        <PageSection title="Stacked column chart (not supported)">
          <StackedColumnChart errorProps={errorProps} />
        </PageSection>
        <PageSection title="Scatter chart">
          <ScatterChart errorProps={errorProps} />
        </PageSection>
      </ColumnLayout>
    </Page>
  );
}

const seriesFormatter: CartesianChartProps.TooltipOptions["series"] = ({ item }) => {
  return {
    key: item.series.name,
    value: (
      <Link external={true} href="#" ariaLabel={`See details for ${item.series.name} (opens in a new tab)`}>
        {item.y !== null ? moneyFormatter(item.y) : null}
      </Link>
    ),
    error: item.error.map((error) => ({
      key: (
        <Box fontSize="body-s" color="text-body-secondary">
          {error.series.name}
        </Box>
      ),
      value: (
        <Box fontSize="body-s" color="text-body-secondary">
          {moneyFormatter(error.low)} - {moneyFormatter(error.high)}
        </Box>
      ),
    })),
  };
};

function MixedChart({ errorProps }: { errorProps: ErrorProps }) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={350}
      ariaLabel="Mixed bar chart"
      series={[
        { id: "c", name: "Costs", type: "column", data: costsData },
        { id: "c-1", name: "Costs last year", type: "spline", data: costsLastYearData },
        {
          linkedTo: "c",
          name: "Costs error",
          type: "errorbar",
          color: errorProps.color,
          data: costsErrorData(errorProps.size),
        },
        {
          linkedTo: "c-1",
          name: "Costs last year error",
          type: "errorbar",
          color: errorProps.color,
          data: costsLastYearErrorData(errorProps.size),
        },
      ]}
      tooltip={{ series: seriesFormatter }}
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function GroupedColumnChart({ errorProps }: { errorProps: ErrorProps }) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={350}
      ariaLabel="Grouped column chart"
      series={[
        { id: "c", name: "Costs", type: "column", data: costsData },
        { id: "c-1", name: "Costs last year", type: "column", data: costsLastYearData },
        {
          linkedTo: "c",
          name: "Costs error",
          type: "errorbar",
          color: errorProps.color,
          data: costsErrorData(errorProps.size),
        },
        {
          linkedTo: "c-1",
          name: "Costs last year error",
          type: "errorbar",
          color: errorProps.color,
          data: costsLastYearErrorData(errorProps.size),
        },
      ]}
      tooltip={{ series: seriesFormatter }}
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function StackedColumnChart({ errorProps }: { errorProps: ErrorProps }) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={350}
      ariaLabel="Stacked column chart"
      stacked={true}
      series={[
        { id: "c", name: "Costs", type: "column", data: costsData },
        { id: "c-1", name: "Costs last year", type: "column", data: costsLastYearData },
        {
          linkedTo: "c",
          name: "Costs error",
          type: "errorbar",
          color: errorProps.color,
          data: costsErrorData(errorProps.size),
        },
        {
          linkedTo: "c-1",
          name: "Costs last year error",
          type: "errorbar",
          color: errorProps.color,
          data: costsLastYearErrorData(errorProps.size),
        },
      ]}
      tooltip={{ series: seriesFormatter }}
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function ScatterChart({ errorProps }: { errorProps: ErrorProps }) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={350}
      ariaLabel="Scatter chart"
      series={[
        { id: "c", name: "Costs", type: "scatter", data: costsData },
        { id: "c-1", name: "Costs last year", type: "scatter", data: costsLastYearData },
        {
          linkedTo: "c",
          name: "Costs error",
          type: "errorbar",
          color: errorProps.color,
          data: costsErrorData(errorProps.size),
        },
        {
          linkedTo: "c-1",
          name: "Costs last year error",
          type: "errorbar",
          color: errorProps.color,
          data: costsLastYearErrorData(errorProps.size),
        },
      ]}
      tooltip={{ series: seriesFormatter }}
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

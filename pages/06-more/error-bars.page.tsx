// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import { moneyFormatter, numberFormatter } from "../common/formatters";
import { PageSettings, useChartSettings } from "../common/page-settings";
import { Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const CHART_HEIGHT = 400;

interface ThisPageSettings extends PageSettings {
  errorSize: number;
  errorColor?: string;
  inverted?: boolean;
  customTooltipContent: boolean;
}

interface ChartProps {
  inverted: boolean;
  errorSize: number;
  errorColor?: string;
  customTooltipContent: boolean;
}

function errorRange(value: number, delta: number) {
  return { low: value - delta, high: value + delta };
}

const categories = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];
const costsData = [6562, 8768, 9742, 10464, 16777, 9956, 5876];
const costsErrorData = (size: number) => costsData.map((value) => ({ ...errorRange(value, size / 2) }));
const costsLastYearData = [5373, 7563, 7900, 12342, 14311, 11830, 8505];
const costsLastYearErrorData = (size: number) => costsLastYearData.map((value) => ({ ...errorRange(value, size / 2) }));

const costsSeries = { id: "c", name: "Costs", type: "column", data: costsData } as const;
const costsLastYearSeries = { id: "c-1", name: "Costs last year", type: "spline", data: costsLastYearData } as const;

function getCostsErrorSeries({ errorSize, errorColor }: { errorSize: number; errorColor?: string }) {
  return {
    linkedTo: "c",
    type: "errorbar",
    color: errorColor,
    data: costsErrorData(errorSize),
  } as const;
}

function getLastYearCostsSeries({ errorSize, errorColor }: { errorSize: number; errorColor?: string }) {
  return {
    linkedTo: "c-1",
    type: "errorbar",
    color: errorColor,
    data: costsLastYearErrorData(errorSize),
  } as const;
}

function getCostSeriesWithError({
  type = "column",
  errorSize,
  errorColor,
}: {
  errorSize: number;
  errorColor?: string;
  type?: "column";
}) {
  return [{ ...costsSeries, type }, getCostsErrorSeries({ errorColor, errorSize })];
}

function getLastYearCostsSeriesWithError({
  type = "spline",
  errorSize,
  errorColor,
}: {
  errorSize: number;
  errorColor?: string;
  type?: "column" | "spline";
}) {
  return [{ ...costsLastYearSeries, type }, getLastYearCostsSeries({ errorColor, errorSize })];
}

export default function () {
  const { settings, setSettings } = useChartSettings<ThisPageSettings>();
  const chartProps = {
    inverted: settings.inverted ?? false,
    errorSize: settings.errorSize ?? 800,
    errorColor: settings.errorColor || undefined,
    customTooltipContent: settings.customTooltipContent ?? false,
  };
  return (
    <Page
      title="Error bars"
      settings={
        <SpaceBetween size="m">
          <Checkbox checked={chartProps.inverted} onChange={({ detail }) => setSettings({ inverted: detail.checked })}>
            Invert chart
          </Checkbox>
          <Checkbox
            checked={chartProps.customTooltipContent}
            onChange={({ detail }) => setSettings({ customTooltipContent: detail.checked })}
          >
            Custom tooltip content
          </Checkbox>
          <FormField label="Error size">
            <Input
              type="number"
              value={chartProps.errorSize.toString()}
              onChange={({ detail }) => setSettings({ errorSize: parseInt(detail.value) })}
            />
          </FormField>
          <FormField label="Error color">
            <Input
              placeholder="#000000"
              value={chartProps.errorColor ?? ""}
              onChange={({ detail }) => setSettings({ errorColor: detail.value })}
            />
          </FormField>
        </SpaceBetween>
      }
    >
      <ColumnLayout columns={2}>
        <PageSection title="Column chart">
          <ColumnChart {...chartProps} />
        </PageSection>
        <PageSection title="Line chart">
          <LineChart {...chartProps} />
        </PageSection>
        <PageSection title="Mixed chart">
          <MixedChart {...chartProps} />
        </PageSection>
        <PageSection title="Grouped column chart">
          <GroupedColumnChart {...chartProps} />
        </PageSection>
        <PageSection title="Line chart with many series">
          <LineChart {...chartProps} numberOfSeries={8} />
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
    details: item.error ? `${moneyFormatter(item.error.low)} - ${moneyFormatter(item.error.high)}*` : null,
  };
};

function ColumnChart({ inverted, errorSize, errorColor, customTooltipContent }: ChartProps) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={CHART_HEIGHT}
      inverted={inverted}
      ariaLabel="Column chart"
      series={getCostSeriesWithError({ errorColor, errorSize })}
      tooltip={
        customTooltipContent
          ? {
              series: seriesFormatter,
              footer: () => "*Error range",
            }
          : undefined
      }
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function MixedChart({ inverted, errorSize, errorColor, customTooltipContent }: ChartProps) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={CHART_HEIGHT}
      inverted={inverted}
      ariaLabel="Mixed bar chart"
      series={[
        ...getCostSeriesWithError({ errorColor, errorSize }),
        ...getLastYearCostsSeriesWithError({ errorColor, errorSize }),
      ]}
      tooltip={
        customTooltipContent
          ? {
              series: seriesFormatter,
              footer: () => "*Error range",
            }
          : undefined
      }
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function GroupedColumnChart({ inverted, errorSize, errorColor, customTooltipContent }: ChartProps) {
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={CHART_HEIGHT}
      inverted={inverted}
      ariaLabel="Grouped column chart"
      series={[
        ...getCostSeriesWithError({ errorColor, errorSize }),
        ...getLastYearCostsSeriesWithError({ errorColor, errorSize, type: "column" }),
      ]}
      tooltip={
        customTooltipContent
          ? {
              series: seriesFormatter,
              footer: () => "*Error range",
            }
          : undefined
      }
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

function LineChart({
  inverted,
  errorSize,
  errorColor,
  customTooltipContent,
  numberOfSeries = 3,
}: ChartProps & { numberOfSeries?: number }) {
  const { chartProps } = useChartSettings({ more: true });
  const createSeries = (index: number) => {
    const data = costsData.map((y) => y + Math.floor(pseudoRandom() * 10000) - 5000);
    const lineSeries: CartesianChartProps.LineSeriesOptions = {
      id: `c-${index}`,
      name: `Costs ${index + 1}`,
      type: "line",
      data: data,
    };
    const errorSeries: CartesianChartProps.ErrorBarSeriesOptions = {
      linkedTo: `c-${index}`,
      type: "errorbar",
      color: errorColor,
      data: data.map((value) => ({ ...errorRange(value, errorSize / 2) })),
    };
    return [lineSeries, errorSeries];
  };
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={CHART_HEIGHT}
      inverted={inverted}
      ariaLabel="Scatter chart"
      series={new Array(numberOfSeries)
        .fill(null)
        .map((_, index) => createSeries(index))
        .flatMap((s) => s)}
      tooltip={
        customTooltipContent
          ? {
              series: seriesFormatter,
              footer: () => "*Error range",
            }
          : undefined
      }
      xAxis={{ type: "category", title: "Budget month", categories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

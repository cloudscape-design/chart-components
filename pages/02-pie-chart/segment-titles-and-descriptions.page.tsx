// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";

import { PieChart, PieChartProps } from "../../lib/components";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  segmentDistribution: "proportional" | "growing" | "fast growing";
  reverseSegmentDirection: boolean;
  chartType: "pie" | "donut";
  showTitles: boolean;
  showDescriptions: boolean;
}

const chartTypeOptions = [{ value: "pie" }, { value: "donut" }];

const segmentDistributionOptions = [{ value: "proportional" }, { value: "growing" }, { value: "fast growing" }];

export default function () {
  const { settings, setSettings, chartProps } = useChartSettings<ThisPageSettings>();
  const {
    chartType = "pie",
    showTitles = true,
    showDescriptions = true,
    segmentDistribution = "proportional",
    reverseSegmentDirection = false,
  } = settings;

  const getPieSeries = (segments: number): PieChartProps.SeriesOptions => {
    const letters = "ABCDEFGHIJKLMNOP";
    const data = range(0, segments).map((i) => {
      switch (segmentDistribution) {
        case "growing":
          return { name: `Item ${letters[i]}`, y: 2 * (i + 1) };
        case "fast growing":
          return { name: `Item ${letters[i]}`, y: Math.pow(2, i) };
        case "proportional":
        default:
          return { name: `Item ${letters[i]}`, y: Math.round(1000 / segments) };
      }
    });
    if (reverseSegmentDirection) {
      data.reverse();
    }
    return { name: "Units", type: chartType, data };
  };

  return (
    <Page
      title="Pie chart: segments titles and descriptions"
      subtitle="The page demonstrates pie / donut charts with different number of segments, with and without segment titles
      and descriptions. Use page settings to change chart type, or show / hide titles and descriptions."
      settings={
        <PageSettingsForm
          selectedSettings={[
            "height",
            "showLegend",
            {
              content: (
                <Checkbox checked={showTitles} onChange={({ detail }) => setSettings({ showTitles: detail.checked })}>
                  Show titles
                </Checkbox>
              ),
            },
            {
              content: (
                <Checkbox
                  checked={showDescriptions}
                  onChange={({ detail }) => setSettings({ showDescriptions: detail.checked })}
                >
                  Show descriptions
                </Checkbox>
              ),
            },
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
            {
              content: (
                <FormField label="Segments distribution">
                  <Select
                    options={segmentDistributionOptions}
                    selectedOption={
                      segmentDistributionOptions.find((o) => settings.segmentDistribution === o.value) ??
                      segmentDistributionOptions[0]
                    }
                    onChange={({ detail }) =>
                      setSettings({
                        segmentDistribution: detail.selectedOption.value as ThisPageSettings["segmentDistribution"],
                      })
                    }
                  />
                </FormField>
              ),
            },
            {
              content: (
                <Checkbox
                  checked={reverseSegmentDirection}
                  onChange={({ detail }) => setSettings({ reverseSegmentDirection: detail.checked })}
                >
                  Reverse segment direction
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <ColumnLayout columns={2}>
        {range(0, 10).map((index) => (
          <PieChart
            key={index}
            {...chartProps.pie}
            chartHeight={settings.height}
            ariaLabel={`Pie chart with ${index + 1} segments`}
            series={getPieSeries(index + 1)}
            segmentTitle={showTitles ? undefined : () => ""}
            segmentDescription={
              showDescriptions
                ? ({ segmentValue, totalValue }) =>
                    `${segmentValue} units, ${((segmentValue / totalValue) * 100).toFixed(1)}%`
                : undefined
            }
          />
        ))}
      </ColumnLayout>
    </Page>
  );
}

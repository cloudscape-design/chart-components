// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useRef, useState } from "react";
import type Highcharts from "highcharts";

import Autosuggest from "@cloudscape-design/components/autosuggest";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Multiselect from "@cloudscape-design/components/multiselect";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { BaseNoDataProps } from "../../lib/components/core/interfaces-base";
import AppContext, { AppContextType } from "../app/app-context";
import { useHighcharts } from "./use-highcharts";

interface ChartRef {
  clearFilter(): void;
}

export interface PageSettings {
  height: number;
  minHeight: number;
  minWidth: number;
  containerHeight: number;
  containerWidth: string;
  chartHeight: number;
  pieInnerValue: string;
  pieInnerDescription: string;
  selectedSeries: string[]; // a stringified array of series IDs
  visibleContent: string[]; // a stringified array of series IDs
  applyLoadingState: boolean;
  applyEmptyState: boolean;
  applyErrorState: boolean;
  showLegend: boolean;
  showLegendTitle: boolean;
  emphasizeBaselineAxis: boolean;
  tooltipPlacement: "target" | "bottom";
  tooltipSize: "small" | "medium" | "large";
  keepZoomingFrame: boolean;
  useFallback: boolean;
}

type PageContext<SettingsType> = React.Context<AppContextType<Partial<SettingsType>>>;

const DEFAULT_SETTINGS: PageSettings = {
  height: 250,
  minHeight: 250,
  minWidth: 800,
  containerHeight: 400,
  containerWidth: "100%",
  chartHeight: 499,
  pieInnerValue: "",
  pieInnerDescription: "",
  selectedSeries: [],
  visibleContent: [],
  applyLoadingState: false,
  applyEmptyState: false,
  applyErrorState: false,
  showLegend: true,
  showLegendTitle: false,
  emphasizeBaselineAxis: true,
  tooltipPlacement: "target",
  tooltipSize: "medium",
  keepZoomingFrame: false,
  useFallback: false,
};

export const PageSettingsDefaultsContext = createContext<PageSettings>(DEFAULT_SETTINGS);

export function PageSettingsDefaults({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Partial<PageSettings>;
}) {
  return (
    <PageSettingsDefaultsContext.Provider value={{ ...DEFAULT_SETTINGS, ...settings }}>
      {children}
    </PageSettingsDefaultsContext.Provider>
  );
}

export function usePageSettings<SettingsType extends PageSettings = PageSettings>(
  options: { more?: boolean; treemap?: boolean; xrange?: boolean } = {},
): {
  highcharts: null | typeof Highcharts;
  settings: SettingsType;
  setSettings: (settings: Partial<SettingsType>) => void;
  chartStateProps: {
    ref: React.Ref<ChartRef>;
    noData: BaseNoDataProps;
  };
} {
  const highcharts = useHighcharts(options);
  const defaultSettings = useContext(PageSettingsDefaultsContext);
  const { urlParams, setUrlParams } = useContext(AppContext as PageContext<SettingsType>);
  const settings = {
    ...defaultSettings,
    ...urlParams,
    height: parseNumber(defaultSettings.height, urlParams.height),
    minHeight: parseNumber(defaultSettings.minHeight, urlParams.minHeight),
    minWidth: parseNumber(defaultSettings.minWidth, urlParams.minWidth),
    containerHeight: parseNumber(defaultSettings.containerHeight, urlParams.containerHeight),
    chartHeight: parseNumber(defaultSettings.chartHeight, urlParams.chartHeight),
    selectedSeries: parseStringArray(defaultSettings.selectedSeries, urlParams.selectedSeries),
    visibleContent: parseStringArray(defaultSettings.visibleContent, urlParams.visibleContent),
    applyLoadingState: parseBoolean(defaultSettings.applyLoadingState, urlParams.applyLoadingState),
    applyEmptyState: parseBoolean(defaultSettings.applyEmptyState, urlParams.applyEmptyState),
    applyErrorState: parseBoolean(defaultSettings.applyErrorState, urlParams.applyErrorState),
    showLegend: parseBoolean(defaultSettings.showLegend, urlParams.showLegend),
    showLegendTitle: parseBoolean(defaultSettings.showLegendTitle, urlParams.showLegendTitle),
    emphasizeBaselineAxis: parseBoolean(defaultSettings.emphasizeBaselineAxis, urlParams.emphasizeBaselineAxis),
    keepZoomingFrame: parseBoolean(defaultSettings.keepZoomingFrame, urlParams.keepZoomingFrame),
    useFallback: parseBoolean(defaultSettings.useFallback, urlParams.useFallback),
  } as PageSettings as SettingsType;
  const setSettings = (partial: Partial<SettingsType>) => {
    const settings = { ...partial };
    if (settings.selectedSeries) {
      settings.selectedSeries = settings.selectedSeries.join(",") as any;
    }
    if (settings.visibleContent) {
      settings.visibleContent = settings.visibleContent.join(",") as any;
    }
    setUrlParams(settings as any);
  };

  const ref = useRef<ChartRef>(null);
  const onClearFilter = () => ref.current?.clearFilter();
  return {
    highcharts,
    settings,
    setSettings,
    chartStateProps: {
      ref,
      noData: {
        statusType: settings.applyLoadingState ? "loading" : settings.applyErrorState ? "error" : "finished",
        empty: (
          <Box textAlign="center">
            <b>No data available</b>
            <Box variant="p">There is no data available</Box>
          </Box>
        ),
        noMatch: (
          <Box textAlign="center">
            <b>No matching data</b>
            <Box variant="p">There is no matching data to display</Box>
            <Button onClick={onClearFilter}>Clear filter</Button>
          </Box>
        ),
        // Not including loading and empty states to let those be served from i18n.
        // Adding an empty recovery click handler to make the default recovery button appear.
        onRecoveryClick: () => {},
      },
    },
  };
}

export function SeriesFilter({ allSeries }: { allSeries: string[] }) {
  const { settings, setSettings } = usePageSettings();
  const options = allSeries.map((value) => ({ value, label: value }));
  return (
    <FormField label="Visible series">
      <div style={{ maxWidth: 300 }}>
        <Multiselect
          options={options}
          selectedOptions={options.filter((option) => settings.visibleContent.includes(option.value))}
          onChange={({ detail }) =>
            setSettings({ visibleContent: detail.selectedOptions.map((option) => option.value!) })
          }
          inlineTokens={true}
        />
      </div>
    </FormField>
  );
}

export function SeriesSelector({ allSeries }: { allSeries: string[] }) {
  const { settings, setSettings } = usePageSettings();
  const [autosuggestValue, setAutosuggestValue] = useState("");
  const availableSeries = allSeries.filter((s) => !settings.selectedSeries.includes(s));
  return (
    <FormField
      label={
        <Box variant="span" fontWeight="bold">
          Selected series{" "}
          <Box variant="span" color="text-body-secondary">
            ({settings.selectedSeries.length})
          </Box>
        </Box>
      }
    >
      <div style={{ maxWidth: 300 }}>
        <SpaceBetween size="s">
          <Autosuggest
            options={availableSeries.map((value) => ({ value }))}
            value={autosuggestValue}
            onChange={({ detail }) => setAutosuggestValue(detail.value)}
            onSelect={({ detail }) => {
              const closest = availableSeries.find((seriesName) => seriesName.includes(detail.value));
              if (closest) {
                setSettings({ selectedSeries: [...new Set([...settings.selectedSeries, closest])] });
              }
              setAutosuggestValue("");
            }}
            enteredTextLabel={(value) => {
              const closest = availableSeries.find((seriesName) => seriesName.includes(value));
              return closest ? `Use "${closest}"` : "Clear input";
            }}
          />

          <ReorderableList
            options={settings.selectedSeries}
            onReorder={(selectedSeries) => setSettings({ selectedSeries: [...selectedSeries] })}
            onRemove={(removedSeries) =>
              setSettings({ selectedSeries: settings.selectedSeries.filter((s) => s !== removedSeries) })
            }
          />
        </SpaceBetween>
      </div>
    </FormField>
  );
}

const placementOptions = [{ value: "target" }, { value: "bottom" }];

const sizeOptions = [{ value: "small" }, { value: "medium" }, { value: "large" }];

export function TooltipSettings() {
  const {
    settings: { tooltipPlacement = "target", tooltipSize = "medium" },
    setSettings,
  } = usePageSettings();
  return (
    <SpaceBetween size="s">
      <FormField label="Tooltip placement">
        <Select
          options={placementOptions}
          selectedOption={placementOptions.find((option) => option.value === tooltipPlacement) ?? placementOptions[0]}
          onChange={({ detail }) =>
            setSettings({ tooltipPlacement: detail.selectedOption.value as string as "target" | "bottom" })
          }
        />
      </FormField>

      <FormField label="Tooltip size">
        <Select
          options={sizeOptions}
          selectedOption={sizeOptions.find((option) => option.value === tooltipSize) ?? sizeOptions[1]}
          onChange={({ detail }) =>
            setSettings({ tooltipSize: detail.selectedOption.value as string as "small" | "medium" | "large" })
          }
        />
      </FormField>
    </SpaceBetween>
  );
}

function ReorderableList({
  options,
  onReorder,
  onRemove,
}: {
  options: readonly string[];
  onReorder: (options: readonly string[]) => void;
  onRemove: (option: string) => void;
}) {
  const moveUp = (index: number) => {
    const option = options[index];
    const newOptions = [...options];
    newOptions.splice(index, 1);
    newOptions.splice(index - 1, 0, option);
    onReorder(newOptions);
  };
  const moveDown = (index: number) => {
    const option = options[index];
    const newOptions = [...options];
    newOptions.splice(index, 1);
    newOptions.splice(index + 1, 0, option);
    onReorder(newOptions);
  };
  return (
    <ul role="list">
      {options.map((option, index) => (
        <li key={option}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <div>
              <Button
                variant="inline-icon"
                ariaLabel="Move up"
                iconName="arrow-up"
                onClick={() => moveUp(index)}
                disabled={index === 0}
              />
              <Button
                variant="inline-icon"
                ariaLabel="Move down"
                iconName="arrow-down"
                onClick={() => moveDown(index)}
                disabled={index === options.length - 1}
              />
              <label>{option}</label>
            </div>

            <Button variant="inline-icon" iconName="remove" onClick={() => onRemove(option)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function parseStringArray(defaultValue: string[], value?: string | string[]) {
  if (typeof value !== "string") {
    return defaultValue;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(defaultValue: number, value?: number | string) {
  if (typeof value === "undefined") {
    return defaultValue;
  }
  return typeof value === "number" ? value : parseInt(value);
}

function parseBoolean(defaultValue: boolean, value?: boolean | string) {
  if (typeof value === "undefined") {
    return defaultValue;
  }
  return typeof value === "boolean" ? value : value === "true";
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext, Fragment, useContext, useRef, useState } from "react";
import type Highcharts from "highcharts";

import Autosuggest from "@cloudscape-design/components/autosuggest";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Multiselect from "@cloudscape-design/components/multiselect";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { BaseLegendProps, BaseNoDataProps, BaseTooltipProps } from "../../lib/components/core/interfaces-base";
import AppContext, { AppContextType } from "../app/app-context";
import { useHighcharts } from "./use-highcharts";

interface ChartRef {
  clearFilter(): void;
}

export interface PageSettings {
  height: number;
  minHeight: number;
  minWidth: number;
  containerHeight: string;
  containerWidth: string;
  emptySeries: boolean;
  seriesLoading: boolean;
  seriesError: boolean;
  emphasizeBaselineAxis: boolean;
  tooltipPlacement: "target" | "bottom";
  tooltipSize: "small" | "medium" | "large";
  showLegend: boolean;
  showLegendTitle: boolean;
  showLegendFilter: boolean;
  showLegendTooltip: boolean;
  showLegendTooltipAction: boolean;
  useFallback: boolean;
}

type PageContext<SettingsType> = React.Context<AppContextType<Partial<SettingsType>>>;

const DEFAULT_SETTINGS: PageSettings = {
  height: 250,
  minHeight: 250,
  minWidth: 800,
  containerHeight: "400px",
  containerWidth: "100%",
  emptySeries: false,
  seriesLoading: false,
  seriesError: false,
  emphasizeBaselineAxis: true,
  tooltipPlacement: "target",
  tooltipSize: "medium",
  showLegend: true,
  showLegendTitle: false,
  showLegendFilter: false,
  showLegendTooltip: false,
  showLegendTooltipAction: false,
  useFallback: false,
};

export const PageSettingsContext = createContext<PageSettings>(DEFAULT_SETTINGS);

export function usePageSettings<SettingsType extends PageSettings = PageSettings>(
  options: { more?: boolean; treemap?: boolean; xrange?: boolean } = {},
): {
  settings: SettingsType;
  setSettings: (settings: Partial<SettingsType>) => void;
  chartProps: {
    ref: React.Ref<ChartRef>;
    highcharts: null | typeof Highcharts;
    noData: BaseNoDataProps;
    tooltip: BaseTooltipProps;
    legend: BaseLegendProps;
    emphasizeBaselineAxis: boolean;
  };
  isEmpty: boolean;
} {
  const highcharts = useHighcharts(options);
  const defaultSettings = useContext(PageSettingsContext);
  const { urlParams, setUrlParams } = useContext(AppContext as PageContext<SettingsType>);
  const settings = {
    ...defaultSettings,
    ...urlParams,
    height: parseNumber(defaultSettings.height, urlParams.height),
    minHeight: parseNumber(defaultSettings.minHeight, urlParams.minHeight),
    minWidth: parseNumber(defaultSettings.minWidth, urlParams.minWidth),
    emptySeries: parseBoolean(defaultSettings.emptySeries, urlParams.emptySeries),
    seriesLoading: parseBoolean(defaultSettings.seriesLoading, urlParams.seriesLoading),
    seriesError: parseBoolean(defaultSettings.seriesError, urlParams.seriesError),
    emphasizeBaselineAxis: parseBoolean(defaultSettings.emphasizeBaselineAxis, urlParams.emphasizeBaselineAxis),
    showLegend: parseBoolean(defaultSettings.showLegend, urlParams.showLegend),
    showLegendTitle: parseBoolean(defaultSettings.showLegendTitle, urlParams.showLegendTitle),
    showLegendFilter: parseBoolean(defaultSettings.showLegendFilter, urlParams.showLegendFilter),
    showLegendTooltip: parseBoolean(defaultSettings.showLegendTooltip, urlParams.showLegendTooltip),
    showLegendTooltipAction: parseBoolean(defaultSettings.showLegendTooltipAction, urlParams.showLegendTooltipAction),
    useFallback: parseBoolean(defaultSettings.useFallback, urlParams.useFallback),
  } as PageSettings as SettingsType;
  const setSettings = (partial: Partial<SettingsType>) => {
    setUrlParams(partial as any);
  };

  const ref = useRef<ChartRef>(null);
  const onClearFilter = () => ref.current?.clearFilter();
  return {
    settings,
    setSettings,
    chartProps: {
      ref,
      highcharts: settings.useFallback ? null : highcharts,
      noData: {
        statusType: settings.seriesLoading ? "loading" : settings.seriesError ? "error" : "finished",
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
      tooltip: {
        placement: settings.tooltipPlacement,
        size: settings.tooltipSize,
      },
      legend: {
        enabled: settings.showLegend,
        title: settings.showLegendTitle ? "Legend title" : undefined,
        filter: settings.showLegendFilter,
        tooltip: settings.showLegendTooltip
          ? {
              render: (itemId) => ({
                header: itemId,
                body: "Item details",
                footer: settings.showLegendTooltipAction ? <Button>Legend tooltip action</Button> : null,
              }),
            }
          : undefined,
      },
      emphasizeBaselineAxis: settings.emphasizeBaselineAxis,
    },
    isEmpty: settings.emptySeries || settings.seriesLoading || settings.seriesError,
  };
}

const tooltipPlacementOptions = [{ value: "target" }, { value: "bottom" }];

const tooltipSizeOptions = [{ value: "small" }, { value: "medium" }, { value: "large" }];

export function PageSettingsForm({
  selectedSettings,
}: {
  selectedSettings: (keyof PageSettings | { content: React.ReactNode })[];
}) {
  const { settings, setSettings } = usePageSettings();
  return (
    <SpaceBetween size="s">
      {selectedSettings.map((setting, index) => {
        const content: React.ReactNode = (() => {
          if (typeof setting === "object") {
            return setting.content;
          }
          switch (setting) {
            case "height":
              return (
                <FormField label="Chart height">
                  <Input
                    type="number"
                    value={settings.height.toString()}
                    onChange={({ detail }) => setSettings({ height: parseInt(detail.value) })}
                  />
                </FormField>
              );
            case "minHeight":
              return (
                <FormField label="Chart min height">
                  <Input
                    type="number"
                    value={settings.minHeight.toString()}
                    onChange={({ detail }) => setSettings({ minHeight: parseInt(detail.value) })}
                  />
                </FormField>
              );
            case "minWidth":
              return (
                <FormField label="Chart min width">
                  <Input
                    type="number"
                    value={settings.minWidth.toString()}
                    onChange={({ detail }) => setSettings({ minWidth: parseInt(detail.value) })}
                  />
                </FormField>
              );
            case "containerHeight":
              return (
                <FormField label="Container height">
                  <Input
                    value={settings.containerHeight.toString()}
                    onChange={({ detail }) => setSettings({ containerHeight: detail.value })}
                  />
                </FormField>
              );
            case "containerWidth":
              return (
                <FormField label="Container width">
                  <Input
                    value={settings.containerWidth}
                    onChange={({ detail }) => setSettings({ containerWidth: detail.value })}
                  />
                </FormField>
              );
            case "emptySeries":
              return (
                <Checkbox
                  checked={settings.emptySeries}
                  onChange={({ detail }) => setSettings({ emptySeries: detail.checked })}
                >
                  Apply empty state
                </Checkbox>
              );
            case "seriesLoading":
              return (
                <Checkbox
                  checked={settings.seriesLoading}
                  onChange={({ detail }) => setSettings({ seriesLoading: detail.checked })}
                >
                  Apply loading state
                </Checkbox>
              );
            case "seriesError":
              return (
                <Checkbox
                  checked={settings.seriesError}
                  onChange={({ detail }) => setSettings({ seriesError: detail.checked })}
                >
                  Apply error state
                </Checkbox>
              );
            case "emphasizeBaselineAxis":
              return (
                <Checkbox
                  checked={settings.emphasizeBaselineAxis}
                  onChange={({ detail }) => setSettings({ emphasizeBaselineAxis: detail.checked })}
                >
                  Emphasize baseline axis
                </Checkbox>
              );
            case "tooltipPlacement":
              return (
                <FormField label="Tooltip placement">
                  <Select
                    options={tooltipPlacementOptions}
                    selectedOption={
                      tooltipPlacementOptions.find((option) => option.value === settings.tooltipPlacement) ??
                      tooltipPlacementOptions[0]
                    }
                    onChange={({ detail }) =>
                      setSettings({ tooltipPlacement: detail.selectedOption.value as string as "target" | "bottom" })
                    }
                  />
                </FormField>
              );
            case "tooltipSize":
              return (
                <FormField label="Tooltip size">
                  <Select
                    options={tooltipSizeOptions}
                    selectedOption={
                      tooltipSizeOptions.find((option) => option.value === settings.tooltipSize) ??
                      tooltipSizeOptions[1]
                    }
                    onChange={({ detail }) =>
                      setSettings({
                        tooltipSize: detail.selectedOption.value as string as "small" | "medium" | "large",
                      })
                    }
                  />
                </FormField>
              );
            case "showLegend":
              return (
                <Checkbox
                  checked={settings.showLegend}
                  onChange={({ detail }) => setSettings({ showLegend: detail.checked })}
                >
                  Show legend
                </Checkbox>
              );
            case "showLegendTitle":
              return (
                <Checkbox
                  checked={settings.showLegendTitle}
                  onChange={({ detail }) => setSettings({ showLegendTitle: detail.checked })}
                >
                  Show legend title
                </Checkbox>
              );
            case "showLegendFilter":
              return (
                <Checkbox
                  checked={settings.showLegendFilter}
                  onChange={({ detail }) => setSettings({ showLegendFilter: detail.checked })}
                >
                  Show legend filter
                </Checkbox>
              );
            case "showLegendTooltip":
              return (
                <Checkbox
                  checked={settings.showLegendTooltip}
                  onChange={({ detail }) => setSettings({ showLegendTooltip: detail.checked })}
                >
                  Show legend tooltip
                </Checkbox>
              );
            case "showLegendTooltipAction":
              return (
                <Checkbox
                  checked={settings.showLegendTooltipAction}
                  onChange={({ detail }) => setSettings({ showLegendTooltipAction: detail.checked })}
                >
                  Show legend tooltip action
                </Checkbox>
              );
            case "useFallback":
              return (
                <Checkbox
                  checked={settings.useFallback}
                  onChange={({ detail }) => setSettings({ useFallback: detail.checked })}
                >
                  Show fallback
                </Checkbox>
              );
            default:
              return null;
          }
        })();
        return <Fragment key={index}>{content}</Fragment>;
      })}
    </SpaceBetween>
  );
}

export function SeriesFilter({
  allSeries,
  visibleSeries,
  onVisibleSeriesChange,
}: {
  allSeries: string[];
  visibleSeries: string[];
  onVisibleSeriesChange: (series: string[]) => void;
}) {
  const options = allSeries.map((value) => ({ value, label: value }));
  return (
    <FormField label="Visible series">
      <div style={{ maxWidth: 300 }}>
        <Multiselect
          options={options}
          selectedOptions={options.filter((option) => visibleSeries.includes(option.value))}
          onChange={({ detail }) => onVisibleSeriesChange(detail.selectedOptions.map((option) => option.value!))}
          inlineTokens={true}
        />
      </div>
    </FormField>
  );
}

export function SeriesSelector({
  allSeries,
  selectedSeries,
  onSelectedSeriesChange,
}: {
  allSeries: string[];
  selectedSeries: string[];
  onSelectedSeriesChange: (series: string[]) => void;
}) {
  const [autosuggestValue, setAutosuggestValue] = useState("");
  const availableSeries = allSeries.filter((s) => !selectedSeries.includes(s));
  return (
    <FormField
      label={
        <Box variant="span" fontWeight="bold">
          Selected series{" "}
          <Box variant="span" color="text-body-secondary">
            ({selectedSeries.length})
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
                onSelectedSeriesChange([...new Set([...selectedSeries, closest])]);
              }
              setAutosuggestValue("");
            }}
            enteredTextLabel={(value) => {
              const closest = availableSeries.find((seriesName) => seriesName.includes(value));
              return closest ? `Use "${closest}"` : "Clear input";
            }}
          />

          <ReorderableList
            options={selectedSeries}
            onReorder={(selectedSeries) => onSelectedSeriesChange([...selectedSeries])}
            onRemove={(removedSeries) => onSelectedSeriesChange(selectedSeries.filter((s) => s !== removedSeries))}
          />
        </SpaceBetween>
      </div>
    </FormField>
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useRef } from "react";
import type Highcharts from "highcharts";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

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
  containerHeight: 300,
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
          <Box textAlign="center" color="inherit">
            <b>No data available</b>
            <Box variant="p" color="inherit">
              There is no data available
            </Box>
          </Box>
        ),
        loading: <StatusIndicator type="loading">Loading data</StatusIndicator>,
        error: (
          <span>
            <StatusIndicator type="error">{`The data couldn't be fetched. Try again later.`}</StatusIndicator>{" "}
            <Button variant="inline-link">Retry</Button>
          </span>
        ),
        noMatch: (
          <Box textAlign="center" color="inherit">
            <b>No matching data</b>
            <Box variant="p" color="inherit">
              There is no matching data to display
            </Box>
            <Button onClick={onClearFilter}>Clear filter</Button>
          </Box>
        ),
      },
    },
  };
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { ChartSeriesMarkerStatus } from "../internal/components/series-marker/interfaces";
import { CoreChartProps } from "./interfaces";

export interface ChartLabels {
  chartLabel?: string;
  chartDescription?: string;
  chartContainerLabel?: string;
  chartXAxisLabel?: string;
  chartYAxisLabel?: string;
  chartSegmentLabel?: string;
  itemMarkerLabel?: (status?: ChartSeriesMarkerStatus) => string | undefined;
  enterZoomModeButtonText?: string;
  enterZoomModeButtonAriaLabel?: string;
  exitZoomModeButtonText?: string;
  exitZoomModeButtonAriaLabel?: string;
  resetZoomButtonText?: string;
  resetZoomButtonAriaLabel?: string;
  zoomControlsAriaLabel?: string;
  zoomCursorAriaLabel?: string;
  zoomCursorPreviousButtonAriaLabel?: string;
  zoomCursorNextButtonAriaLabel?: string;
  zoomModeEnteredAnnouncementText?: (value: string) => string;
  zoomCursorPositionAnnouncementText?: (value: string) => string;
  zoomStartPointAnnouncementText?: (value: string) => string;
  zoomRangeChangeAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomSelectionAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomModeExitedAnnouncementText?: string;
  zoomResetAnnouncementText?: string;
}

// The zoom messages are not part of the typed "[charts]" namespace of the components package yet.
type ZoomFormatFunction = <T>(
  key: string,
  provided: T,
  handler?: (format: (args: Record<string, string>) => string) => T,
) => T;

export function useChartI18n({
  ariaLabel,
  ariaDescription,
  i18nStrings,
}: {
  ariaLabel?: string;
  ariaDescription?: string;
  i18nStrings?: CoreChartProps.I18nStrings;
}): ChartLabels {
  const i18n = useInternalI18n("[charts]");
  const i18nPie = useInternalI18n("pie-chart");
  const i18nZoom = i18n as unknown as ZoomFormatFunction;
  const zoomValueText = (key: string, provided?: (value: string) => string) =>
    i18nZoom(`i18nStrings.${key}`, provided, (format) => (value) => format({ value }));
  const zoomRangeText = (key: string, provided?: (startValue: string, endValue: string) => string) =>
    i18nZoom(`i18nStrings.${key}`, provided, (format) => (startValue, endValue) => format({ startValue, endValue }));
  return {
    chartLabel: ariaLabel,
    chartDescription: ariaDescription,
    // We reuse existing translations as passing for now, but it is possible to introduce new i18n strings that
    // are parametrized with axes names, and more.
    chartContainerLabel: i18n("i18nStrings.chartAriaRoleDescription", i18nStrings?.chartRoleDescription),
    chartXAxisLabel: i18n("i18nStrings.xAxisAriaRoleDescription", i18nStrings?.xAxisRoleDescription),
    chartYAxisLabel: i18n("i18nStrings.yAxisAriaRoleDescription", i18nStrings?.yAxisRoleDescription),
    chartSegmentLabel: i18nPie("i18nStrings.segmentAriaRoleDescription", i18nStrings?.segmentRoleDescription),
    enterZoomModeButtonText: i18nZoom("i18nStrings.enterZoomModeButtonText", i18nStrings?.enterZoomModeButtonText),
    enterZoomModeButtonAriaLabel: i18nZoom(
      "i18nStrings.enterZoomModeButtonAriaLabel",
      i18nStrings?.enterZoomModeButtonAriaLabel,
    ),
    exitZoomModeButtonText: i18nZoom("i18nStrings.exitZoomModeButtonText", i18nStrings?.exitZoomModeButtonText),
    exitZoomModeButtonAriaLabel: i18nZoom(
      "i18nStrings.exitZoomModeButtonAriaLabel",
      i18nStrings?.exitZoomModeButtonAriaLabel,
    ),
    resetZoomButtonText: i18nZoom("i18nStrings.resetZoomButtonText", i18nStrings?.resetZoomButtonText),
    resetZoomButtonAriaLabel: i18nZoom("i18nStrings.resetZoomButtonAriaLabel", i18nStrings?.resetZoomButtonAriaLabel),
    zoomControlsAriaLabel: i18nZoom("i18nStrings.zoomControlsAriaLabel", i18nStrings?.zoomControlsAriaLabel),
    zoomCursorAriaLabel: i18nZoom("i18nStrings.zoomCursorAriaLabel", i18nStrings?.zoomCursorAriaLabel),
    zoomCursorPreviousButtonAriaLabel: i18nZoom(
      "i18nStrings.zoomCursorPreviousButtonAriaLabel",
      i18nStrings?.zoomCursorPreviousButtonAriaLabel,
    ),
    zoomCursorNextButtonAriaLabel: i18nZoom(
      "i18nStrings.zoomCursorNextButtonAriaLabel",
      i18nStrings?.zoomCursorNextButtonAriaLabel,
    ),
    zoomModeEnteredAnnouncementText: zoomValueText(
      "zoomModeEnteredAnnouncementText",
      i18nStrings?.zoomModeEnteredAnnouncementText,
    ),
    // The cursor position is the formatted value itself, which needs no translation.
    zoomCursorPositionAnnouncementText:
      zoomValueText("zoomCursorPositionAnnouncementText", i18nStrings?.zoomCursorPositionAnnouncementText) ??
      ((value) => value),
    zoomStartPointAnnouncementText: zoomValueText(
      "zoomStartPointAnnouncementText",
      i18nStrings?.zoomStartPointAnnouncementText,
    ),
    zoomRangeChangeAnnouncementText: zoomRangeText(
      "zoomRangeChangeAnnouncementText",
      i18nStrings?.zoomRangeChangeAnnouncementText,
    ),
    zoomSelectionAnnouncementText: zoomRangeText(
      "zoomSelectionAnnouncementText",
      i18nStrings?.zoomSelectionAnnouncementText,
    ),
    zoomModeExitedAnnouncementText: i18nZoom(
      "i18nStrings.zoomModeExitedAnnouncementText",
      i18nStrings?.zoomModeExitedAnnouncementText,
    ),
    zoomResetAnnouncementText: i18nZoom(
      "i18nStrings.zoomResetAnnouncementText",
      i18nStrings?.zoomResetAnnouncementText,
    ),
    itemMarkerLabel: (status = "default") => {
      switch (status) {
        case "warning":
          return i18nStrings?.itemMarkerStatusAriaLabel?.(status);
        default:
          return undefined;
      }
    },
  };
}

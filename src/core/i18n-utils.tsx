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
  zoomStartPointAnnouncementText?: (value: string) => string;
  zoomRangeChangeAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomSelectionAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomModeExitedAnnouncementText?: string;
  zoomResetAnnouncementText?: string;
}

// The zoom messages are not part of the typed "[charts]" namespace of the components package yet.
type ZoomFormatFunction = <T>(
  key: string,
  provided: undefined,
  handler?: (format: (args: Record<string, string>) => string) => T,
) => undefined | T;

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
  const zoomText = (key: string) => i18nZoom<string>(`i18nStrings.${key}`, undefined);
  const zoomValueText = (key: string) =>
    i18nZoom(`i18nStrings.${key}`, undefined, (format) => (value: string) => format({ value }));
  const zoomRangeText = (key: string) =>
    i18nZoom(
      `i18nStrings.${key}`,
      undefined,
      (format) => (startValue: string, endValue: string) => format({ startValue, endValue }),
    );
  return {
    chartLabel: ariaLabel,
    chartDescription: ariaDescription,
    // We reuse existing translations as passing for now, but it is possible to introduce new i18n strings that
    // are parametrized with axes names, and more.
    chartContainerLabel: i18n("i18nStrings.chartAriaRoleDescription", i18nStrings?.chartRoleDescription),
    chartXAxisLabel: i18n("i18nStrings.xAxisAriaRoleDescription", i18nStrings?.xAxisRoleDescription),
    chartYAxisLabel: i18n("i18nStrings.yAxisAriaRoleDescription", i18nStrings?.yAxisRoleDescription),
    chartSegmentLabel: i18nPie("i18nStrings.segmentAriaRoleDescription", i18nStrings?.segmentRoleDescription),
    enterZoomModeButtonText: zoomText("enterZoomModeButtonText"),
    enterZoomModeButtonAriaLabel: zoomText("enterZoomModeButtonAriaLabel"),
    exitZoomModeButtonText: zoomText("exitZoomModeButtonText"),
    exitZoomModeButtonAriaLabel: zoomText("exitZoomModeButtonAriaLabel"),
    resetZoomButtonText: zoomText("resetZoomButtonText"),
    resetZoomButtonAriaLabel: zoomText("resetZoomButtonAriaLabel"),
    zoomControlsAriaLabel: zoomText("zoomControlsAriaLabel"),
    zoomCursorAriaLabel: zoomText("zoomCursorAriaLabel"),
    zoomCursorPreviousButtonAriaLabel: zoomText("zoomCursorPreviousButtonAriaLabel"),
    zoomCursorNextButtonAriaLabel: zoomText("zoomCursorNextButtonAriaLabel"),
    zoomModeEnteredAnnouncementText: zoomValueText("zoomModeEnteredAnnouncementText"),
    zoomStartPointAnnouncementText: zoomValueText("zoomStartPointAnnouncementText"),
    zoomRangeChangeAnnouncementText: zoomRangeText("zoomRangeChangeAnnouncementText"),
    zoomSelectionAnnouncementText: zoomRangeText("zoomSelectionAnnouncementText"),
    zoomModeExitedAnnouncementText: zoomText("zoomModeExitedAnnouncementText"),
    zoomResetAnnouncementText: zoomText("zoomResetAnnouncementText"),
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

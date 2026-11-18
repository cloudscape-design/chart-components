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
  zoomButtonDisabledReason?: string;
  resetZoomButtonText?: string;
  resetZoomButtonAriaLabel?: string;
  zoomControlsAriaLabel?: string;
  zoomCursorAriaLabel?: string;
  zoomModeEnteredAnnouncementText?: (value: string) => string;
  zoomStartPointAnnouncementText?: (value: string) => string;
  zoomRangeChangeAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomSelectionAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomModeExitedAnnouncementText?: string;
  zoomResetAnnouncementText?: string;
}

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
  // The disabled reason is not part of the typed "[charts]" namespace of the components package yet.
  const i18nUntyped = i18n as unknown as (key: string, provided: undefined | string) => undefined | string;
  const valueText = (
    key: "i18nStrings.zoomModeEnteredAnnouncementText" | "i18nStrings.zoomStartPointAnnouncementText",
    provided?: (value: string) => string,
  ) => i18n(key, provided, (format) => (value: string) => format({ value }));
  const rangeText = (
    key: "i18nStrings.zoomRangeChangeAnnouncementText" | "i18nStrings.zoomSelectionAnnouncementText",
    provided?: (startValue: string, endValue: string) => string,
  ) => i18n(key, provided, (format) => (startValue: string, endValue: string) => format({ startValue, endValue }));
  return {
    chartLabel: ariaLabel,
    chartDescription: ariaDescription,
    // We reuse existing translations as passing for now, but it is possible to introduce new i18n strings that
    // are parametrized with axes names, and more.
    chartContainerLabel: i18n("i18nStrings.chartAriaRoleDescription", i18nStrings?.chartRoleDescription),
    chartXAxisLabel: i18n("i18nStrings.xAxisAriaRoleDescription", i18nStrings?.xAxisRoleDescription),
    chartYAxisLabel: i18n("i18nStrings.yAxisAriaRoleDescription", i18nStrings?.yAxisRoleDescription),
    chartSegmentLabel: i18nPie("i18nStrings.segmentAriaRoleDescription", i18nStrings?.segmentRoleDescription),
    enterZoomModeButtonText: i18n("i18nStrings.enterZoomModeButtonText", i18nStrings?.enterZoomModeButtonText),
    zoomButtonDisabledReason: i18nUntyped(
      "i18nStrings.zoomButtonDisabledReason",
      i18nStrings?.zoomButtonDisabledReason,
    ),
    resetZoomButtonText: i18n("i18nStrings.resetZoomButtonText", i18nStrings?.resetZoomButtonText),
    resetZoomButtonAriaLabel: i18n("i18nStrings.resetZoomButtonAriaLabel", i18nStrings?.resetZoomButtonAriaLabel),
    zoomControlsAriaLabel: i18n("i18nStrings.zoomControlsAriaLabel", i18nStrings?.zoomControlsAriaLabel),
    zoomCursorAriaLabel: i18n("i18nStrings.zoomCursorAriaLabel", i18nStrings?.zoomCursorAriaLabel),
    zoomModeEnteredAnnouncementText: valueText(
      "i18nStrings.zoomModeEnteredAnnouncementText",
      i18nStrings?.zoomModeEnteredAnnouncementText,
    ),
    zoomStartPointAnnouncementText: valueText(
      "i18nStrings.zoomStartPointAnnouncementText",
      i18nStrings?.zoomStartPointAnnouncementText,
    ),
    zoomRangeChangeAnnouncementText: rangeText(
      "i18nStrings.zoomRangeChangeAnnouncementText",
      i18nStrings?.zoomRangeChangeAnnouncementText,
    ),
    zoomSelectionAnnouncementText: rangeText(
      "i18nStrings.zoomSelectionAnnouncementText",
      i18nStrings?.zoomSelectionAnnouncementText,
    ),
    zoomModeExitedAnnouncementText: i18n(
      "i18nStrings.zoomModeExitedAnnouncementText",
      i18nStrings?.zoomModeExitedAnnouncementText,
    ),
    zoomResetAnnouncementText: i18n("i18nStrings.zoomResetAnnouncementText", i18nStrings?.zoomResetAnnouncementText),
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

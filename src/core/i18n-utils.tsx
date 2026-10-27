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
  resetZoomButtonText?: string;
  resetZoomButtonAriaLabel?: string;
  zoomControlsAriaLabel?: string;
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
  // The zoom messages are not part of the typed "[charts]" namespace of the components package yet.
  const i18nZoom = i18n as unknown as (key: string, value: undefined) => undefined | string;
  return {
    chartLabel: ariaLabel,
    chartDescription: ariaDescription,
    // We reuse existing translations as passing for now, but it is possible to introduce new i18n strings that
    // are parametrized with axes names, and more.
    chartContainerLabel: i18n("i18nStrings.chartAriaRoleDescription", i18nStrings?.chartRoleDescription),
    chartXAxisLabel: i18n("i18nStrings.xAxisAriaRoleDescription", i18nStrings?.xAxisRoleDescription),
    chartYAxisLabel: i18n("i18nStrings.yAxisAriaRoleDescription", i18nStrings?.yAxisRoleDescription),
    chartSegmentLabel: i18nPie("i18nStrings.segmentAriaRoleDescription", i18nStrings?.segmentRoleDescription),
    resetZoomButtonText: i18nZoom("i18nStrings.resetZoomButtonText", undefined),
    resetZoomButtonAriaLabel: i18nZoom("i18nStrings.resetZoomButtonAriaLabel", undefined),
    zoomControlsAriaLabel: i18nZoom("i18nStrings.zoomControlsAriaLabel", undefined),
    zoomResetAnnouncementText: i18nZoom("i18nStrings.zoomResetAnnouncementText", undefined),
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { CoreI18nStrings } from "./interfaces";

export interface ChartLabels {
  chartLabel?: string;
  chartDescription?: string;
  chartContainerLabel?: string;
  chartXAxisLabel?: string;
  chartYAxisLabel?: string;
  chartSegmentLabel?: string;
}

export function useChartI18n({
  ariaLabel,
  ariaDescription,
  i18nStrings,
}: {
  ariaLabel?: string;
  ariaDescription?: string;
  i18nStrings?: CoreI18nStrings;
}) {
  const i18n = useInternalI18n("[charts]");
  const i18nPie = useInternalI18n("pie-chart");
  return {
    chartLabel: ariaLabel,
    chartDescription: ariaDescription,
    // We reuse existing translations as passing for now, but it is possible to introduce new i18n strings that
    // are parametrized with axes names, and more.
    chartContainerLabel: i18n("i18nStrings.chartAriaRoleDescription", i18nStrings?.chartAccessibleDescription),
    chartXAxisLabel: i18n("i18nStrings.xAxisAriaRoleDescription", i18nStrings?.xAxisAccessibleDescription),
    chartYAxisLabel: i18n("i18nStrings.yAxisAriaRoleDescription", i18nStrings?.yAxisAccessibleDescription),
    chartSegmentLabel: i18nPie("i18nStrings.segmentAriaRoleDescription", i18nStrings?.segmentAccessibleDescription),
  };
}

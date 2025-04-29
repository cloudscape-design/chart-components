// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";
import LiveRegion from "@cloudscape-design/components/live-region";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { ChartLegend as ChartLegendComponent } from "../internal/components/chart-legend";
import ChartSeriesFilter from "../internal/components/chart-series-filter";
import Portal from "../internal/components/portal";
import { fireNonCancelableEvent } from "../internal/events";
import { useSelector } from "../internal/utils/async-store";
import { ChartFooterOptions, ChartHeaderOptions, ChartLegendOptions } from "./interfaces-base";
import {
  CoreI18nStrings,
  CoreNoDataProps,
  CoreTooltipOptions,
  InternalCoreChartLegendAPI,
  InternalCoreChartNoDataAPI,
  InternalCoreChartTooltipAPI,
  InternalCoreVerticalAxisTitleAPI,
} from "./interfaces-core";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

export function ChartLegend({
  legendAPI,
  title,
  actions,
}: ChartLegendOptions & {
  legendAPI: InternalCoreChartLegendAPI;
}) {
  const legendItems = useSelector(legendAPI.store, (s) => s.items);
  return (
    <ChartLegendComponent
      ref={legendAPI.ref}
      legendTitle={title}
      items={legendItems}
      actions={actions}
      onItemVisibilityChange={legendAPI.onItemVisibilityChange}
      onItemHighlightEnter={legendAPI.onItemHighlightEnter}
      onItemHighlightExit={legendAPI.onItemHighlightExit}
    />
  );
}

export function ChartTooltip({
  tooltipAPI,
  getTooltipContent,
  placement,
  size,
}: CoreTooltipOptions & {
  tooltipAPI: InternalCoreChartTooltipAPI;
}) {
  const tooltip = useSelector(tooltipAPI.store, (s) => s);
  if (!tooltip.visible || !tooltip.point) {
    return null;
  }
  const content = getTooltipContent?.({ point: tooltip.point });
  if (!content) {
    return null;
  }
  return (
    <InternalChartTooltip
      getTrack={tooltipAPI.getTrack}
      trackKey={tooltip.point.x + ":" + tooltip.point.y}
      container={null}
      dismissButton={tooltip.pinned}
      onDismiss={tooltipAPI.onDismissTooltip}
      onMouseEnter={tooltipAPI.onMouseEnterTooltip}
      onMouseLeave={tooltipAPI.onMouseLeaveTooltip}
      title={content.header}
      footer={content.footer}
      size={size}
      position={placement === "bottom" ? "bottom" : undefined}
      minVisibleBlockSize={200}
    >
      {content.body}
    </InternalChartTooltip>
  );
}

export function ChartNoData({
  noDataAPI,
  statusType = "finished",
  loading,
  empty,
  error,
  noMatch,
  onRecoveryClick,
  i18nStrings,
}: CoreNoDataProps & {
  i18nStrings?: CoreI18nStrings;
  noDataAPI: InternalCoreChartNoDataAPI;
}) {
  const i18n = useInternalI18n("[charts]");
  const state = useSelector(noDataAPI.store, (s) => s);
  if (!state.container) {
    return null;
  }
  let content = null;
  if (statusType === "loading") {
    const loadingText = i18n("loadingText", i18nStrings?.loadingText);
    content = loading ?? <StatusIndicator type="loading">{loadingText}</StatusIndicator>;
  } else if (statusType === "error") {
    const errorText = i18n("errorText", i18nStrings?.errorText);
    const recoveryText = i18n("recoveryText", i18nStrings?.recoveryText);
    content = error ?? (
      <span>
        <StatusIndicator type="error">{i18n("errorText", errorText)}</StatusIndicator>{" "}
        {!!recoveryText && !!onRecoveryClick && (
          <Button
            onFollow={(event: CustomEvent) => {
              event.preventDefault();
              fireNonCancelableEvent(onRecoveryClick);
            }}
            variant="inline-link"
          >
            {recoveryText}
          </Button>
        )}
      </span>
    );
  } else if (state.noMatch) {
    content = noMatch;
  } else {
    content = empty;
  }
  return (
    <Portal container={state.container}>
      <div className={clsx(testClasses["no-data"], styles["no-data"])}>
        <LiveRegion>{content}</LiveRegion>
      </div>
    </Portal>
  );
}

export function ChartFilter({
  legendAPI,
  onChange,
}: {
  legendAPI: InternalCoreChartLegendAPI;
  onChange: (hiddenItems: string[]) => void;
}) {
  const legendItems = useSelector(legendAPI.store, (s) => s.items);
  return (
    <ChartSeriesFilter
      items={legendItems}
      selectedItems={legendItems.filter((i) => i.visible).map((i) => i.id)}
      onChange={({ detail }) =>
        onChange(legendItems.filter((i) => !detail.selectedItems.includes(i.id)).map((i) => i.id))
      }
    />
  );
}

export function ChartSlot({
  legendAPI,
  render,
}: (ChartHeaderOptions | ChartFooterOptions) & {
  legendAPI: InternalCoreChartLegendAPI;
}) {
  const legendItems = useSelector(legendAPI.store, (s) => s.items);
  return <>{render ? render({ legendItems }) : null}</>;
}

export function VerticalAxisTitle({
  verticalAxisTitlePlacement = "top",
  verticalAxisTitleAPI,
}: {
  verticalAxisTitlePlacement?: "top" | "side";
  verticalAxisTitleAPI: InternalCoreVerticalAxisTitleAPI;
}) {
  const titles = useSelector(verticalAxisTitleAPI.store, (s) => s.titles);
  if (verticalAxisTitlePlacement === "side") {
    return null;
  }
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
      {titles.map((text, index) => (
        <Box key={index} fontWeight="bold" margin={{ bottom: "xxs" }}>
          {text}
        </Box>
      ))}
    </div>
  );
}

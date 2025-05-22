// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { Portal } from "@cloudscape-design/component-toolkit/internal";
import Button from "@cloudscape-design/components/button";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";
import LiveRegion from "@cloudscape-design/components/live-region";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { ChartLegend as ChartLegendComponent } from "../internal/components/chart-legend";
import ChartSeriesFilter from "../internal/components/chart-series-filter";
import { fireNonCancelableEvent } from "../internal/events";
import { useSelector } from "../internal/utils/async-store";
import { ChartAPI } from "./chart-api";
import { ChartI18nStrings, ChartTooltipOptions } from "./interfaces-base";
import { CoreI18nStrings, CoreNoDataProps, TooltipContent } from "./interfaces-core";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

export interface ChartLegendProps {
  title?: string;
  actions?: React.ReactNode;
  api: ChartAPI;
}

export interface ChartLegendRef {
  highlightItems: (ids: readonly string[]) => void;
  clearHighlight: () => void;
}

export function ChartLegend({ title, actions, api }: ChartLegendProps) {
  const legendItems = useSelector(api.store, (s) => s.legend.items);
  if (legendItems.length === 0) {
    return null;
  }
  return (
    <ChartLegendComponent
      ref={(legend) => {
        if (legend) {
          api.registerLegend(legend);
        } else {
          api.unregisterLegend();
        }
      }}
      legendTitle={title}
      items={legendItems}
      actions={actions}
      onItemVisibilityChange={api.onItemVisibilityChange}
      onItemHighlightEnter={(itemId) => api.highlightChartItems([itemId])}
      onItemHighlightExit={api.clearChartItemsHighlight}
    />
  );
}

export function ChartTooltip({
  getTooltipContent,
  placement = "target",
  size,
  api,
}: ChartTooltipOptions & {
  getTooltipContent?: (props: { point: Highcharts.Point }) => null | TooltipContent;
  api: ChartAPI;
}) {
  const tooltip = useSelector(api.store, (s) => s.tooltip);
  if (!tooltip.visible || !tooltip.point) {
    return null;
  }
  const content = getTooltipContent?.({ point: tooltip.point });
  if (!content) {
    return null;
  }
  const getTrack = placement === "target" ? api.getTargetTrack : api.getGroupTrack;
  const orientation = tooltip.point?.series.chart.inverted ? "horizontal" : "vertical";
  const position = (() => {
    if (placement === "target" || placement === "middle") {
      return orientation === "vertical" ? "right" : "bottom";
    } else {
      return orientation === "vertical" ? "bottom" : "right";
    }
  })();
  return (
    <InternalChartTooltip
      getTrack={getTrack}
      trackKey={tooltip.point.x + ":" + tooltip.point.y}
      container={null}
      dismissButton={tooltip.pinned}
      onDismiss={api.onDismissTooltip}
      onMouseEnter={api.onMouseEnterTooltip}
      onMouseLeave={api.onMouseLeaveTooltip}
      title={content.header}
      footer={
        content.footer ? (
          <>
            <hr />
            {content.footer}
          </>
        ) : null
      }
      size={size}
      position={position}
      minVisibleBlockSize={200}
    >
      {content.body}
    </InternalChartTooltip>
  );
}

export function ChartNoData({
  statusType = "finished",
  loading,
  empty,
  error,
  noMatch,
  onRecoveryClick,
  i18nStrings,
  api,
}: CoreNoDataProps & {
  i18nStrings?: CoreI18nStrings;
  api: ChartAPI;
}) {
  const i18n = useInternalI18n("[charts]");
  const state = useSelector(api.store, (s) => s.noData);
  if (!state.container) {
    return null;
  }
  let content = null;
  if (statusType === "loading") {
    const loadingText = i18n("loadingText", i18nStrings?.loadingText);
    content = loading ? (
      <div className={testClasses["no-data-loading"]}>{loading}</div>
    ) : (
      <StatusIndicator type="loading" className={testClasses["no-data-loading"]}>
        {loadingText}
      </StatusIndicator>
    );
  } else if (statusType === "error") {
    const errorText = i18n("errorText", i18nStrings?.errorText);
    const recoveryText = i18n("recoveryText", i18nStrings?.recoveryText);
    content = error ? (
      <div className={testClasses["no-data-error"]}>{error}</div>
    ) : (
      <span>
        <StatusIndicator type="error" className={testClasses["no-data-error"]}>
          {i18n("errorText", errorText)}
        </StatusIndicator>
        {!!recoveryText && !!onRecoveryClick && (
          <>
            {" "}
            <Button
              onClick={(event: CustomEvent) => {
                event.preventDefault();
                fireNonCancelableEvent(onRecoveryClick);
              }}
              variant="inline-link"
              className={testClasses["no-data-retry"]}
            >
              {recoveryText}
            </Button>
          </>
        )}
      </span>
    );
  } else if (state.noMatch) {
    content = <div className={testClasses["no-data-no-match"]}>{noMatch}</div>;
  } else {
    content = <div className={testClasses["no-data-empty"]}>{empty}</div>;
  }
  return (
    <Portal container={state.container}>
      <div className={styles["no-data-wrapper"]}>
        <div className={clsx(testClasses["no-data"], styles["no-data"])}>
          <LiveRegion>{content}</LiveRegion>
        </div>
      </div>
    </Portal>
  );
}

export function ChartFilter({ api, i18nStrings }: { api: ChartAPI; i18nStrings?: ChartI18nStrings }) {
  const i18n = useInternalI18n("[charts]");
  const legendItems = useSelector(api.store, (s) => s.legend.items);
  return (
    <ChartSeriesFilter
      items={legendItems}
      selectedItems={legendItems.filter((i) => i.visible).map((i) => i.id)}
      onChange={({ detail }) =>
        api.onItemVisibilityChange(legendItems.filter((i) => detail.selectedItems.includes(i.id)).map((i) => i.id))
      }
      i18nStrings={{
        filterLabel: i18n("i18nStrings.filterLabel", i18nStrings?.seriesFilterLabel),
        filterPlaceholder: i18n("i18nStrings.filterPlaceholder", i18nStrings?.seriesFilterPlaceholder),
      }}
    />
  );
}

export function VerticalAxisTitle({ api, inverted }: { api: ChartAPI; inverted: boolean }) {
  const titles = useSelector(api.store, (s) => s.axes.verticalAxesTitles).filter(Boolean);
  if (titles.length === 0) {
    return null;
  }
  return (
    <div
      className={clsx(
        testClasses["axis-vertical-title"],
        inverted ? testClasses["axis-x-title"] : testClasses["axis-y-title"],
        styles["axis-vertical-title"],
      )}
      aria-hidden={true}
    >
      {titles.map((text, index) => (
        <span key={index} className={styles["axis-vertical-title-item"]}>
          {text}
        </span>
      ))}
    </div>
  );
}

export function ChartHeader({ children }: { children: React.ReactNode }) {
  return <div className={testClasses["chart-header"]}>{children}</div>;
}

export function ChartFooter({ children }: { children: React.ReactNode }) {
  return <div className={testClasses["chart-footer"]}>{children}</div>;
}

export function ChartApplication({ keyboardNavigation, api }: { keyboardNavigation: boolean; api: ChartAPI }) {
  const ariaLabel = useSelector(api.store, (s) => s.chartLabel);
  const liveAnnouncement = useSelector(api.store, (s) => s.liveAnnouncement);
  const isNoData = !!useSelector(api.store, (s) => s.noData.container);
  return keyboardNavigation && !isNoData ? (
    <div ref={api.setApplication} tabIndex={0} role="application" aria-label={ariaLabel}>
      <LiveRegion hidden={true} assertive={true}>
        {liveAnnouncement}
      </LiveRegion>
    </div>
  ) : null;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, memo, Ref, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import {
  circleIndex,
  handleKey,
  KeyCode,
  SingleTabStopNavigationAPI,
  SingleTabStopNavigationProvider,
  useSingleTabStopNavigation,
} from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import { InternalChartFilter } from "@cloudscape-design/components/internal/do-not-use/chart-filter";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { colorBorderDividerDefault, colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { useMergeRefs } from "../../utils/use-merge-refs";
import { DebouncedCall } from "../../utils/utils";
import { ChartSeriesMarker, ChartSeriesMarkerStatus, ChartSeriesMarkerType } from "../series-marker";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface ChartLegendItem {
  id: string;
  name: string;
  color: string;
  active: boolean;
  type: ChartSeriesMarkerType;
  status?: ChartSeriesMarkerStatus;
}

export interface ChartLegendProps {
  items: readonly ChartLegendItem[];
  align?: "start" | "center";
  legendTitle?: string;
  ariaLabel?: string;
  tooltip?: {
    render: (itemId: string) => {
      header: React.ReactNode;
      body: React.ReactNode;
      footer?: React.ReactNode;
    };
  };
  variant?: "single-target" | "dual-target" | "dual-target-inverse";
  showFilter?: boolean;
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemVisibilityChange?: (hiddenItems: string[]) => void;
}

export default memo(ChartLegend) as typeof ChartLegend;

function ChartLegend({
  items,
  align = "start",
  legendTitle,
  ariaLabel,
  tooltip,
  variant,
  showFilter,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Record<number, HTMLElement>>([]);

  const tooltipControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tooltipItem, setTooltipItem] = useState<null | string>(null);
  const tooltipItemIndex = items.findIndex((item) => item.id === tooltipItem);
  const tooltipContent = tooltipItem ? tooltip?.render(tooltipItem) : null;
  const showTooltip = (itemId: string) => {
    tooltipControl.cancelPrevious();
    setTooltipItem(itemId);
  };
  const hideTooltip = () => {
    tooltipControl.call(() => setTooltipItem(null), 50);
  };

  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);

  function onFocus(index: number) {
    setSelectedIndex(index);
    navigationAPI.current?.updateFocusTarget();
  }

  function onBlur() {
    navigationAPI.current?.updateFocusTarget();
  }

  function focusElement(index: number) {
    segmentsRef.current[index]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (
      event.keyCode === KeyCode.right ||
      event.keyCode === KeyCode.left ||
      event.keyCode === KeyCode.up ||
      event.keyCode === KeyCode.down ||
      event.keyCode === KeyCode.home ||
      event.keyCode === KeyCode.end ||
      event.keyCode === KeyCode.escape
    ) {
      // Preventing default fixes an issue in Safari+VO when VO additionally interprets arrow keys as its commands.
      event.preventDefault();

      const range = [0, items.length - 1] as [number, number];

      handleKey(event, {
        onInlineStart: () => focusElement(circleIndex(selectedIndex - 1, range)),
        onInlineEnd: () => focusElement(circleIndex(selectedIndex + 1, range)),
        onBlockStart: () => focusElement(circleIndex(selectedIndex - 1, range)),
        onBlockEnd: () => focusElement(circleIndex(selectedIndex + 1, range)),
        onHome: () => focusElement(0),
        onEnd: () => focusElement(items.length - 1),
        onEscape: () => onItemHighlightExit?.(),
      });
    }
  }

  function getNextFocusTarget(): null | HTMLElement {
    if (containerRef.current) {
      const buttons: HTMLButtonElement[] = Array.from(containerRef.current.querySelectorAll(`.${styles.marker}`));
      return buttons[selectedIndex] ?? null;
    }
    return null;
  }

  function onUnregisterActive(
    focusableElement: HTMLElement,
    navigationAPI: React.RefObject<{ getFocusTarget: () => HTMLElement | null }>,
  ) {
    const target = navigationAPI.current?.getFocusTarget();

    if (target && target.dataset.itemid !== focusableElement.dataset.itemid) {
      target.focus();
    }
  }

  useEffect(() => {
    navigationAPI.current?.updateFocusTarget();
  });

  const createPrimaryClickHandler = (itemId: string) => () => {
    const hiddenItems = items.filter((i) => !i.active).map((i) => i.id);
    if (hiddenItems.includes(itemId)) {
      onItemVisibilityChange?.(hiddenItems.filter((id) => id !== itemId));
    } else {
      onItemVisibilityChange?.([...hiddenItems, itemId]);
    }
  };
  const createSecondaryClickHandler = (itemId: string) => () => {
    const visibleItems = items.filter((i) => i.active).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      onItemVisibilityChange?.([]);
    } else {
      onItemVisibilityChange?.(items.map((i) => i.id).filter((id) => id !== itemId));
    }
  };

  return (
    <SingleTabStopNavigationProvider
      ref={navigationAPI}
      navigationActive={true}
      getNextFocusTarget={() => getNextFocusTarget()}
      onUnregisterActive={(element: HTMLElement) => onUnregisterActive(element, navigationAPI)}
    >
      <div
        ref={containerRef}
        role="toolbar"
        aria-label={legendTitle || ariaLabel}
        className={clsx(testClasses.root, styles.root)}
      >
        {legendTitle && (
          <Box fontWeight="bold" className={testClasses.title}>
            {legendTitle}
          </Box>
        )}

        <div className={clsx(styles.list, styles[`list-align-${align}`])}>
          {showFilter && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <InternalChartFilter
                series={items.map((item) => ({
                  label: item.name,
                  color: item.color,
                  type: "rectangle",
                  datum: item.id,
                }))}
                selectedSeries={items.filter((item) => item.active).map((item) => item.id)}
                onChange={(selectedSeries) =>
                  onItemVisibilityChange?.(items.map((item) => item.id).filter((id) => !selectedSeries.includes(id)))
                }
              />
              <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
            </div>
          )}

          {items.map((item, index) => {
            const handlers = {
              onMouseEnter: () => {
                onItemHighlightEnter?.(item.id);
                showTooltip(item.id);
              },
              onMouseLeave: () => {
                onItemHighlightExit?.();
                hideTooltip();
              },
              onFocus: () => {
                onFocus(index);
                onItemHighlightEnter?.(item.id);
                showTooltip(item.id);
              },
              onBlur: () => {
                onBlur();
                onItemHighlightExit?.();
                hideTooltip();
              },
              onKeyDown,
            };
            const thisTriggerRef = (elem: null | HTMLElement) => {
              if (elem) {
                segmentsRef.current[index] = elem;
              } else {
                delete segmentsRef.current[index];
              }
            };

            return (
              <LegendItemTrigger
                key={index}
                {...handlers}
                ref={thisTriggerRef}
                onClick={
                  variant === "single-target" || variant === "dual-target"
                    ? createPrimaryClickHandler(item.id)
                    : createSecondaryClickHandler(item.id)
                }
                onSecondaryClick={
                  variant === "dual-target"
                    ? createSecondaryClickHandler(item.id)
                    : variant === "dual-target-inverse"
                      ? createPrimaryClickHandler(item.id)
                      : undefined
                }
                itemId={item.id}
                label={item.name}
                color={item.color}
                type={item.type}
                status={item.status}
                active={item.active}
              />
            );
          })}
        </div>

        {tooltipContent && tooltipItem && (
          <div onFocus={() => showTooltip(tooltipItem)}>
            <InternalChartTooltip
              key={tooltipItem}
              trackKey={tooltipItem}
              getTrack={() => segmentsRef.current[tooltipItemIndex]}
              onDismiss={() => {}}
              onMouseEnter={() => showTooltip(tooltipItem)}
              onMouseLeave={() => hideTooltip()}
              container={null}
              dismissButton={false}
              title={tooltipContent.header}
              footer={tooltipContent.footer}
              position="top"
            >
              {tooltipContent.body}
            </InternalChartTooltip>
          </div>
        )}
      </div>
    </SingleTabStopNavigationProvider>
  );
}

const LegendItemTrigger = forwardRef(
  (
    {
      itemId,
      label,
      color,
      type,
      status = "normal",
      active,
      onClick,
      onSecondaryClick,
      ariaExpanded,
      triggerRef,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onKeyDown,
    }: {
      itemId: string;
      label: string;
      color: string;
      type: ChartSeriesMarkerType;
      status?: ChartSeriesMarkerStatus;
      active: boolean;
      onClick: () => void;
      onSecondaryClick?: () => void;
      onMarkerClick?: () => void;
      ariaExpanded?: boolean;
      triggerRef?: Ref<HTMLElement>;
      onMouseEnter?: () => void;
      onMouseLeave?: () => void;
      onFocus?: () => void;
      onBlur?: () => void;
      onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    },
    ref: Ref<HTMLButtonElement>,
  ) => {
    const refObject = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, triggerRef, refObject);
    const { tabIndex } = useSingleTabStopNavigation(refObject);
    return (
      <span style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
        {onSecondaryClick ? (
          <span role="button" onClick={onSecondaryClick}>
            <ChartSeriesMarker color={active ? color : colorTextInteractiveDisabled} type={type} status={status} />
          </span>
        ) : null}

        <button
          data-itemid={itemId}
          aria-haspopup={typeof ariaExpanded === "boolean"}
          aria-expanded={ariaExpanded}
          className={clsx(
            testClasses.item,
            styles.marker,
            {
              [styles["marker--dimmed"]]: !active,
              [testClasses["hidden-item"]]: !active,
            },
            testClasses[`item-status-${status}`],
          )}
          ref={mergedRef}
          tabIndex={tabIndex}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          {onSecondaryClick ? null : (
            <ChartSeriesMarker color={active ? color : colorTextInteractiveDisabled} type={type} status={status} />
          )}
          <span>{label}</span>
        </button>
      </span>
    );
  },
);

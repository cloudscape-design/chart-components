// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, memo, Ref, useEffect, useRef, useState } from "react";
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
import { InternalButtonDropdown } from "@cloudscape-design/components/internal/do-not-use/button-dropdown";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { useMergeRefs } from "../../utils/use-merge-refs";
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
  actions?: readonly ChartLegendAction[];
}

export type ChartLegendAction = ChartLegendActionHide | ChartLegendActionOnly | ChartLegendActionDetail;

interface ChartLegendActionHide {
  type: "show-hide";
  textShow: string;
  textHide: string;
}

interface ChartLegendActionOnly {
  type: "only-all";
  textOnly: string;
  textAll: string;
}

interface ChartLegendActionDetail {
  type: "detail";
  text: string;
  render: () => {
    header: React.ReactNode;
    body: React.ReactNode;
    footer?: React.ReactNode;
  };
}

export interface ChartLegendProps {
  items: readonly ChartLegendItem[];
  align?: "start" | "center";
  legendTitle?: string;
  ariaLabel?: string;
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemToggleHide?: (itemId: string) => void;
  onItemToggleOnly?: (itemId: string) => void;
}

export default memo(ChartLegend) as typeof ChartLegend;

function ChartLegend({
  items,
  align = "start",
  legendTitle,
  ariaLabel,
  onItemToggleHide,
  onItemToggleOnly,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Record<number, HTMLElement>>([]);

  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [menuIndex, setMenuIndex] = useState<null | number>(null);
  const detailContent = (() => {
    if (menuIndex === null || !items[menuIndex]) {
      return null;
    }
    const detailAction = items[menuIndex].actions?.find((action) => action.type === "detail");
    if (!detailAction) {
      return null;
    }
    return (detailAction as ChartLegendActionDetail).render();
  })();

  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);

  function onFocus(index: number) {
    setFocusedIndex(index);
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
        onInlineStart: () => focusElement(circleIndex(focusedIndex - 1, range)),
        onInlineEnd: () => focusElement(circleIndex(focusedIndex + 1, range)),
        onBlockStart: () => focusElement(circleIndex(focusedIndex - 1, range)),
        onBlockEnd: () => focusElement(circleIndex(focusedIndex + 1, range)),
        onHome: () => focusElement(0),
        onEnd: () => focusElement(items.length - 1),
        onEscape: () => onItemHighlightExit?.(),
      });
    }
  }

  function getNextFocusTarget(): null | HTMLElement {
    if (containerRef.current) {
      const buttons: HTMLButtonElement[] = Array.from(containerRef.current.querySelectorAll(`.${styles.marker}`));
      return buttons[focusedIndex] ?? null;
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
          {items.map((item, index) => {
            const handlers = {
              onMouseEnter: () => onItemHighlightEnter?.(item.id),
              onMouseLeave: () => onItemHighlightExit?.(),
              onFocus: () => {
                onFocus(index);
                onItemHighlightEnter?.(item.id);
              },
              onBlur: () => {
                onBlur();
                onItemHighlightExit?.();
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

            if (item.actions) {
              return (
                <InternalButtonDropdown
                  key={index}
                  items={item.actions.map((action) => {
                    const otherActive = items.filter((i) => i.id !== item.id).some((i) => i.active);
                    switch (action.type) {
                      case "show-hide":
                        return { id: action.type, text: item.active ? action.textHide : action.textShow };
                      case "only-all":
                        return { id: action.type, text: otherActive ? action.textOnly : action.textAll };
                      case "detail":
                        return { id: action.type, text: action.text };
                      default:
                        throw new Error("Invariant violation: unsupported legend item action requested.");
                    }
                  })}
                  onItemClick={({ detail }) => {
                    switch (detail.id) {
                      case "show-hide":
                        return onItemToggleHide?.(item.id);
                      case "only-all":
                        return onItemToggleOnly?.(item.id);
                      case "detail":
                        return setMenuIndex(index);
                      default:
                        throw new Error("Invariant violation: unsupported legend item action requested.");
                    }
                  }}
                  customTriggerBuilder={({ onClick, triggerRef, ariaExpanded }) => {
                    return (
                      <LegendItemTrigger
                        {...handlers}
                        ref={thisTriggerRef}
                        triggerRef={triggerRef}
                        onClick={onClick}
                        itemId={item.id}
                        label={item.name}
                        color={item.color}
                        type={item.type}
                        status={item.status}
                        active={item.active}
                        ariaExpanded={ariaExpanded}
                      />
                    );
                  }}
                />
              );
            }

            return (
              <LegendItemTrigger
                key={index}
                {...handlers}
                ref={thisTriggerRef}
                onClick={() => onItemToggleHide?.(item.id)}
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

        {menuIndex !== null && detailContent && (
          <InternalChartTooltip
            getTrack={() => segmentsRef.current[menuIndex]}
            onDismiss={() => {
              setMenuIndex(null);
              focusElement(focusedIndex);
            }}
            container={null}
            dismissButton={true}
            title={detailContent.header}
            footer={detailContent.footer}
            position="bottom"
          >
            {detailContent.body}
          </InternalChartTooltip>
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
        <ChartSeriesMarker color={active ? color : colorTextInteractiveDisabled} type={type} status={status} />
        <span>{label}</span>
      </button>
    );
  },
);

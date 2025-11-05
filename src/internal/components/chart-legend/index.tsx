// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, Ref, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import {
  circleIndex,
  handleKey,
  KeyCode,
  SingleTabStopNavigationAPI,
  SingleTabStopNavigationProvider,
  useMergeRefs,
  useSingleTabStopNavigation,
} from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import { DebouncedCall } from "../../utils/utils";
import { GetLegendTooltipContentProps, LegendItem, LegendTooltipContent } from "../interfaces";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

const TOOLTIP_BLUR_DELAY = 50;
const HIGHLIGHT_LOST_DELAY = 50;
const SCROLL_DELAY = 100;
const SHOULD_STACK_SIZE = 400;

export interface ChartLegendProps {
  someHighlighted: boolean;
  items: readonly LegendItem[];
  alignment: "horizontal" | "vertical";
  type: "single" | "primary" | "secondary";
  legendTitle?: string;
  ariaLabel?: string;
  actions?: React.ReactNode;
  onToggleItem: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onItemHighlightEnter: (item: LegendItem) => void;
  onItemHighlightExit: () => void;
  getTooltipContent: (props: GetLegendTooltipContentProps) => null | LegendTooltipContent;
}

export const ChartLegend = ({
  items,
  type,
  alignment,
  someHighlighted,
  legendTitle,
  ariaLabel,
  actions,
  onToggleItem,
  onSelectItem,
  onItemHighlightEnter,
  onItemHighlightExit,
  getTooltipContent,
}: ChartLegendProps) => {
  const [shouldAutoStack, containerQueryRef] = useContainerQuery((rect) => rect.borderBoxWidth <= SHOULD_STACK_SIZE);
  const containerRef = containerQueryRef as React.RefObject<HTMLDivElement>;
  const elementsByIndexRef = useRef<Record<number, HTMLElement>>([]);
  const elementsByIdRef = useRef<Record<string, HTMLElement>>({});
  const tooltipRef = useRef<HTMLElement>(null);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const scrollIntoViewControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tooltipItemId, setTooltipItemId] = useState<string | null>(null);

  const { showTooltip, hideTooltip } = useMemo(() => {
    const control = new DebouncedCall();
    return {
      showTooltip(itemId: string) {
        control.call(() => setTooltipItemId(itemId));
      },
      hideTooltip(lock = false) {
        control.call(() => setTooltipItemId(null), TOOLTIP_BLUR_DELAY);
        if (lock) {
          control.lock(TOOLTIP_BLUR_DELAY);
        }
      },
    };
  }, []);

  useEffect(() => {
    if (!tooltipItemId) {
      return;
    }
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === KeyCode.escape) {
        hideTooltip(true);
        elementsByIdRef.current[tooltipItemId]?.focus();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown, true);
    };
  }, [items, tooltipItemId, hideTooltip]);
  const isMouseInContainer = useRef<boolean>(false);

  // Scrolling to the highlighted legend item.
  useEffect(() => {
    const highlightedIndex = items.findIndex((item) => item.highlighted);
    if (highlightedIndex === -1) {
      return;
    }
    scrollIntoViewControl.call(() => {
      if (isMouseInContainer.current) {
        return;
      }
      const container = containerRef.current;
      const element = elementsByIndexRef.current?.[highlightedIndex];
      if (!container || !element) {
        return;
      }
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const isVisible = elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom;
      if (!isVisible) {
        const elementCenter = elementRect.top + elementRect.height / 2;
        const containerCenter = containerRect.top + containerRect.height / 2;
        const top = container.scrollTop + (elementCenter - containerCenter);
        container.scrollTo({ top, behavior: "smooth" });
      }
    }, SCROLL_DELAY);
  }, [containerRef, items, scrollIntoViewControl]);

  const showHighlight = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.visible) {
      highlightControl.cancelPrevious();
      onItemHighlightEnter(item);
    }
  };
  const clearHighlight = () => {
    highlightControl.call(onItemHighlightExit, HIGHLIGHT_LOST_DELAY);
  };

  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);

  function onFocus(index: number, itemId: string) {
    setSelectedIndex(index);
    navigationAPI.current!.updateFocusTarget();
    showHighlight(itemId);
    showTooltip(itemId);
  }

  function onBlur(event: React.FocusEvent) {
    navigationAPI.current!.updateFocusTarget();

    // Hide tooltip and clear highlight unless focus moves inside tooltip;
    if (tooltipRef.current && event.relatedTarget && !tooltipRef.current.contains(event.relatedTarget)) {
      clearHighlight();
      hideTooltip();
    }
  }

  function focusElement(index: number) {
    elementsByIndexRef.current[index]?.focus();
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
        onEscape: () => onItemHighlightExit(),
      });
    }
  }

  function getNextFocusTarget(): null | HTMLElement {
    if (containerRef.current) {
      const buttons: HTMLButtonElement[] = Array.from(containerRef.current.querySelectorAll(`.${styles.item}`));
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
    navigationAPI.current!.updateFocusTarget();
  });

  const isStacked = alignment === "vertical" || shouldAutoStack;
  const isHorizontalSecondaryAndNotStacked = alignment === "horizontal" && type === "secondary" && !shouldAutoStack;

  const tooltipTrack = useRef<null | HTMLElement>(null);
  const tooltipTarget = items.find((item) => item.id === tooltipItemId) ?? null;
  tooltipTrack.current = tooltipItemId ? elementsByIdRef.current[tooltipItemId] : null;
  const tooltipContent = tooltipTarget && getTooltipContent({ legendItem: tooltipTarget });
  const tooltipPosition = isStacked ? "left" : "bottom";

  return (
    <SingleTabStopNavigationProvider
      ref={navigationAPI}
      navigationActive={true}
      getNextFocusTarget={() => getNextFocusTarget()}
      onUnregisterActive={(element: HTMLElement) => onUnregisterActive(element, navigationAPI)}
    >
      <div
        role="toolbar"
        aria-label={legendTitle || ariaLabel}
        className={styles.root}
        onMouseEnter={() => (isMouseInContainer.current = true)}
        onMouseLeave={() => (isMouseInContainer.current = false)}
      >
        {legendTitle && (
          <Box
            fontWeight="bold"
            className={testClasses.title}
            textAlign={isHorizontalSecondaryAndNotStacked ? "right" : "left"}
          >
            {legendTitle}
          </Box>
        )}
        <div
          // The list element is not focusable. However, the focus lands on it regardless, when testing in Firefox.
          // Setting the tab index to -1 does fix the problem.
          tabIndex={-1}
          ref={containerRef}
          className={clsx(styles.list, {
            [styles["list-side"]]: isStacked,
            [styles["list-bottom"]]: !isStacked,
            [styles["list-bottom-secondary"]]: isHorizontalSecondaryAndNotStacked,
          })}
        >
          {actions && (
            <div
              className={clsx(testClasses.actions, styles.actions, {
                [styles["actions-side"]]: isStacked,
                [styles["actions-bottom"]]: !isStacked,
              })}
            >
              {actions}
              <div
                className={clsx({
                  [styles["actions-divider-side"]]: isStacked,
                  [styles["actions-divider-bottom"]]: !isStacked,
                })}
              />
            </div>
          )}
          {items.map((item, index) => {
            const handlers = {
              onMouseEnter: () => {
                showHighlight(item.id);
                showTooltip(item.id);
              },
              onMouseLeave: () => {
                clearHighlight();
                hideTooltip();
              },
              onFocus: () => {
                onFocus(index, item.id);
              },
              onBlur: (event: React.FocusEvent) => {
                onBlur(event);
              },
              onKeyDown,
            };
            const thisTriggerRef = (elem: null | HTMLElement) => {
              if (elem) {
                elementsByIndexRef.current[index] = elem;
                elementsByIdRef.current[item.id] = elem;
              } else {
                delete elementsByIndexRef.current[index];
                delete elementsByIdRef.current[item.id];
              }
            };
            return (
              <LegendItemTrigger
                key={index}
                {...handlers}
                ref={thisTriggerRef}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey) {
                    onToggleItem(item.id);
                  } else {
                    onSelectItem(item.id);
                  }
                }}
                isHighlighted={item.highlighted}
                someHighlighted={someHighlighted}
                itemId={item.id}
                label={item.name}
                visible={item.visible}
                marker={item.marker}
              />
            );
          })}
        </div>
        {tooltipContent && (
          <InternalChartTooltip
            trackRef={tooltipTrack}
            trackKey={tooltipTarget.id}
            container={null}
            dismissButton={false}
            onDismiss={() => {}}
            position={tooltipPosition}
            title={tooltipContent.header}
            onMouseEnter={() => showTooltip(tooltipTarget.id)}
            onMouseLeave={() => hideTooltip()}
            onBlur={() => hideTooltip()}
            footer={
              tooltipContent.footer && (
                <>
                  <hr aria-hidden={true} />
                  {tooltipContent.footer}
                </>
              )
            }
          >
            {tooltipContent.body}
          </InternalChartTooltip>
        )}
      </div>
    </SingleTabStopNavigationProvider>
  );
};

const LegendItemTrigger = forwardRef(
  (
    {
      isHighlighted,
      someHighlighted,
      itemId,
      label,
      marker,
      visible,
      onClick,
      triggerRef,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onKeyDown,
    }: {
      isHighlighted?: boolean;
      someHighlighted?: boolean;
      itemId: string;
      label: string;
      marker?: React.ReactNode;
      visible: boolean;
      onClick: (event: React.MouseEvent) => void;
      onMarkerClick?: () => void;
      triggerRef?: Ref<HTMLElement>;
      onMouseEnter?: () => void;
      onMouseLeave?: () => void;
      onFocus?: () => void;
      onBlur?: (event: React.FocusEvent) => void;
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
        aria-pressed={visible}
        aria-current={isHighlighted}
        className={clsx(testClasses.item, styles.item, {
          [styles["item--inactive"]]: !visible,
          [testClasses["hidden-item"]]: !visible,
          [styles["item--dimmed"]]: someHighlighted && !isHighlighted,
          [testClasses["dimmed-item"]]: someHighlighted && !isHighlighted,
        })}
        ref={mergedRef}
        tabIndex={tabIndex}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      >
        {marker}
        <span className={styles["item-label"]}>{label}</span>
      </button>
    );
  },
);

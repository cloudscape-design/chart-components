// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, Ref, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

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

export interface ChartLegendProps {
  items: readonly LegendItem[];
  legendTitle?: string;
  ariaLabel?: string;
  actions?: React.ReactNode;
  bottomMaxHeight: number;
  type: "single" | "dual";
  position: "bottom" | "side";
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
  getTooltipContent: (props: GetLegendTooltipContentProps) => null | LegendTooltipContent;
}

export const ChartLegend = ({
  type,
  items,
  legendTitle,
  ariaLabel,
  actions,
  position,
  bottomMaxHeight,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
  getTooltipContent,
}: ChartLegendProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const scrollIntoViewControl = useMemo(() => new DebouncedCall(), []);
  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);
  useEffect(() => {
    navigationAPI.current!.updateFocusTarget();
  });

  const elementsByIdRef = useRef<Record<string, HTMLElement>>({});
  const defaultAxisItems = useMemo(() => {
    if (type === "single") {
      return items;
    }
    return items.filter((item) => !item.oppositeAxis);
  }, [type, items]);
  const oppositeAxisItems = useMemo(() => {
    if (type === "single") {
      return [];
    }
    return items.filter((item) => item.oppositeAxis);
  }, [type, items]);

  const tooltipRef = useRef<HTMLElement>(null);
  const tooltipTrack = useRef<null | HTMLElement>(null);
  const [tooltipItemId, setTooltipItemId] = useState<string | null>(null);
  const tooltipPosition = position === "bottom" ? "bottom" : "left";
  const tooltipTarget = items.find((item) => item.id === tooltipItemId) ?? null;
  tooltipTrack.current = tooltipItemId ? elementsByIdRef.current[tooltipItemId] : null;
  const tooltipContent = tooltipTarget && getTooltipContent({ legendItem: tooltipTarget });

  const { onShowTooltip, onHideTooltip } = useMemo(() => {
    const control = new DebouncedCall();
    return {
      onShowTooltip(itemId: string) {
        control.call(() => setTooltipItemId(itemId));
      },
      onHideTooltip(lock = false) {
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
        onHideTooltip(true);
        elementsByIdRef.current[tooltipItemId]?.focus();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown, true);
    };
  }, [items, tooltipItemId, onHideTooltip]);
  const isMouseInContainer = useRef<boolean>(false);

  // Scrolling to the highlighted legend item.
  useEffect(() => {
    const highlightedId = items.find((item) => item.highlighted)?.id;
    if (highlightedId === undefined) {
      return;
    }
    scrollIntoViewControl.call(() => {
      if (isMouseInContainer.current) {
        return;
      }
      const container = containerRef.current;
      const element = elementsByIdRef.current?.[highlightedId];
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
  }, [items, scrollIntoViewControl]);

  function getNextFocusTarget(): null | HTMLElement {
    if (containerRef.current) {
      const highlightedIndex = items.findIndex((item) => item.highlighted);
      const buttons: HTMLButtonElement[] = Array.from(containerRef.current.querySelectorAll(`.${styles.item}`));
      return buttons[highlightedIndex] ?? null;
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

  const onShowHighlight = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.visible) {
      highlightControl.cancelPrevious();
      onItemHighlightEnter(itemId);
    }
  };

  const onToggleItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.includes(itemId)) {
      onItemVisibilityChange(visibleItems.filter((visibleItemId) => visibleItemId !== itemId));
    } else {
      onItemVisibilityChange([...visibleItems, itemId]);
    }
    // Needed for touch devices.
    onItemHighlightExit();
  };

  const onSelectItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      onItemVisibilityChange(items.map((i) => i.id));
    } else {
      onItemVisibilityChange([itemId]);
    }
    // Needed for touch devices.
    onItemHighlightExit();
  };

  const legendItemsProps = {
    elementsByIdRef,
    highlightControl,
    navigationAPI,
    tooltipRef,
    someHighlighted: items.some((item) => item.highlighted),
    onHideTooltip,
    onItemHighlightExit,
    onSelectItem,
    onShowHighlight,
    onShowTooltip,
    onToggleItem,
  };

  return (
    <SingleTabStopNavigationProvider
      ref={navigationAPI}
      navigationActive={true}
      getNextFocusTarget={() => getNextFocusTarget()}
      onUnregisterActive={(element: HTMLElement) => onUnregisterActive(element, navigationAPI)}
    >
      <div
        role="toolbar"
        ref={containerRef}
        aria-label={legendTitle || ariaLabel}
        onMouseEnter={() => (isMouseInContainer.current = true)}
        onMouseLeave={() => (isMouseInContainer.current = false)}
        className={clsx(testClasses.root, styles.root, {
          [styles["root-side"]]: position === "side",
          [styles["root-side-with-title"]]: position === "side" && legendTitle,
        })}
      >
        {legendTitle && (
          <Box fontWeight="bold" className={testClasses.title}>
            {legendTitle}
          </Box>
        )}

        <div
          // The list element is not focusable. However, the focus lands on it regardless, when testing in Firefox.
          // Setting the tab index to -1 does fix the problem.
          tabIndex={-1}
          className={clsx(styles.list, styles["list-side"])}
        >
          {actions && (
            <div
              className={clsx(testClasses.actions, styles.actions, {
                [styles["actions-bottom"]]: position === "bottom",
                [styles["actions-side"]]: position === "side",
              })}
            >
              {actions}
              <div
                className={clsx({
                  [styles["legend-divider-bottom"]]: position === "bottom",
                  [styles["legend-divider-side"]]: position === "side",
                })}
              />
            </div>
          )}
          {position === "bottom" ? (
            oppositeAxisItems.length === 0 ? (
              <LegendItems
                items={defaultAxisItems}
                position={"bottom"}
                ariaLabel="Chart legend"
                {...legendItemsProps}
              />
            ) : (
              <div className={clsx(styles["legend-bottom-dual-axis"])}>
                <LegendItems
                  items={defaultAxisItems}
                  position={"bottom-default"}
                  ariaLabel="Primary axis legend"
                  {...legendItemsProps}
                />
                <LegendItems
                  items={oppositeAxisItems}
                  position={"bottom-opposite"}
                  ariaLabel="Secondary axis legend"
                  {...legendItemsProps}
                />
              </div>
            )
          ) : (
            <div className={clsx(styles["legend-side"])}>
              <LegendItems
                position={"side"}
                items={defaultAxisItems}
                ariaLabel="Primary axis legend"
                {...legendItemsProps}
              />
              {oppositeAxisItems.length > 0 && (
                <>
                  <div className={clsx(styles["legend-divider-side"])} />
                  <LegendItems
                    position={"side"}
                    items={oppositeAxisItems}
                    ariaLabel="Secondary axis legend"
                    {...legendItemsProps}
                  />
                </>
              )}
            </div>
          )}
        </div>
        {tooltipContent && (
          <InternalChartTooltip
            container={null}
            dismissButton={false}
            onDismiss={() => { }}
            onBlur={() => onHideTooltip()}
            onMouseLeave={() => onHideTooltip()}
            onMouseEnter={() => onShowTooltip(tooltipTarget.id)}
            position={tooltipPosition}
            title={tooltipContent.header}
            trackKey={tooltipTarget.id}
            trackRef={tooltipTrack}
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

interface LegendItemsProps {
  ariaLabel: string;
  someHighlighted: boolean;
  highlightControl: DebouncedCall;
  items: readonly LegendItem[];
  position: "bottom" | "bottom-default" | "bottom-opposite" | "side";
  tooltipRef: React.RefObject<HTMLElement>;
  navigationAPI: React.RefObject<SingleTabStopNavigationAPI>;
  elementsByIdRef: React.MutableRefObject<Record<string, HTMLElement>>;
  onItemHighlightExit: () => void;
  onHideTooltip: (lock?: boolean) => void;
  onSelectItem: (itemId: string) => void;
  onToggleItem: (itemId: string) => void;
  onShowTooltip: (itemId: string) => void;
  onShowHighlight: (itemId: string) => void;
}

const LegendItems = ({
  items,
  position,
  ariaLabel,
  tooltipRef,
  navigationAPI,
  someHighlighted,
  elementsByIdRef,
  highlightControl,
  onToggleItem,
  onSelectItem,
  onShowTooltip,
  onHideTooltip,
  onShowHighlight,
  onItemHighlightExit,
}: LegendItemsProps) => {
  const elementsByIndexRef = useRef<Record<number, HTMLElement>>({});
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const clearHighlight = () => {
    highlightControl.call(onItemHighlightExit, HIGHLIGHT_LOST_DELAY);
  };

  function onFocus(index: number, itemId: string) {
    setSelectedIndex(index);
    navigationAPI.current!.updateFocusTarget();
    onShowHighlight(itemId);
    onShowTooltip(itemId);
  }

  function onBlur(event: React.FocusEvent) {
    navigationAPI.current!.updateFocusTarget();
    // Hide tooltip and clear highlight unless focus moves inside tooltip;
    if (tooltipRef.current && event.relatedTarget && !tooltipRef.current.contains(event.relatedTarget)) {
      clearHighlight();
      onHideTooltip();
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

  const renderedItems = items.map((item, index) => {
    const handlers = {
      onKeyDown,
      onMouseEnter: () => {
        onShowHighlight(item.id);
        onShowTooltip(item.id);
      },
      onMouseLeave: () => {
        clearHighlight();
        onHideTooltip();
      },
      onFocus: () => {
        onFocus(index, item.id);
      },
      onBlur: (event: React.FocusEvent) => {
        onBlur(event);
      },
      onClick: (event: React.MouseEvent<Element, MouseEvent>) => {
        if (event.metaKey || event.ctrlKey) {
          onToggleItem(item.id);
        } else {
          onSelectItem(item.id);
        }
      },
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
        itemId={item.id}
        label={item.name}
        marker={item.marker}
        ref={thisTriggerRef}
        visible={item.visible}
        isHighlighted={item.highlighted}
        someHighlighted={someHighlighted}
      />
    );
  });

  return (
    <div tabIndex={0} role="group" aria-label={ariaLabel} className={clsx(styles[`legend-${position}`])}>
      {renderedItems}
    </div>
  );
};

interface LegendItemTriggerProps {
  isHighlighted?: boolean;
  itemId: string;
  label: string;
  marker?: React.ReactNode;
  someHighlighted?: boolean;
  triggerRef?: Ref<HTMLElement>;
  visible: boolean;
  onBlur?: (event: React.FocusEvent) => void;
  onClick: (event: React.MouseEvent) => void;
  onFocus?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onMarkerClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

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
    }: LegendItemTriggerProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    const refObject = useRef<HTMLDivElement>(null);
    const mergedRef = useMergeRefs(ref, triggerRef, refObject);
    const { tabIndex } = useSingleTabStopNavigation(refObject);
    return (
      <button
        aria-current={isHighlighted}
        aria-pressed={visible}
        data-itemid={itemId}
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ref={mergedRef}
        tabIndex={tabIndex}
        className={clsx(testClasses.item, styles.item, {
          [styles["item--inactive"]]: !visible,
          [testClasses["hidden-item"]]: !visible,
          [styles["item--dimmed"]]: someHighlighted && !isHighlighted,
          [testClasses["dimmed-item"]]: someHighlighted && !isHighlighted,
        })}
      >
        {marker}
        <span>{label}</span>
      </button>
    );
  },
);

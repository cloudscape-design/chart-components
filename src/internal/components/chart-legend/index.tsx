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

import { CoreLegendItem } from "../../../core/interfaces";
import { DebouncedCall } from "../../utils/utils";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

const HIGHLIGHT_LOST_DELAY = 50;
const SCROLL_DELAY = 100;

export interface ChartLegendProps {
  items: readonly CoreLegendItem[];
  legendTitle?: string;
  ariaLabel?: string;
  actions?: React.ReactNode;
  position: "bottom" | "side";
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
}

export const ChartLegend = ({
  items,
  legendTitle,
  ariaLabel,
  actions,
  position,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<Record<number, HTMLElement>>([]);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const scrollIntoViewControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMouseInContainer, setIsMouseInContainer] = useState<boolean>(false);

  // Scrolling to the highlighted legend item.
  useEffect(() => {
    scrollIntoViewControl.cancelPrevious();
    if (isMouseInContainer) {
      return;
    }
    const highlightedIndex = items.findIndex((item) => item.highlighted);
    if (highlightedIndex === -1) {
      return;
    }
    scrollIntoViewControl.call(() => {
      const container = containerRef.current;
      const element = elementsRef.current?.[highlightedIndex];
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
  }, [items, scrollIntoViewControl, isMouseInContainer]);

  const showHighlight = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.visible) {
      highlightControl.cancelPrevious();
      onItemHighlightEnter(itemId);
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
  }

  function onBlur() {
    navigationAPI.current!.updateFocusTarget();
  }

  function focusElement(index: number) {
    elementsRef.current[index]?.focus();
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

  const toggleItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.includes(itemId)) {
      onItemVisibilityChange(visibleItems.filter((visibleItemId) => visibleItemId !== itemId));
    } else {
      onItemVisibilityChange([...visibleItems, itemId]);
    }
    // Needed for touch devices.
    onItemHighlightExit();
  };

  const selectItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      onItemVisibilityChange(items.map((i) => i.id));
    } else {
      onItemVisibilityChange([itemId]);
    }
    // Needed for touch devices.
    onItemHighlightExit();
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
        className={clsx(testClasses.root, styles.root, {
          [styles["root-side"]]: position === "side",
        })}
        onMouseEnter={() => setIsMouseInContainer(true)}
        onMouseLeave={() => setIsMouseInContainer(false)}
      >
        {legendTitle && (
          <Box fontWeight="bold" className={testClasses.title}>
            {legendTitle}
          </Box>
        )}

        <div
          className={clsx(styles.list, {
            [styles["list-bottom"]]: position === "bottom",
            [styles["list-side"]]: position === "side",
          })}
        >
          {actions && (
            <>
              <div
                className={clsx(testClasses.actions, styles.actions, {
                  [styles["actions-bottom"]]: position === "bottom",
                  [styles["actions-side"]]: position === "side",
                })}
              >
                {actions}
                <div
                  className={clsx(styles["actions-divider"], {
                    [styles["actions-divider-bottom"]]: position === "bottom",
                    [styles["actions-divider-side"]]: position === "side",
                  })}
                />
              </div>
            </>
          )}
          <div
            className={clsx({
              [styles["legend-bottom"]]: position === "bottom",
              [styles["legend-side"]]: position === "side",
            })}
          >
            {items.map((item, index) => {
              const handlers = {
                onMouseEnter: () => {
                  showHighlight(item.id);
                },
                onMouseLeave: () => {
                  clearHighlight();
                },
                onFocus: () => {
                  onFocus(index, item.id);
                },
                onBlur: () => {
                  onBlur();
                  clearHighlight();
                },
                onKeyDown,
              };
              const thisTriggerRef = (elem: null | HTMLElement) => {
                if (elem) {
                  elementsRef.current[index] = elem;
                } else {
                  delete elementsRef.current[index];
                }
              };

              return (
                <LegendItemTrigger
                  key={index}
                  {...handlers}
                  ref={thisTriggerRef}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey) {
                      toggleItem(item.id);
                    } else {
                      selectItem(item.id);
                    }
                  }}
                  isHighlighted={item.highlighted}
                  someHighlighted={items.some((item) => item.highlighted)}
                  itemId={item.id}
                  label={item.name}
                  visible={item.visible}
                  marker={item.marker}
                />
              );
            })}
          </div>
        </div>
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
        <span>{label}</span>
      </button>
    );
  },
);

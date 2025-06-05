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
import { colorBorderDividerDefault } from "@cloudscape-design/design-tokens";

import { ChartLegendItem } from "../../../core/interfaces-base";
import { DebouncedCall } from "../../utils/utils";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

export interface ChartLegendOptions {
  items: readonly ChartLegendItem[];
  legendTitle?: string;
  ariaLabel?: string;
  actions?: React.ReactNode;
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
}

export const ChartLegend = ({
  items,
  legendTitle,
  ariaLabel,
  actions,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Record<number, HTMLElement>>([]);
  const focusedRef = useRef(false);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const showHighlight = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.visible) {
      highlightControl.cancelPrevious();
      onItemHighlightEnter(itemId);
    }
  };
  const clearHighlight = () => {
    highlightControl.call(onItemHighlightExit, 50);
  };

  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);

  function onFocus(index: number, itemId: string) {
    focusedRef.current = true;
    setSelectedIndex(index);
    navigationAPI.current!.updateFocusTarget();
    showHighlight(itemId);
  }

  function onBlur() {
    focusedRef.current = false;
    navigationAPI.current!.updateFocusTarget();
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
        onEscape: () => onItemHighlightExit(),
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
        className={clsx(testClasses.root, styles.root)}
      >
        {legendTitle && (
          <Box fontWeight="bold" className={testClasses.title}>
            {legendTitle}
          </Box>
        )}

        <div className={styles.list}>
          {actions && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }} className={testClasses.actions}>
              {actions}

              <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
            </div>
          )}

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
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey) {
                    selectItem(item.id);
                  } else {
                    toggleItem(item.id);
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
        className={clsx(testClasses.item, styles.marker, {
          [styles["marker--inactive"]]: !visible,
          [testClasses["hidden-item"]]: !visible,
          [styles["marker--dimmed"]]: someHighlighted && !isHighlighted,
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

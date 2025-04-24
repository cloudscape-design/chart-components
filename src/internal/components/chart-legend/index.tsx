// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, Ref, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
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
import { colorBorderDividerDefault } from "@cloudscape-design/design-tokens";

import { ChartLegendItem, LegendActionsRenderProps } from "../../../core/interfaces-base";
import { useMergeRefs } from "../../utils/use-merge-refs";
import { DebouncedCall } from "../../utils/utils";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

export interface ChartLegendProps {
  items: readonly ChartLegendItem[];
  legendTitle?: string;
  ariaLabel?: string;
  actions?: {
    render?(props: LegendActionsRenderProps): React.ReactNode;
  };
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemVisibilityChange: (
    hiddenItems: string[],
    context: { method: "legend-toggle" | "legend-select" | "filter" },
  ) => void;
}

export interface InfoTooltipProps {
  render: (
    itemId: string,
    { context }: { context: "legend" | "filter" },
  ) => {
    header: React.ReactNode;
    body: React.ReactNode;
    footer?: React.ReactNode;
  };
}

export interface ChartLegendRef {
  highlightItems: (ids: string[]) => void;
  clearHighlight: () => void;
}

// TODO: replace all indices with IDs
export const ChartLegend = forwardRef(
  (
    {
      items,
      legendTitle,
      ariaLabel,
      actions,
      onItemVisibilityChange,
      onItemHighlightEnter,
      onItemHighlightExit,
    }: ChartLegendProps,
    ref: React.Ref<ChartLegendRef>,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const segmentsRef = useRef<Record<number, HTMLElement>>([]);

    const highlightControl = useMemo(() => new DebouncedCall(), []);
    const noTooltipRef = useRef(false);
    const noTooltipControl = useMemo(() => new DebouncedCall(), []);
    const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const showHighlight = (itemId: string) => {
      setHighlightedItems([itemId]);
      highlightControl.cancelPrevious();
      onItemHighlightEnter?.(itemId);
    };
    const clearHighlight = () => {
      setHighlightedItems([]);
      highlightControl.call(() => onItemHighlightExit?.(), 50);
    };

    useImperativeHandle(ref, () => ({
      highlightItems: (ids: string[]) => {
        setHighlightedItems(ids);
      },
      clearHighlight: () => setHighlightedItems([]),
    }));

    const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);

    function onFocus(index: number) {
      setSelectedIndex(index);
      navigationAPI.current?.updateFocusTarget();
    }

    function onBlur() {
      navigationAPI.current?.updateFocusTarget();
    }

    function focusElement(index: number, noTooltip = false) {
      if (noTooltip) {
        noTooltipRef.current = true;
        noTooltipControl.call(() => {
          noTooltipRef.current = false;
        }, 25);
      }
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

    const toggleItem = (itemId: string) => {
      const hiddenItems = items.filter((i) => !i.visible).map((i) => i.id);
      if (hiddenItems.includes(itemId)) {
        onItemVisibilityChange(
          hiddenItems.filter((id) => id !== itemId),
          { method: "legend-toggle" },
        );
      } else {
        onItemVisibilityChange([...hiddenItems, itemId], { method: "legend-toggle" });
      }
    };

    const selectItem = (itemId: string) => {
      const visibleItems = items.filter((i) => i.visible).map((i) => i.id);
      if (visibleItems.length === 1 && visibleItems[0] === itemId) {
        onItemVisibilityChange([], { method: "legend-select" });
      } else {
        onItemVisibilityChange(
          items.map((i) => i.id).filter((id) => id !== itemId),
          { method: "legend-select" },
        );
      }
    };

    const renderedFilter = actions?.render ? actions?.render({ legendItems: items }) : null;

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
            {renderedFilter && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {renderedFilter}

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
                  onFocus(index);
                  showHighlight(item.id);
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
                  isHighlighted={highlightedItems.includes(item.id)}
                  someHighlighted={highlightedItems.length > 0}
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
  },
);

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
      ariaExpanded,
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
            [styles["marker--inactive"]]: !visible,
            [styles["marker--dimmed"]]: someHighlighted && !isHighlighted,
            [testClasses["hidden-item"]]: !visible,
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
        {marker}
        <span>{label}</span>
      </button>
    );
  },
);

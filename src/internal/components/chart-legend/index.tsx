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
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import TextFilter from "@cloudscape-design/components/text-filter";
import ToggleButton from "@cloudscape-design/components/toggle-button";
import {
  colorBackgroundLayoutMain,
  colorBorderDividerDefault,
  colorTextInteractiveDisabled,
} from "@cloudscape-design/design-tokens";

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
  filter?: boolean;
  placement?: "block-end" | "inline-end";
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
}

export default memo(ChartLegend) as typeof ChartLegend;

function ChartLegend({
  items,
  align = "start",
  legendTitle,
  ariaLabel,
  tooltip,
  filter: showFilter = false,
  placement = "block-end",
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Record<number, HTMLElement>>([]);

  const [tooltipPinned, setTooltipPinned] = useState(false);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const tooltipControl = useMemo(() => new DebouncedCall(), []);
  const noTooltipRef = useRef(false);
  const noTooltipControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tooltipItem, setTooltipItem] = useState<null | string>(null);
  const tooltipItemIndex = items.findIndex((item) => item.id === tooltipItem);
  const tooltipContent = tooltipItem ? tooltip?.render(tooltipItem) : null;
  const showTooltip = (itemId: string) => {
    if (noTooltipRef.current) {
      return;
    }
    tooltipControl.cancelPrevious();
    setTooltipItem(itemId);
    showHighlight(itemId);
  };
  const hideTooltip = () => {
    tooltipControl.call(() => setTooltipItem(null), 50);
    onItemHighlightExit?.();
  };
  const showHighlight = (itemId: string) => {
    highlightControl.cancelPrevious();
    onItemHighlightEnter?.(itemId);
  };
  const clearHighlight = () => {
    highlightControl.call(() => onItemHighlightExit?.(), 50);
  };

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
    const hiddenItems = items.filter((i) => !i.active).map((i) => i.id);
    if (hiddenItems.includes(itemId)) {
      onItemVisibilityChange(hiddenItems.filter((id) => id !== itemId));
    } else {
      onItemVisibilityChange([...hiddenItems, itemId]);
    }
  };

  const selectItem = (itemId: string) => {
    const visibleItems = items.filter((i) => i.active).map((i) => i.id);
    if (visibleItems.length === 1 && visibleItems[0] === itemId) {
      onItemVisibilityChange([]);
    } else {
      onItemVisibilityChange(items.map((i) => i.id).filter((id) => id !== itemId));
    }
  };

  const [filteringText, setFilteringText] = useState("");
  const filteredItems = items.filter((i) => i.name.toLowerCase().includes(filteringText.toLowerCase()));

  const [infoPressed, setInfoPressed] = useState(false);

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

        {showFilter && placement === "inline-end" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              position: "sticky",
              top: 0,
              background: colorBackgroundLayoutMain,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Checkbox
                checked={filteredItems.every((i) => i.active)}
                indeterminate={!filteredItems.every((i) => i.active) && filteredItems.some((i) => i.active)}
                onChange={() => {
                  if (filteredItems.every((i) => i.active)) {
                    onItemVisibilityChange(filteredItems.map((i) => i.id));
                  } else {
                    onItemVisibilityChange([]);
                  }
                }}
              />
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Search"
                filteringAriaLabel="Search legend items"
                onChange={({ detail }) => setFilteringText(detail.filteringText)}
              />
            </div>

            <div style={{ background: colorBorderDividerDefault, width: "100%", height: 1 }} />
          </div>
        )}

        <div className={clsx(styles.list, styles[`list-align-${align}`], styles[`list-placement-${placement}`])}>
          {/* {showFilter && placement === "block-end" && (
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
                  onItemVisibilityChange(items.map((item) => item.id).filter((id) => !selectedSeries.includes(id)))
                }
              />
              <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
            </div>
          )} */}

          {placement === "block-end" && (showFilter || tooltip) && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {showFilter && (
                <LegendFilter
                  filteringText={filteringText}
                  allChecked={filteredItems.every((i) => i.active)}
                  someChecked={!filteredItems.every((i) => i.active) && filteredItems.some((i) => i.active)}
                  onFilterChange={(filteringText) => setFilteringText(filteringText)}
                  onSelectAll={() => onItemVisibilityChange([])}
                  onSelectNone={() => onItemVisibilityChange(filteredItems.map((i) => i.id))}
                />
              )}

              {tooltip && (
                <ToggleButton
                  variant="icon"
                  pressed={infoPressed}
                  onChange={({ detail }) => setInfoPressed(detail.pressed)}
                  iconName="status-info"
                  pressedIconSvg={<StatusInfoToggledSVG />}
                />
              )}

              <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
            </div>
          )}

          {filteredItems.map((item, index) => {
            const handlers = {
              onMouseEnter: () => {
                showHighlight(item.id);

                if (!tooltipPinned && (infoPressed || placement === "inline-end")) {
                  showTooltip(item.id);
                }
              },
              onMouseLeave: () => {
                clearHighlight();

                if (!tooltipPinned) {
                  hideTooltip();
                }
              },
              onFocus: () => {
                onFocus(index);
                showHighlight(item.id);

                if (infoPressed || placement === "inline-end") {
                  showTooltip(item.id);
                }
              },
              onBlur: () => {
                onBlur();
                clearHighlight();

                if (!tooltipPinned) {
                  hideTooltip();
                }
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
                  const isAlt = event.getModifierState("Alt");
                  const tooltipAction = infoPressed || isAlt;
                  if (tooltipAction && !tooltipPinned) {
                    setTooltipPinned(true);
                    showTooltip(item.id);
                    return;
                  }
                  if (tooltipAction && tooltipPinned) {
                    setTooltipPinned(false);
                    hideTooltip();
                    return;
                  }
                  if (event.metaKey || event.ctrlKey) {
                    selectItem(item.id);
                  } else {
                    toggleItem(item.id);
                  }
                }}
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
          <div
            onFocus={() => {
              showTooltip(tooltipItem);
            }}
          >
            <InternalChartTooltip
              key={tooltipItem}
              trackKey={tooltipItem}
              getTrack={() => segmentsRef.current[tooltipItemIndex]}
              dismissButton={tooltipPinned}
              onDismiss={() => {
                focusElement(
                  items.findIndex((it) => it.id === tooltipItem),
                  true,
                );
                hideTooltip();
                setTooltipPinned(false);
              }}
              onMouseEnter={() => showTooltip(tooltipItem)}
              onMouseLeave={() => !tooltipPinned && hideTooltip()}
              container={segmentsRef.current[tooltipItemIndex]}
              title={tooltipContent.header}
              footer={tooltipContent.footer}
              position={placement === "block-end" ? "bottom" : "left"}
            >
              {tooltipContent.body}
            </InternalChartTooltip>
          </div>
        )}
      </div>
    </SingleTabStopNavigationProvider>
  );
}

function StatusInfoToggledSVG() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="currentColor"></circle>
      <path d="M8 12V7M8 6V4" color={colorBackgroundLayoutMain}></path>
    </svg>
  );
}

function LegendFilter({
  filteringText,
  allChecked,
  someChecked,
  onFilterChange,
  onSelectAll,
  onSelectNone,
}: {
  filteringText: string;
  allChecked: boolean;
  someChecked: boolean;
  onFilterChange: (filteringText: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  const [searchVisible, setSearchVisible] = useState(false);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: "100%" }}>
      {!searchVisible && (
        <Button iconName="search" ariaLabel="Search" variant="icon" onClick={() => setSearchVisible(true)} />
      )}

      {searchVisible && (
        <>
          <Checkbox
            ariaLabel="Select all"
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            onChange={() => (allChecked ? onSelectNone() : onSelectAll())}
          >
            All
          </Checkbox>

          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Search"
            filteringAriaLabel="Search input"
            onChange={({ detail }) => onFilterChange(detail.filteringText)}
          />

          <Button
            iconName="close"
            ariaLabel="Close search"
            variant="icon"
            onClick={() => {
              setSearchVisible(false);
              onFilterChange("");
            }}
          />
        </>
      )}
    </div>
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

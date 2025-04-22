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
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import Modal from "@cloudscape-design/components/modal";
import Popover from "@cloudscape-design/components/popover";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
import {
  colorBackgroundLayoutMain,
  colorBorderDividerDefault,
  colorBorderDividerSecondary,
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
  legendTitle?: string;
  ariaLabel?: string;
  infoTooltip?: InfoTooltipProps;
  placement?: "block-end" | "inline-end";
  actions?: {
    seriesFilter?: boolean;
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
      infoTooltip,
      placement = "block-end",
      actions,
      onItemVisibilityChange,
      onItemHighlightEnter,
      onItemHighlightExit,
    }: ChartLegendProps,
    ref: React.Ref<ChartLegendRef>,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const segmentsRef = useRef<Record<number, HTMLElement>>([]);

    const [tooltipPinned, setTooltipPinned] = useState(false);
    const highlightControl = useMemo(() => new DebouncedCall(), []);
    const tooltipControl = useMemo(() => new DebouncedCall(), []);
    const noTooltipRef = useRef(false);
    const noTooltipControl = useMemo(() => new DebouncedCall(), []);
    const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [tooltipItem, setTooltipItem] = useState<null | string>(null);
    const tooltipContent = tooltipItem ? infoTooltip?.render(tooltipItem, { context: "legend" }) : null;
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
        const firstItemIndex = items.findIndex((i) => ids.includes(i.id));
        segmentsRef.current[firstItemIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
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
      const hiddenItems = items.filter((i) => !i.active).map((i) => i.id);
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
      const visibleItems = items.filter((i) => i.active).map((i) => i.id);
      if (visibleItems.length === 1 && visibleItems[0] === itemId) {
        onItemVisibilityChange([], { method: "legend-select" });
      } else {
        onItemVisibilityChange(
          items.map((i) => i.id).filter((id) => id !== itemId),
          { method: "legend-select" },
        );
      }
    };

    const tooltipItemIndex = items.findIndex((item) => item.id === tooltipItem);

    const renderedFilter = actions?.seriesFilter ? (
      <ChartLegendFilter
        items={items}
        infoTooltip={infoTooltip}
        onApply={(state) => {
          onItemVisibilityChange(
            items.filter((i) => !state.selectedItems.includes(i.id)).map((i) => i.id),
            { method: "filter" },
          );
        }}
      />
    ) : null;

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

          {placement === "inline-end" && renderedFilter && (
            <div style={{ position: "sticky", zIndex: 1, top: 0, background: colorBackgroundLayoutMain }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>{renderedFilter}</div>

              <div style={{ background: colorBorderDividerDefault, width: "100%", height: 1 }} />
            </div>
          )}

          <div className={clsx(styles.list, styles[`list-placement-${placement}`])}>
            {placement === "block-end" && renderedFilter && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {renderedFilter}

                <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
              </div>
            )}

            {items.map((item, index) => {
              const handlers = {
                onMouseEnter: () => {
                  showHighlight(item.id);

                  if (!tooltipPinned) {
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
                  showTooltip(item.id);
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
  },
);

export interface LegendFilterState {
  selectedItems: string[];
}

function ChartLegendFilter({
  items,
  infoTooltip,
  onApply: onApplyExternal,
}: {
  items: readonly ChartLegendItem[];
  infoTooltip?: InfoTooltipProps;
  onApply: ({ selectedItems }: { selectedItems: string[] }) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tempState, setTempState] = useState<LegendFilterState>({
    selectedItems: items.filter((i) => i.active).map((i) => i.id),
  });
  const onModalOpen = () => {
    setModalOpen(true);
    setTempState({ selectedItems: items.filter((i) => i.active).map((i) => i.id) });
    setFilteringText("");
  };
  const onModalDismiss = () => {
    setModalOpen(false);
  };
  const onCancel = () => {
    setModalOpen(false);
  };
  const onApply = () => {
    onApplyExternal(tempState);
    setModalOpen(false);
  };
  const [filteringText, setFilteringText] = useState("");

  const filteredItems = items.filter((i) => i.name.toLowerCase().includes(filteringText.toLowerCase()));

  const itemDisplay = (
    <FormField label="Series display" description="Customize series visibility.">
      <div>
        <TextFilter
          filteringText={filteringText}
          filteringPlaceholder="Search series"
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
        />

        <div
          style={{
            marginTop: 8,
            paddingBottom: 4,
            marginBottom: 4,
            borderBottom: `1px solid ${colorBorderDividerDefault}`,
          }}
        >
          <Checkbox
            disabled={filteredItems.length === 0}
            checked={filteredItems.every((i) => tempState.selectedItems.includes(i.id))}
            indeterminate={
              !filteredItems.every((i) => tempState.selectedItems.includes(i.id)) &&
              filteredItems.some((i) => tempState.selectedItems.includes(i.id))
            }
            onChange={() => {
              const allSelected = filteredItems.every((i) => tempState.selectedItems.includes(i.id));
              if (!allSelected) {
                setTempState((prev) => {
                  const next = new Set(prev.selectedItems);
                  for (const i of filteredItems) {
                    next.add(i.id);
                  }
                  return { ...prev, selectedItems: [...next] };
                });
              } else {
                setTempState((prev) => {
                  const next = new Set(prev.selectedItems);
                  for (const i of filteredItems) {
                    next.delete(i.id);
                  }
                  return { ...prev, selectedItems: [...next] };
                });
              }
            }}
          >
            Select all
          </Checkbox>
        </div>

        <div style={{ maxHeight: 400, overflowY: "auto", padding: 4, paddingLeft: 24, position: "relative" }}>
          {filteredItems.length === 0 && (
            <Box textAlign="center" color="inherit" padding="s">
              <b>No matching series</b>
              <Box variant="p" color="inherit">
                There is no matching series to display
              </Box>
              <Button onClick={() => setFilteringText("")}>Clear filter</Button>
            </Box>
          )}

          {filteredItems.map((item) => {
            const tooltipContent = infoTooltip?.render(item.id, { context: "filter" });
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${colorBorderDividerSecondary}`,
                }}
              >
                <Checkbox
                  checked={tempState.selectedItems.includes(item.id)}
                  onChange={({ detail }) => {
                    setTempState((prev) => ({
                      ...prev,
                      selectedItems: detail.checked
                        ? [...(prev.selectedItems ?? []), item.id]
                        : (prev.selectedItems ?? []).filter((i) => i !== item.id),
                    }));
                  }}
                >
                  <SpaceBetween size="xs" direction="horizontal">
                    <ChartSeriesMarker {...item} />
                    <Box>{item.name}</Box>
                  </SpaceBetween>
                </Checkbox>

                {tooltipContent ? (
                  <Popover
                    triggerType="custom"
                    header={tooltipContent.header as any}
                    content={
                      <div>
                        {tooltipContent.body}
                        {tooltipContent.footer}
                      </div>
                    }
                  >
                    <Button variant="icon" iconName="status-info" />
                  </Popover>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </FormField>
  );

  // TODO: i18n
  return (
    <>
      <Button variant="icon" iconName="search" onClick={onModalOpen} />
      {modalOpen && (
        <Modal
          visible={true}
          size="medium"
          onDismiss={onModalDismiss}
          header="Series filter"
          footer={
            <div style={{ display: "flex", gap: 8, justifySelf: "flex-end" }}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button variant="primary" onClick={onApply}>
                Apply
              </Button>
            </div>
          }
        >
          {itemDisplay}
        </Modal>
      )}
    </>
  );
}

const LegendItemTrigger = forwardRef(
  (
    {
      isHighlighted,
      someHighlighted,
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
      isHighlighted?: boolean;
      someHighlighted?: boolean;
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
            [styles["marker--inactive"]]: !active,
            [styles["marker--dimmed"]]: someHighlighted && !isHighlighted,
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

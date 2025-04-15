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
import ButtonDropdown, { ButtonDropdownProps } from "@cloudscape-design/components/button-dropdown";
import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import { InternalChartFilter } from "@cloudscape-design/components/internal/do-not-use/chart-filter";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { InternalSortableArea } from "@cloudscape-design/components/internal/do-not-use/sortable-area";
import Modal from "@cloudscape-design/components/modal";
import Popover from "@cloudscape-design/components/popover";
import RadioGroup from "@cloudscape-design/components/radio-group";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextFilter from "@cloudscape-design/components/text-filter";
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
  filterType?: "inline" | "dropdown" | "settings";
  placement?: "block-end" | "inline-end";
  onPlacementChange?: (placement: "block-end" | "inline-end") => void;
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
}

export default memo(ChartLegend) as typeof ChartLegend;

// TODO: replace all indices with IDs
function ChartLegend({
  items,
  align = "start",
  legendTitle,
  ariaLabel,
  tooltip,
  filter: showFilter = false,
  filterType = "inline",
  placement = "block-end",
  onPlacementChange,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
}: ChartLegendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentsRef = useRef<Record<number, HTMLElement>>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [tempFilteringText, setTempFilteringText] = useState("");
  const [tempPlacement, setTempPlacement] = useState<"block-end" | "inline-end">(placement);
  const [tempInfoPressed, setTempInfoPressed] = useState(false);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const highlightControl = useMemo(() => new DebouncedCall(), []);
  const tooltipControl = useMemo(() => new DebouncedCall(), []);
  const noTooltipRef = useRef(false);
  const noTooltipControl = useMemo(() => new DebouncedCall(), []);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tooltipItem, setTooltipItem] = useState<null | string>(null);
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
  const tooltipItemIndex = filteredItems.findIndex((item) => item.id === tooltipItem);

  const [infoPressed, setInfoPressed] = useState(false);

  const actionItems: ButtonDropdownProps.ItemOrGroup[] = [];
  actionItems.push({
    id: "show-all",
    disabled: items.every((i) => i.active),
    text: "Show all",
  });
  actionItems.push({
    id: "hide-all",
    disabled: items.every((i) => !i.active),
    text: "Hide all",
  });
  if (tooltip) {
    actionItems.push(
      infoPressed
        ? {
            id: "info",
            text: "Hide info tooltips",
          }
        : {
            id: "info",
            text: "Show item tooltips",
          },
    );
  }
  if (onPlacementChange) {
    actionItems.push(
      placement === "block-end"
        ? {
            id: "placement",
            text: "Show on side",
          }
        : {
            id: "placement",
            text: "Show at bottom",
          },
    );
  }

  const actions =
    filterType === "settings" ? null : (
      <div>
        <ButtonDropdown
          variant="icon"
          items={actionItems}
          onItemClick={({ detail }) => {
            switch (detail.id) {
              case "info":
                return setInfoPressed((prev) => !prev);
              case "placement":
                return onPlacementChange?.(placement === "block-end" ? "inline-end" : "block-end");
              case "show-all":
                return onItemVisibilityChange([]);
              case "hide-all":
                return onItemVisibilityChange(filteredItems.map((i) => i.id));
            }
          }}
        />

        <Popover
          triggerType="custom"
          position="top"
          header="Navigation"
          renderWithPortal={true}
          content={
            <SpaceBetween size="xs">
              <Box color="text-body-secondary" fontSize="body-s">
                <Box variant="code">Click</Box> on legend items to toggle series visibility.
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                <Box variant="code">Command+Click</Box> on legend items to isolate the respective series.
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                <Box variant="code">Option+Click</Box> on legend items to show additional item info.
              </Box>
            </SpaceBetween>
          }
        >
          <Button variant="icon" iconName="status-info" />
        </Popover>
      </div>
    );

  const tempFilteredItems = items.filter((i) => i.name.toLowerCase().includes(tempFilteringText.toLowerCase()));

  const filter =
    filterType === "inline" ? (
      <InlineLegendFilter
        filteringText={filteringText}
        onFilterChange={(filteringText) => setFilteringText(filteringText)}
      />
    ) : filterType === "dropdown" ? (
      <InternalChartFilter
        series={items.map((i) => ({ label: i.name, color: i.color, datum: i.id, type: "rectangle" }))}
        selectedSeries={items.filter((i) => i.active).map((i) => i.id)}
        onChange={(visible) => onItemVisibilityChange(items.filter((i) => !visible.includes(i.id)).map((i) => i.id))}
      />
    ) : (
      <>
        <Button
          variant="icon"
          iconName="settings"
          onClick={() => {
            setSettingsOpen(true);
            setTempSelection(items.filter((i) => i.active).map((i) => i.id));
            setTempFilteringText("");
            setTempPlacement(placement);
            setTempInfoPressed(infoPressed);
          }}
        />
        {settingsOpen && (
          <Modal
            visible={true}
            size="large"
            onDismiss={() => setSettingsOpen(false)}
            header="Chart display preferences"
            footer={
              <div style={{ display: "flex", gap: 8, justifySelf: "flex-end" }}>
                <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSettingsOpen(false);
                    onItemVisibilityChange(items.filter((i) => !tempSelection.includes(i.id)).map((i) => i.id));
                    onPlacementChange?.(tempPlacement);
                    setTempInfoPressed(infoPressed);
                    setInfoPressed(tempInfoPressed);
                  }}
                >
                  Apply
                </Button>
              </div>
            }
          >
            <ColumnLayout columns={2} borders="all">
              <SpaceBetween size="s">
                <FormField label="Legend placement">
                  <RadioGroup
                    items={[
                      { value: "block-end", label: "Bottom" },
                      { value: "inline-end", label: "Side" },
                    ]}
                    value={tempPlacement}
                    onChange={({ detail }) => setTempPlacement(detail.value as "block-end" | "inline-end")}
                  />
                </FormField>

                <FormField label="Navigation">
                  <SpaceBetween size="s">
                    <Checkbox checked={tempInfoPressed} onChange={({ detail }) => setTempInfoPressed(detail.checked)}>
                      Show legend item tooltips
                    </Checkbox>

                    {tempInfoPressed ? (
                      <SpaceBetween size="xs">
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Click</Box> on legend items to pin info tooltip.
                        </Box>
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Command+Click</Box> on legend items to isolate the respective series.
                        </Box>
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Option+Click</Box> on legend items to toggle series visibility.
                        </Box>
                      </SpaceBetween>
                    ) : (
                      <SpaceBetween size="xs">
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Click</Box> on legend items to toggle series visibility.
                        </Box>
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Command+Click</Box> on legend items to isolate the respective series.
                        </Box>
                        <Box color="text-body-secondary" fontSize="body-s">
                          <Box variant="code">Option+Click</Box> on legend items to show additional item info.
                        </Box>
                      </SpaceBetween>
                    )}
                  </SpaceBetween>
                </FormField>
              </SpaceBetween>

              <FormField label="Series preferences" description="Customize the visibility and order of the series.">
                <SpaceBetween size="s">
                  <TextFilter
                    filteringText={tempFilteringText}
                    filteringPlaceholder="Search"
                    filteringAriaLabel="Search input"
                    onChange={({ detail }) => setTempFilteringText(detail.filteringText)}
                  />

                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    <div
                      style={{
                        paddingBottom: 4,
                        marginBottom: 4,
                        borderBottom: `1px solid ${colorBorderDividerDefault}`,
                      }}
                    >
                      <Checkbox
                        checked={tempFilteredItems.every((i) => tempSelection.includes(i.id))}
                        indeterminate={
                          !tempFilteredItems.every((i) => tempSelection.includes(i.id)) &&
                          tempFilteredItems.some((i) => tempSelection.includes(i.id))
                        }
                        onChange={() => {
                          const allSelected = tempFilteredItems.every((i) => tempSelection.includes(i.id));
                          if (!allSelected) {
                            setTempSelection((prev) => {
                              const next = new Set(prev);
                              for (const i of tempFilteredItems) {
                                next.add(i.id);
                              }
                              return [...next];
                            });
                          } else {
                            setTempSelection((prev) => {
                              const next = new Set(prev);
                              for (const i of tempFilteredItems) {
                                next.delete(i.id);
                              }
                              return [...next];
                            });
                          }
                        }}
                      >
                        Select all
                      </Checkbox>
                    </div>

                    <InternalSortableArea
                      items={tempFilteredItems}
                      itemDefinition={{ id: (item) => item.id, label: (item) => item.name }}
                      onItemsChange={() => {}}
                      renderItem={({ item, ref, className, style }) => {
                        className = clsx(className, styles.option);
                        return (
                          <div
                            ref={ref}
                            className={className}
                            style={{
                              ...style,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Checkbox
                              checked={tempSelection.includes(item.id)}
                              onChange={({ detail }) => {
                                setTempSelection((prev) =>
                                  detail.checked ? [...prev, item.id] : prev.filter((i) => i !== item.id),
                                );
                              }}
                            >
                              {item.name}
                            </Checkbox>

                            <Popover
                              triggerType="custom"
                              header={tooltip ? (tooltip.render(item.id).header as any) : null}
                              content={
                                tooltip ? (
                                  <div>
                                    {tooltip.render(item.id).body}
                                    {tooltip.render(item.id).footer}
                                  </div>
                                ) : null
                              }
                            >
                              <Button variant="icon" iconName="status-info" disabled={!tooltip} />
                            </Popover>
                          </div>
                        );
                      }}
                    />
                  </div>
                </SpaceBetween>
              </FormField>
            </ColumnLayout>
          </Modal>
        )}
      </>
    );

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
                gap: 4,
                justifyContent: "space-between",
              }}
            >
              <div>{showFilter && filter}</div>

              {actions}
            </div>

            <div style={{ background: colorBorderDividerDefault, width: "100%", height: 1 }} />
          </div>
        )}

        <div className={clsx(styles.list, styles[`list-align-${align}`], styles[`list-placement-${placement}`])}>
          {placement === "block-end" && (showFilter || tooltip) && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {showFilter && filter}

              {actions}

              <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
            </div>
          )}

          {filteredItems.map((item, index) => {
            const handlers = {
              onMouseEnter: () => {
                showHighlight(item.id);

                if (!tooltipPinned && infoPressed) {
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

                if (infoPressed) {
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
                  const tooltipAction = (infoPressed && !isAlt) || (!infoPressed && isAlt);
                  if (event.metaKey || event.ctrlKey) {
                    selectItem(item.id);
                    return;
                  }
                  if (tooltipAction && !tooltipPinned) {
                    setTooltipPinned(true);
                    showTooltip(item.id);
                    return;
                  } else if (tooltipAction && tooltipPinned) {
                    setTooltipPinned(false);
                    hideTooltip();
                    return;
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
                infoMode={infoPressed}
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
                  filteredItems.findIndex((it) => it.id === tooltipItem),
                  true,
                );
                hideTooltip();
                setTooltipPinned(false);
              }}
              onMouseEnter={() => showTooltip(tooltipItem)}
              onMouseLeave={() => !tooltipPinned && hideTooltip()}
              container={segmentsRef.current[tooltipItemIndex]}
              title={
                <SpaceBetween direction="horizontal" size="xs">
                  <Box>
                    <Checkbox
                      checked={!!items.find((it) => it.id === tooltipItem)?.active}
                      onChange={() => toggleItem(tooltipItem)}
                    />
                  </Box>
                  <span>{tooltipContent.header}</span>
                </SpaceBetween>
              }
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

function InlineLegendFilter({
  filteringText,
  onFilterChange,
  onFilterExpand,
  onFilterCollapse,
}: {
  filteringText: string;
  onFilterChange: (filteringText: string) => void;
  onFilterExpand?: () => void;
  onFilterCollapse?: () => void;
}) {
  const [searchVisible, setSearchVisible] = useState(false);

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: "100%" }}>
      {!searchVisible && (
        <Button
          iconName="search"
          ariaLabel="Search"
          variant="icon"
          onClick={() => {
            setSearchVisible(true);
            onFilterExpand?.();
          }}
        />
      )}

      {searchVisible && (
        <>
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
              onFilterCollapse?.();
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
      infoMode,
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
      infoMode?: boolean;
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
        style={{ textDecoration: infoMode ? "underline" : "" }}
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

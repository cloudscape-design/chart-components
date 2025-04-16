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
import ColumnLayout from "@cloudscape-design/components/column-layout";
import FormField from "@cloudscape-design/components/form-field";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import { InternalSortableArea } from "@cloudscape-design/components/internal/do-not-use/sortable-area";
import Modal, { ModalProps } from "@cloudscape-design/components/modal";
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
  legendTitle?: string;
  ariaLabel?: string;
  infoTooltip?: InfoTooltipProps;
  tooltipMode?: boolean;
  placement?: "block-end" | "inline-end";
  preferences?: LegendPreferencesProps;
  onItemHighlightEnter?: (itemId: string) => void;
  onItemHighlightExit?: () => void;
  onItemVisibilityChange: (
    hiddenItems: string[],
    context: { method: "legend-toggle" | "legend-select" | "preferences" },
  ) => void;
}

export interface InfoTooltipProps {
  render: (
    itemId: string,
    { context }: { context: "legend" | "preferences" },
  ) => {
    header: React.ReactNode;
    body: React.ReactNode;
    footer?: React.ReactNode;
  };
}

export interface LegendPreferencesProps {
  itemDisplayPreference?: boolean;
  navigationPreference?: boolean;
  legendPlacementPreference?: boolean;
  renderer?: (props: LegendPreferencesRendererProps) => JSX.Element;
  modalSize?: ModalProps.Size;
  onApply: (nextState: LegendPreferencesState) => void | boolean;
}

export interface LegendPreferencesRendererProps {
  itemDisplay: React.ReactNode;
  navigation: React.ReactNode;
  legendPlacement: React.ReactNode;
}

export interface ChartLegendRef {
  highlightItem: (itemId: string) => void;
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
      tooltipMode = false,
      placement = "block-end",
      preferences,
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
    const [highlightedItem, setHighlightedItem] = useState<null | string>(null);
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
    const showHighlight = (itemId: string, callback = true) => {
      setHighlightedItem(itemId);
      highlightControl.cancelPrevious();
      if (callback) {
        onItemHighlightEnter?.(itemId);
      }
    };
    const clearHighlight = (callback = true) => {
      setHighlightedItem(null);
      if (callback) {
        highlightControl.call(() => onItemHighlightExit?.(), 50);
      }
    };

    useImperativeHandle(ref, () => ({
      highlightItem: (itemId) => {
        showHighlight(itemId, false);
        const itemIndex = items.findIndex((i) => i.id === itemId);
        segmentsRef.current[itemIndex]?.scrollIntoView({ behavior: "smooth" });
      },
      clearHighlight: () => clearHighlight(false),
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

    const renderedPreferences = preferences ? (
      <ChartLegendPreferences
        items={items}
        tooltipMode={tooltipMode}
        legendPlacement={placement}
        infoTooltip={infoTooltip}
        itemDisplayPreference={preferences.itemDisplayPreference}
        navigationPreference={preferences.navigationPreference}
        legendPlacementPreference={preferences.legendPlacementPreference}
        renderer={preferences.renderer}
        modalSize={preferences.modalSize}
        onApply={(state) => {
          preferences.onApply(state);
          onItemVisibilityChange(
            items.filter((i) => !state.selectedItems.includes(i.id)).map((i) => i.id),
            { method: "preferences" },
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

          {placement === "inline-end" && preferences && (
            <div style={{ position: "sticky", zIndex: 1, top: 0, background: colorBackgroundLayoutMain }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>{renderedPreferences}</div>

              <div style={{ background: colorBorderDividerDefault, width: "100%", height: 1 }} />
            </div>
          )}

          <div className={clsx(styles.list, styles[`list-placement-${placement}`])}>
            {placement === "block-end" && preferences && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {renderedPreferences}

                <div style={{ background: colorBorderDividerDefault, width: 1, height: "80%" }} />
              </div>
            )}

            {items.map((item, index) => {
              const handlers = {
                onMouseEnter: () => {
                  showHighlight(item.id);

                  if (!tooltipPinned && tooltipMode) {
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

                  if (tooltipMode) {
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
                    const tooltipAction = (tooltipMode && !isAlt) || (!tooltipMode && isAlt);
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
                  highlightedItem={highlightedItem}
                  itemId={item.id}
                  label={item.name}
                  color={item.color}
                  type={item.type}
                  status={item.status}
                  active={item.active}
                  infoMode={tooltipMode}
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
  },
);

export interface LegendPreferencesState {
  selectedItems: string[];
  legendPlacement: "block-end" | "inline-end";
  tooltipMode: boolean;
}

function ChartLegendPreferences({
  items,
  tooltipMode: tooltipModeState,
  legendPlacement: legendPlacementState,
  infoTooltip,
  itemDisplayPreference,
  navigationPreference,
  legendPlacementPreference,
  renderer: CustomRenderer,
  modalSize,
  onApply: onApplyExternal,
}: LegendPreferencesProps & {
  items: readonly ChartLegendItem[];
  tooltipMode: boolean;
  legendPlacement: "block-end" | "inline-end";
  infoTooltip?: InfoTooltipProps;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tempState, setTempState] = useState<LegendPreferencesState>({
    selectedItems: items.filter((i) => i.active).map((i) => i.id),
    tooltipMode: tooltipModeState,
    legendPlacement: legendPlacementState,
  });
  const onModalOpen = () => {
    setModalOpen(true);
    setTempState({
      selectedItems: items.filter((i) => i.active).map((i) => i.id),
      tooltipMode: tooltipModeState,
      legendPlacement: legendPlacementState,
    });
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

  const legendPlacement = legendPlacementPreference ? (
    <FormField label="Legend placement">
      <RadioGroup
        items={[
          { value: "block-end", label: "Bottom" },
          { value: "inline-end", label: "Side" },
        ]}
        value={tempState.legendPlacement ?? "block-end"}
        onChange={({ detail }) =>
          setTempState((prev) => ({ ...prev, legendPlacement: detail.value as "block-end" | "inline-end" }))
        }
      />
    </FormField>
  ) : null;

  const navigation = navigationPreference ? (
    <FormField label="Navigation">
      <SpaceBetween size="s">
        {infoTooltip ? (
          <Checkbox
            checked={tempState.tooltipMode ?? false}
            onChange={({ detail }) => setTempState((prev) => ({ ...prev, tooltipMode: detail.checked }))}
          >
            Show legend item tooltips
          </Checkbox>
        ) : null}

        {tempState.tooltipMode ? (
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
            {infoTooltip ? (
              <Box color="text-body-secondary" fontSize="body-s">
                <Box variant="code">Option+Click</Box> on legend items to show additional item info.
              </Box>
            ) : null}
          </SpaceBetween>
        )}
      </SpaceBetween>
    </FormField>
  ) : null;

  const itemDisplay = itemDisplayPreference ? (
    <FormField label="Series preferences" description="Customize the visibility of the series.">
      <SpaceBetween size="s">
        <TextFilter
          filteringText={filteringText}
          filteringPlaceholder="Search"
          filteringAriaLabel="Search input"
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
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

          <InternalSortableArea
            items={filteredItems}
            itemDefinition={{ id: (item) => item.id, label: (item) => item.name }}
            onItemsChange={() => {}}
            renderItem={({ item, ref, className, style }) => {
              className = clsx(className, styles.option);
              const tooltipContent = infoTooltip?.render(item.id, { context: "preferences" });
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
            }}
          />
        </div>
      </SpaceBetween>
    </FormField>
  ) : null;

  const Renderer = CustomRenderer ?? DefaultRenderer;

  const defaultModalSize = itemDisplay && (navigation || legendPlacement) ? "large" : "medium";

  return (
    <>
      <Button variant="icon" iconName="settings" onClick={onModalOpen} />
      {modalOpen && (
        <Modal
          visible={true}
          size={modalSize ?? defaultModalSize}
          onDismiss={onModalDismiss}
          header="Chart display preferences"
          footer={
            <div style={{ display: "flex", gap: 8, justifySelf: "flex-end" }}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button variant="primary" onClick={onApply}>
                Apply
              </Button>
            </div>
          }
        >
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <Renderer
            itemDisplay={itemDisplay ?? null}
            navigation={navigation ?? null}
            legendPlacement={legendPlacement ?? null}
          />
        </Modal>
      )}
    </>
  );
}

function DefaultRenderer({
  itemDisplay,
  navigation,
  legendPlacement,
}: {
  itemDisplay: null | React.ReactNode;
  navigation: null | React.ReactNode;
  legendPlacement: null | React.ReactNode;
}) {
  const left =
    legendPlacement || navigation ? (
      <SpaceBetween size="s">
        {legendPlacement}
        {navigation}
      </SpaceBetween>
    ) : null;

  const right = itemDisplay;

  return left && right ? (
    <ColumnLayout columns={2} borders="all">
      {left}
      {right}
    </ColumnLayout>
  ) : (
    (left ?? right)
  );
}

const LegendItemTrigger = forwardRef(
  (
    {
      highlightedItem,
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
      highlightedItem: null | string;
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
            [styles["marker--inactive"]]: !active,
            [styles["marker--dimmed"]]: highlightedItem && highlightedItem !== itemId,
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

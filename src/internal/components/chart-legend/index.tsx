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
  title?: string;
  ariaLabel?: string;
  oppositeTitle?: string;
  actions?: React.ReactNode;
  type: "single" | "dual";
  bottomMaxHeight?: number;
  position: "bottom" | "side";
  onItemHighlightEnter: (item: LegendItem) => void;
  onItemHighlightExit: () => void;
  onItemVisibilityChange: (hiddenItems: string[]) => void;
  getTooltipContent: (props: GetLegendTooltipContentProps) => null | LegendTooltipContent;
}

export const ChartLegend = ({
  type,
  items,
  title,
  oppositeTitle,
  ariaLabel,
  actions,
  position,
  bottomMaxHeight,
  onItemVisibilityChange,
  onItemHighlightEnter,
  onItemHighlightExit,
  getTooltipContent,
}: ChartLegendProps) => {
  const tooltipRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTrack = useRef<null | HTMLElement>(null);
  const elementsByIdRef = useRef<Record<string, HTMLElement>>({});
  const highlightControl = useMemo(() => new DebouncedCall(), []);

  const [shouldStack, setShouldStack] = useState(false);
  const [tooltipItemId, setTooltipItemId] = useState<string | null>(null);

  const tooltipPosition = position === "bottom" ? "bottom" : "left";
  const tooltipTarget = items.find((item) => item.id === tooltipItemId) ?? null;
  tooltipTrack.current = tooltipItemId ? elementsByIdRef.current[tooltipItemId] : null;
  const tooltipContent = tooltipTarget && getTooltipContent({ legendItem: tooltipTarget });

  const { defaultItems, oppositeItems } = useMemo(() => {
    if (type === "single") {
      return { defaultItems: items, oppositeItems: [] };
    }
    const defaultItems = items.filter((item) => !item.oppositeAxis);
    const oppositeItems = items.filter((item) => item.oppositeAxis);
    return { defaultItems, oppositeItems };
  }, [items, type]);

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
    if (!containerRef.current) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const width = entries[0].borderBoxSize?.[0].inlineSize;
        setShouldStack(width < 400);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
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

  const onShowHighlight = (itemId: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item?.visible) {
      highlightControl.cancelPrevious();
      onItemHighlightEnter(item);
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

  const legendGroupProps = {
    actions,
    tooltipRef,
    elementsByIdRef,
    bottomMaxHeight,
    highlightControl,
    someHighlighted: items.some((item) => item.highlighted),
    onHideTooltip,
    onItemHighlightExit,
    onSelectItem,
    onShowHighlight,
    onShowTooltip,
    onToggleItem,
  };

  return (
    <div
      ref={containerRef}
      aria-label={ariaLabel || title}
      className={clsx(testClasses.root, styles.root, {
        [styles["root-side"]]: position === "side",
      })}
    >
      {position === "bottom" ? (
        oppositeItems.length === 0 ? (
          <LegendGroup
            position={"bottom"}
            title={title}
            items={defaultItems}
            ariaLabel={"Chart legend"}
            {...legendGroupProps}
          />
        ) : shouldStack ? (
          <>
            <LegendGroup
              position={"side"}
              title={title}
              items={defaultItems}
              ariaLabel={"Default legend"}
              scrollableContainerRef={containerRef}
              {...legendGroupProps}
            />
            {oppositeItems.length > 0 && (
              <>
                <div className={clsx(styles["legend-divider-side"])} />
                <LegendGroup
                  position={"side"}
                  title={oppositeTitle}
                  items={oppositeItems}
                  ariaLabel={"Opposite legend"}
                  scrollableContainerRef={containerRef}
                  {...legendGroupProps}
                />
              </>
            )}
          </>
        ) : (
          <div className={styles["legend-bottom-dual-axis-container"]}>
            <LegendGroup
              title={title}
              items={defaultItems}
              position={"bottom-default"}
              ariaLabel={"Primary legend"}
              {...legendGroupProps}
            />
            <LegendGroup
              title={oppositeTitle}
              items={oppositeItems}
              position={"bottom-opposite"}
              ariaLabel={"Opposite legend"}
              {...legendGroupProps}
            />
          </div>
        )
      ) : (
        <>
          <LegendGroup
            position={"side"}
            title={title}
            items={defaultItems}
            ariaLabel={"Default legend"}
            scrollableContainerRef={containerRef}
            {...legendGroupProps}
          />
          {oppositeItems.length > 0 && (
            <>
              <div className={clsx(styles["legend-divider-side"])} />
              <LegendGroup
                position={"side"}
                title={oppositeTitle}
                items={oppositeItems}
                ariaLabel={"Opposite legend"}
                scrollableContainerRef={containerRef}
                {...legendGroupProps}
              />
            </>
          )}
        </>
      )}
      {tooltipContent && (
        <InternalChartTooltip
          container={null}
          dismissButton={false}
          onDismiss={() => {}}
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
  );
};

interface LegendItemsProps {
  title?: string;
  ariaLabel: string;
  someHighlighted: boolean;
  bottomMaxHeight?: number;
  actions?: React.ReactNode;
  highlightControl: DebouncedCall;
  items: readonly LegendItem[];
  tooltipRef: React.RefObject<HTMLElement>;
  scrollableContainerRef?: React.RefObject<HTMLElement>;
  position: "bottom" | "bottom-default" | "bottom-opposite" | "side";
  elementsByIdRef: React.MutableRefObject<Record<string, HTMLElement>>;
  onItemHighlightExit: () => void;
  onHideTooltip: (lock?: boolean) => void;
  onSelectItem: (itemId: string) => void;
  onToggleItem: (itemId: string) => void;
  onShowTooltip: (itemId: string) => void;
  onShowHighlight: (itemId: string) => void;
}

const LegendGroup = ({
  title,
  items,
  actions,
  position,
  ariaLabel,
  tooltipRef,
  bottomMaxHeight,
  someHighlighted,
  elementsByIdRef,
  highlightControl,
  scrollableContainerRef,
  onToggleItem,
  onSelectItem,
  onShowTooltip,
  onHideTooltip,
  onShowHighlight,
  onItemHighlightExit,
}: LegendItemsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseInContainer = useRef<boolean>(false);
  const navigationAPI = useRef<SingleTabStopNavigationAPI>(null);
  const elementsByIndexRef = useRef<Record<number, HTMLElement>>({});

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const scrollIntoViewControl = useMemo(() => new DebouncedCall(), []);

  useEffect(() => {
    navigationAPI.current!.updateFocusTarget();
  });

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
      const container = scrollableContainerRef?.current ?? containerRef.current;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, scrollIntoViewControl]);

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

  function getNextFocusTarget(): null | HTMLElement {
    if (containerRef.current) {
      const highlightedIndex = items.findIndex((item) => item.highlighted);
      const buttons: HTMLButtonElement[] = Array.from(containerRef.current.querySelectorAll(`.${styles.item}`));
      return buttons[highlightedIndex] ?? buttons[0];
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

  const isDual = position.startsWith("bottom-");
  const isBottom = position.startsWith("bottom");

  return (
    <SingleTabStopNavigationProvider
      ref={navigationAPI}
      navigationActive={true}
      getNextFocusTarget={() => getNextFocusTarget()}
      onUnregisterActive={(element: HTMLElement) => onUnregisterActive(element, navigationAPI)}
    >
      <div
        role="toolbar"
        aria-label={ariaLabel}
        onMouseEnter={() => (isMouseInContainer.current = true)}
        onMouseLeave={() => (isMouseInContainer.current = false)}
        className={clsx({
          [styles["legend-dual-group"]]: isDual,
        })}
      >
        {title && (
          <Box
            fontWeight="bold"
            className={testClasses.title}
            textAlign={position === "bottom-opposite" ? "right" : "left"}
          >
            {title}
          </Box>
        )}
        <div
          // The list element is not focusable. However, the focus lands on it regardless, when testing in Firefox.
          // Setting the tab index to -1 does fix the problem.
          tabIndex={-1}
          ref={containerRef}
          style={{
            overflow: "auto",
            maxBlockSize: isBottom && bottomMaxHeight ? `${bottomMaxHeight}px` : undefined,
          }}
          className={clsx(styles.list, {
            [styles["list-bottom"]]: isBottom,
            [styles["list-side"]]: position === "side",
            [styles["list-bottom-opposite"]]: position === "bottom-opposite",
          })}
        >
          {actions && (
            <div
              className={clsx(testClasses.actions, styles.actions, {
                [styles["actions-bottom"]]: isBottom,
                [styles["actions-side"]]: position === "side",
              })}
            >
              {actions}
              <div
                className={clsx({
                  [styles["legend-divider-bottom"]]: isBottom,
                  [styles["legend-divider-side"]]: position === "side",
                })}
              />
            </div>
          )}
          {renderedItems}
        </div>
      </div>
    </SingleTabStopNavigationProvider>
  );
};

interface LegendItemTriggerProps {
  isHighlighted?: boolean;
  itemId: string;
  label: string;
  marker?: React.ReactNode;
  actions?: React.ReactNode;
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

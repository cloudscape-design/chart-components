// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useRef, useState } from "react";
import type Highcharts from "highcharts";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";
import LiveRegion from "@cloudscape-design/components/live-region";

import { fireNonCancelableEvent, NonCancelableEventHandler } from "../../internal/events";
import { getFormatter } from "../formatters";
import { ZoomChangeDetail, ZoomOptions, ZoomRange } from "./interfaces";
import ZoomControls, { FocusableRef } from "./zoom-controls";
import {
  applyPosition,
  applyRect,
  getBandRect,
  getClusterRect,
  getDividerRect,
  isInsidePlot,
  isPixelForward,
  isXAxisHorizontal,
  pixelToValue,
} from "./zoom-geometry";
import { useZoomI18n, ZoomI18nStrings } from "./zoom-i18n";
import ZoomOverlay, { PixelDirection, ZoomOverlayRefs } from "./zoom-overlay";
import {
  canZoomInto,
  getInteraction,
  getOverlayView,
  getPress,
  IDLE_ZOOM_STATE,
  ZoomAnnouncement,
  ZoomEffect,
  ZoomEvent,
  ZoomFocusTarget,
  ZoomInteraction,
  zoomReducer,
  ZoomState,
} from "./zoom-state-machine";
import { findNearestIndex, getPageStep, getSeriesMinRange, getVisibleXValues, SeriesOptionsLike } from "./zoom-values";

// How far the pointer must travel before a press is treated as a drag. Shorter movements are treated as
// clicks: they must not commit a zoom, both because an accidental one-pixel drag would zoom into a single
// point, and because in zoom mode a click sets the range boundary.
const DRAG_THRESHOLD = 10;

interface ZoomExtremes {
  min: number;
  max: number;
}

interface UseChartZoomProps {
  zoom?: ZoomOptions;
  zoomRange?: ZoomRange | null;
  onZoomRangeChange?: NonCancelableEventHandler<ZoomChangeDetail>;
  i18nStrings?: ZoomI18nStrings;
  // Series options, used to derive the axis minRange. Taken from the options rather than from the chart,
  // because the value is needed to render the chart in the first place.
  series: undefined | readonly SeriesOptionsLike[];
  inverted: boolean;
  isRtl: boolean;
  // The chart's root element, used to tell focus moving within the chart from focus leaving it.
  rootRef: React.RefObject<HTMLElement>;
}

export interface ChartZoom {
  // True when zooming is enabled with the zoom property.
  enabled: boolean;
  // True while the Highcharts tooltip must not open: during a range selection the pointer sets the range
  // boundaries, and a tooltip following it would only get in the way.
  tooltipSuppressed: boolean;
  // Props for the element wrapping the plot, which hosts the drag interaction and the overlay.
  plotProps: React.HTMLAttributes<HTMLDivElement>;
  // Merges the zoomed range into the first x axis' options.
  getXAxisZoomOptions: (xAxisOptions: Highcharts.XAxisOptions) => Highcharts.XAxisOptions;
  // Called from the chart's render event: the visible values, the cursor, and the overlay geometry all
  // depend on what Highcharts has just drawn.
  onChartRender: (chart: Highcharts.Chart) => void;
  // Brings the zoom state in line with what the chart is currently showing: the cursor position, the
  // overlay geometry, and whether there is still a range left to zoom into. The caller invokes it from an
  // effect that runs after the chart has settled for this render, which includes the series visibility the
  // chart API applies from its own effect. Reconciling from an effect declared inside this hook would run
  // too early and miss that update.
  reconcileAfterRender: () => void;
  // Set by the chart to the function that dismisses the highlighted point and its tooltip.
  clearHighlightRef: React.MutableRefObject<() => void>;
  controls: null | React.ReactNode;
  overlay: null | React.ReactNode;
  liveRegion: null | React.ReactNode;
  // The zoom actions exposed on the components' refs.
  enterZoomMode: () => void;
  exitZoomMode: () => void;
  resetZoom: () => void;
}

// Zooming into a range of the x axis, by dragging across the plot, by setting the range boundaries with a
// click or a tap, or with the keyboard. The three paths are equivalent, which is what WCAG 2.5.7 requires:
// no functionality may depend on dragging.
//
// The interaction itself is a state machine, defined in zoom-state-machine: every button, key, and pointer
// event below turns into one of its events, and this hook carries out what the machine decides. What is
// left here is the part that needs the chart, the DOM, and React: resolving stops to values, drawing the
// overlay, moving focus, and holding the zoomed range.
//
// The zoom lives in the core chart, so that all charts built on top of it can offer zooming, and so that
// consumers of the core chart get it too.
export function useChartZoom({
  zoom,
  zoomRange,
  onZoomRangeChange,
  i18nStrings,
  series,
  inverted,
  isRtl,
  rootRef,
}: UseChartZoomProps): ChartZoom {
  const i18n = useZoomI18n(i18nStrings);
  const enabled = zoom?.enabled ?? false;

  // Only these four values live in React state, because a state update re-renders the chart, and
  // re-rendering the chart re-initializes the Highcharts axes. Everything that happens per pointer event or
  // per keystroke is applied to the DOM directly instead.
  const [interaction, setInteraction] = useState<ZoomInteraction>("idle");
  const [localExtremes, setLocalExtremes] = useState<null | ZoomExtremes>(null);
  const [canZoom, setCanZoom] = useState(true);
  const [announcement, setAnnouncement] = useState("");

  // The machine's state is held in a ref, and React only gets the part of it that it renders from. The ref
  // is what the imperative overlay updates read, so that they see a transition without waiting for a render.
  const stateRef = useRef<ZoomState>(IDLE_ZOOM_STATE);
  const chartRef = useRef<null | Highcharts.Chart>(null);
  // The x values the cursor can land on. Recomputed on demand after every chart render rather than on
  // every step: with a large series, walking all points per keystroke is what made keyboard zooming
  // unusable, and Highcharts crops the series data to the visible window, so it cannot be cached once.
  const valuesRef = useRef<number[]>([]);
  const valuesStaleRef = useRef(true);
  // Where focus must go once the current render commits. Focus is moved after the render, because the
  // element to focus often only appears as a result of the state change that requested the move.
  const pendingFocusRef = useRef<null | ZoomFocusTarget>(null);
  const clearHighlightRef = useRef<() => void>(() => {});
  const zoomButtonRef = useRef<FocusableRef>(null);
  const resetButtonRef = useRef<FocusableRef>(null);
  const overlayRefs: ZoomOverlayRefs = {
    band: useRef<HTMLDivElement>(null),
    startDivider: useRef<HTMLDivElement>(null),
    endDivider: useRef<HTMLDivElement>(null),
    cursor: useRef<HTMLDivElement>(null),
    cluster: useRef<HTMLDivElement>(null),
    previousButton: useRef<HTMLButtonElement>(null),
    nextButton: useRef<HTMLButtonElement>(null),
  };

  // The range is controlled when the property is defined, including when it is null, which is how a
  // controlled chart expresses "show the full data range".
  const controlled = zoomRange !== undefined;
  const extremes = controlled ? extremesFromRange(zoomRange) : localExtremes;
  const zoomed = extremes !== null;
  const active = interaction === "cursor";
  const minRange = useMemo(() => (enabled ? getSeriesMinRange(series) : undefined), [enabled, series]);

  function getValues(): number[] {
    if (valuesStaleRef.current) {
      valuesRef.current = chartRef.current ? getVisibleXValues(chartRef.current) : [];
      valuesStaleRef.current = false;
    }
    return valuesRef.current;
  }

  function getXAxis(): null | Highcharts.Axis {
    // The axis instance is replaced whenever the chart updates, which happens on every React render, so
    // it is always read from the chart instead of being held on to.
    return chartRef.current?.xAxis?.[0] ?? null;
  }

  function formatValue(value: number): string {
    return getFormatter(getXAxis() ?? undefined)(value);
  }

  // Every zoom interaction goes through here: the machine decides the next state and what has to happen for
  // it, and this is the only place that carries those decisions out.
  function dispatch(event: ZoomEvent) {
    const previous = stateRef.current;
    const { state, effects } = zoomReducer(previous, event, { valuesCount: getValues().length });
    if (state === previous && effects.length === 0) {
      // The event means nothing in this state, so nothing has to be drawn or announced either.
      return;
    }
    // The ref is updated before anything else, because the effects and the overlay update below run in the
    // same event and must already see the new state.
    stateRef.current = state;
    const nextInteraction = getInteraction(state);
    if (nextInteraction !== getInteraction(previous)) {
      // The only render an interaction causes, and it is needed: what the controls show, and whether the
      // tooltip may follow the pointer, both depend on it. The cursor and the selection are drawn onto the
      // overlay instead, so that stepping through a large series does not re-render, and therefore does not
      // re-initialize the chart, per step.
      setInteraction(nextInteraction);
    }
    for (const effect of effects) {
      runEffect(effect);
    }
    syncOverlay();
  }

  function runEffect(effect: ZoomEffect) {
    switch (effect.type) {
      case "clearHighlight":
        clearHighlightRef.current();
        break;
      case "announce":
        setAnnouncement(describeAnnouncement(effect.announcement));
        break;
      case "focus":
        pendingFocusRef.current = effect.target;
        break;
      case "applyZoom": {
        const values = getValues();
        const fromValue = values[effect.fromIndex];
        const toValue = values[effect.toIndex];
        if (fromValue === undefined || toValue === undefined) {
          // The stops the selection was made on are gone, for instance because the series were filtered
          // while it was in progress. There is no range left to apply.
          break;
        }
        const min = Math.min(fromValue, toValue);
        const max = Math.max(fromValue, toValue);
        valuesStaleRef.current = true;
        if (!controlled) {
          setLocalExtremes({ min, max });
        }
        setAnnouncement(i18n.zoomRangeChangeAnnouncementText(formatValue(min), formatValue(max)));
        fireNonCancelableEvent(onZoomRangeChange, { zoomRange: { x: { startValue: min, endValue: max } } });
        break;
      }
      case "resetZoom":
        valuesStaleRef.current = true;
        if (!controlled) {
          setLocalExtremes(null);
        }
        setAnnouncement(i18n.zoomResetAnnouncementText);
        fireNonCancelableEvent(onZoomRangeChange, { zoomRange: null });
        break;
    }
  }

  function describeAnnouncement(announcement: ZoomAnnouncement): string {
    const values = getValues();
    switch (announcement.type) {
      case "zoomModeEntered":
        return i18n.zoomModeEnteredAnnouncementText(formatValue(values[announcement.index]));
      case "startPointSet":
        return i18n.zoomStartPointAnnouncementText(formatValue(values[announcement.index]));
      case "zoomModeExited":
        return i18n.zoomModeExitedAnnouncementText;
    }
  }

  // Draws the current state onto the overlay, and describes the cursor to assistive technology. Called
  // after every transition and after every chart render.
  function syncOverlay() {
    const chart = chartRef.current;
    const xAxis = getXAxis();
    const values = getValues();
    const view = getOverlayView(stateRef.current);
    if (!chart || !xAxis || values.length === 0 || view.type === "hidden") {
      hideOverlay();
      return;
    }
    if (view.type === "range") {
      const fromValue = values[view.fromIndex];
      const toValue = values[view.toIndex];
      applyRect(overlayRefs.band.current, getBandRect(chart, xAxis, fromValue, toValue));
      applyRect(overlayRefs.startDivider.current, getDividerRect(chart, xAxis, fromValue));
      applyRect(overlayRefs.endDivider.current, getDividerRect(chart, xAxis, toValue));
      // The cursor is kept visible while it holds focus: hiding a focused element moves focus to the
      // document body, which would cancel the interaction the drag is part of. It coincides with the
      // drag's trailing boundary, which is where the cursor would be after the same selection by keyboard.
      const cursorFocused = !!overlayRefs.cursor.current && overlayRefs.cursor.current === document.activeElement;
      applyRect(overlayRefs.cursor.current, cursorFocused ? getDividerRect(chart, xAxis, toValue) : null);
      applyPosition(overlayRefs.cluster.current, null);
      return;
    }
    const cursorValue = values[view.cursorIndex];
    const anchorIndex = view.anchorIndex;
    applyRect(overlayRefs.cursor.current, getDividerRect(chart, xAxis, cursorValue));
    applyPosition(overlayRefs.cluster.current, getClusterRect(chart, xAxis, cursorValue, measureCluster()));
    applyRect(overlayRefs.endDivider.current, null);
    if (anchorIndex === null) {
      applyRect(overlayRefs.band.current, null);
      applyRect(overlayRefs.startDivider.current, null);
    } else {
      const anchorValue = values[anchorIndex];
      applyRect(overlayRefs.band.current, getBandRect(chart, xAxis, anchorValue, cursorValue));
      applyRect(overlayRefs.startDivider.current, getDividerRect(chart, xAxis, anchorValue));
    }
    // The cursor is a slider, so its position is announced from its own value as it moves. That keeps
    // stepping free of React renders, which is what makes the cursor usable in large series.
    const cursor = overlayRefs.cursor.current;
    if (cursor) {
      cursor.setAttribute("aria-valuemin", `${values[0]}`);
      cursor.setAttribute("aria-valuemax", `${values[values.length - 1]}`);
      cursor.setAttribute("aria-valuenow", `${cursorValue}`);
      cursor.setAttribute(
        "aria-valuetext",
        anchorIndex === null
          ? i18n.zoomCursorPositionAnnouncementText(formatValue(cursorValue))
          : i18n.zoomSelectionAnnouncementText(formatValue(values[anchorIndex]), formatValue(cursorValue)),
      );
    }
  }

  function hideOverlay() {
    applyRect(overlayRefs.band.current, null);
    applyRect(overlayRefs.startDivider.current, null);
    applyRect(overlayRefs.endDivider.current, null);
    applyRect(overlayRefs.cursor.current, null);
    applyPosition(overlayRefs.cluster.current, null);
  }

  // The cluster sizes itself from its contents, so it is measured rather than given a size. It keeps its
  // layout box while hidden, which is why the measurement is available before it is first shown.
  function measureCluster() {
    const cluster = overlayRefs.cluster.current;
    return { width: cluster?.offsetWidth ?? 0, height: cluster?.offsetHeight ?? 0 };
  }

  function applyPendingFocus() {
    const target = pendingFocusRef.current;
    if (target === null) {
      return;
    }
    pendingFocusRef.current = null;
    if (target === "cursor") {
      overlayRefs.cursor.current?.focus();
      return;
    }
    // The reset button is the natural place to land after zooming, but it is not rendered when the chart
    // is controlled with hidden buttons. Focus then falls back to whatever the chart does offer, so that
    // it never ends up on the document body.
    const candidates =
      target === "resetButton" ? [resetButtonRef.current, zoomButtonRef.current] : [zoomButtonRef.current];
    for (const candidate of candidates) {
      if (candidate) {
        candidate.focus();
        return;
      }
    }
    const application = rootRef.current?.querySelector<HTMLElement>('[role="application"]');
    application?.focus();
  }

  function enterZoomMode() {
    const xAxis = getXAxis();
    const values = getValues();
    if (!enabled || !xAxis) {
      return;
    }
    // The cursor always starts at the visible start of the plot, whichever way the axis runs, so that
    // repeated zooming behaves the same regardless of how the previous range was selected.
    dispatch({ type: "enterZoomMode", startIndex: isPixelForward(xAxis, values) ? 0 : values.length - 1 });
  }

  function exitZoomMode({ withFocus }: { withFocus: boolean }) {
    dispatch({ type: "exitZoomMode", moveFocus: withFocus });
  }

  function resetZoom({ withFocus }: { withFocus: boolean }) {
    dispatch({ type: "resetZoom", zoomed, moveFocus: withFocus });
  }

  // Moves the cursor by the given number of stops towards the start or the end of the plot on screen. The
  // direction is expressed in pixels and translated to a value step here, so that the arrow keys and the
  // step buttons follow the plot in inverted charts, on reversed axes, and in right-to-left pages.
  function stepCursor(direction: PixelDirection, stops = 1) {
    const xAxis = getXAxis();
    const values = getValues();
    if (!xAxis || values.length === 0) {
      return;
    }
    dispatch({ type: "stepCursor", offset: (isPixelForward(xAxis, values) ? 1 : -1) * direction * stops });
  }

  function moveCursorToEdge(direction: PixelDirection) {
    const xAxis = getXAxis();
    const values = getValues();
    if (!xAxis || values.length === 0) {
      return;
    }
    const atStart = isPixelForward(xAxis, values) === (direction === -1);
    dispatch({ type: "moveCursorToEdge", edge: atStart ? "first" : "last" });
  }

  function onCursorKeyDown(event: React.KeyboardEvent) {
    const xAxis = getXAxis();
    if (!xAxis || getInteraction(stateRef.current) !== "cursor") {
      return;
    }
    // On an inverted chart the x axis runs vertically, and so does the cursor. Only the arrow pair that
    // runs along the axis moves the cursor; the perpendicular pair is left to the page.
    const vertical = !isXAxisHorizontal(xAxis);
    const backwardKey = vertical ? KeyCode.up : KeyCode.left;
    const forwardKey = vertical ? KeyCode.down : KeyCode.right;
    const pageStop = getPageStep(getValues().length);
    let handled = true;
    switch (event.keyCode) {
      case backwardKey:
        stepCursor(-1);
        break;
      case forwardKey:
        stepCursor(1);
        break;
      case KeyCode.pageUp:
        stepCursor(1, pageStop);
        break;
      case KeyCode.pageDown:
        stepCursor(-1, pageStop);
        break;
      case KeyCode.home:
        moveCursorToEdge(-1);
        break;
      case KeyCode.end:
        moveCursorToEdge(1);
        break;
      case KeyCode.enter:
      case KeyCode.space:
        dispatch({ type: "commitPoint" });
        break;
      case KeyCode.escape:
        exitZoomMode({ withFocus: true });
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      // The chart listens for Escape on the document to dismiss the tooltip, and the page may bind keys
      // of its own. Neither should also act on a key the cursor has just used.
      event.stopPropagation();
    }
  }

  function onCursorBlur(event: React.FocusEvent) {
    const nextTarget = event.relatedTarget;
    // Focus moving within the chart, for instance onto the exit button, is that control's business.
    // Focus leaving the chart altogether, or going nowhere at all, ends the interaction.
    if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) {
      return;
    }
    exitZoomMode({ withFocus: false });
  }

  function getChartCoordinates(chart: Highcharts.Chart, event: React.PointerEvent) {
    const position = chart.pointer.getChartPosition();
    return {
      chartX: (event.clientX - position.left) / position.scaleX,
      chartY: (event.clientY - position.top) / position.scaleY,
    };
  }

  function onPlotPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const chart = chartRef.current;
    const xAxis = getXAxis();
    const values = getValues();
    if (!chart || !xAxis || values.length === 0) {
      return;
    }
    // Secondary mouse buttons open context menus and must not start a selection.
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    // The cursor buttons sit on top of the plot and handle their own presses.
    if (event.target instanceof Node && overlayRefs.cluster.current?.contains(event.target)) {
      return;
    }
    const { chartX, chartY } = getChartCoordinates(chart, event);
    if (!isInsidePlot(chart, chartX, chartY)) {
      return;
    }
    const inZoomMode = getInteraction(stateRef.current) === "cursor";
    const index = findNearestIndex(values, pixelToValue(xAxis, chartX, chartY));
    dispatch({
      type: "pointerDown",
      press: {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        startIndex: index,
        currentIndex: index,
      },
    });
    capturePointer(event.currentTarget, event.pointerId);
    if (inZoomMode) {
      // In zoom mode the press belongs to the range selection: it must not move focus off the cursor,
      // which would end the selection. Outside zoom mode the press is left alone, so that clicking the
      // chart still selects a point.
      event.preventDefault();
    }
  }

  function onPlotPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const chart = chartRef.current;
    const xAxis = getXAxis();
    const state = stateRef.current;
    // The pointer moves over the plot constantly, and only a press or a selection has any use for it.
    if (!chart || !xAxis || state.type === "idle") {
      return;
    }
    const values = getValues();
    if (values.length === 0) {
      return;
    }
    const press = getPress(state);
    const { chartX, chartY } = getChartCoordinates(chart, event);
    const distance = press ? travelledAlongAxis(xAxis, event, press.clientX, press.clientY) : 0;
    dispatch({
      type: "pointerMove",
      pointerId: event.pointerId,
      index: findNearestIndex(values, pixelToValue(xAxis, chartX, chartY)),
      passedThreshold: distance >= DRAG_THRESHOLD,
      insidePlot: isInsidePlot(chart, chartX, chartY),
    });
  }

  function onPlotPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    releasePointer(event.currentTarget, event.pointerId);
    dispatch({ type: "pointerUp", pointerId: event.pointerId });
  }

  function onPlotPointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    releasePointer(event.currentTarget, event.pointerId);
    dispatch({ type: "pointerCancel", pointerId: event.pointerId });
  }

  // Called from the chart's render event, which Highcharts fires from within the effect that updates the
  // chart. Only refs are touched here: a state update at this point would re-render the chart, and
  // re-rendering re-initializes its SVG, discarding what Highcharts has just drawn. Everything that needs
  // state is deferred to reconcileAfterRender, which runs right after.
  function onChartRender(chart: Highcharts.Chart) {
    if (!enabled) {
      return;
    }
    chartRef.current = chart;
    // What the cursor can land on depends on the extremes and on which series are visible, both of which
    // this render may have changed.
    valuesStaleRef.current = true;
  }

  // Called from an effect after every render, see ChartZoom.reconcileAfterRender.
  function reconcileAfterRender() {
    if (!enabled) {
      return;
    }
    const values = getValues();
    dispatch({ type: "chartRendered" });
    // The state may be unchanged while the geometry underneath it moved, so the overlay is drawn again
    // regardless of what the render event above decided.
    syncOverlay();
    applyPendingFocus();
    const nextCanZoom = canZoomInto(values.length);
    if (nextCanZoom !== canZoom) {
      setCanZoom(nextCanZoom);
    }
  }

  return {
    enabled,
    tooltipSuppressed: enabled && interaction !== "idle",
    plotProps: enabled
      ? {
          onPointerDown: onPlotPointerDown,
          onPointerMove: onPlotPointerMove,
          onPointerUp: onPlotPointerUp,
          onPointerCancel: onPlotPointerCancel,
          // A drag across the plot must not select the text around it.
          style: { userSelect: "none" },
        }
      : {},
    getXAxisZoomOptions: (xAxisOptions) =>
      enabled
        ? {
            minRange,
            // Highcharts reads null as "no bound", so the zoomed range can be cleared by rendering the
            // axis without one, falling back to the bounds the consumer defined.
            min: extremes ? extremes.min : (xAxisOptions.min ?? null),
            max: extremes ? extremes.max : (xAxisOptions.max ?? null),
          }
        : {},
    onChartRender,
    reconcileAfterRender,
    clearHighlightRef,
    controls:
      enabled && !zoom?.hideButtons ? (
        <ZoomControls
          i18n={i18n}
          active={active}
          zoomed={zoomed}
          canZoom={canZoom}
          zoomButtonRef={zoomButtonRef}
          resetButtonRef={resetButtonRef}
          onEnterZoomMode={enterZoomMode}
          onExitZoomMode={() => exitZoomMode({ withFocus: true })}
          onResetZoom={() => resetZoom({ withFocus: true })}
        />
      ) : null,
    overlay: enabled ? (
      <ZoomOverlay
        refs={overlayRefs}
        i18n={i18n}
        vertical={inverted}
        isRtl={isRtl}
        onKeyDown={onCursorKeyDown}
        onBlur={onCursorBlur}
        onStep={stepCursor}
        onCommit={() => dispatch({ type: "commitPoint" })}
      />
    ) : null,
    liveRegion: enabled ? <LiveRegion hidden={true}>{announcement}</LiveRegion> : null,
    enterZoomMode,
    exitZoomMode: () => exitZoomMode({ withFocus: false }),
    resetZoom: () => resetZoom({ withFocus: false }),
  };
}

function extremesFromRange(zoomRange: undefined | null | ZoomRange): null | ZoomExtremes {
  const x = zoomRange?.x;
  return x ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) } : null;
}

// How far the pointer has travelled from where it went down, along the axis the selection runs on. Movement
// across the axis is ignored: it does not change the range, and counting it would turn a shaky click into a
// drag.
function travelledAlongAxis(xAxis: Highcharts.Axis, event: React.PointerEvent, clientX: number, clientY: number) {
  return isXAxisHorizontal(xAxis) ? Math.abs(event.clientX - clientX) : Math.abs(event.clientY - clientY);
}

// Capturing the pointer keeps a drag alive when the pointer leaves the plot, and delivers its end even
// then. Both calls are feature-detected, because the pointer capture API is missing from jsdom, which is
// what consumers test their charts in; without it a drag simply ends where it leaves the plot.
function capturePointer(element: HTMLElement, pointerId: number) {
  element.setPointerCapture?.(pointerId);
}

function releasePointer(element: HTMLElement, pointerId: number) {
  if (element.hasPointerCapture?.(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ZOOM_POINTS } from "./zoom-values";

/**
 * The zoom interaction as a finite state machine.
 *
 * Selecting a range is a small interaction with many entry points: three buttons, eight keys, the pointer,
 * and the chart re-rendering underneath it. The states and the transitions between them are therefore
 * spelled out here, separately from the React and Highcharts plumbing that carries them out. This module is
 * pure: it holds no chart, measures nothing, and deals only in indices into the list of x values the cursor
 * can sit on. The hook resolves those indices to values, draws them, and moves focus.
 *
 *                          enterZoomMode
 *        +-------------------------------------------------+
 *        |                                                 v
 *    +------+                                        +-----------+ --+ stepCursor, moveCursorToEdge,
 *    |      |   exitZoomMode, resetZoom, and         |           |   | pointerMove, and the commitPoint
 *    | idle | <------------------------------------- | selecting | <-+ that sets the range start
 *    |      |   the commitPoint that applies a zoom  |           |
 *    +------+                                        +-----------+
 *        |  ^                                          |  ^
 *        |  | pointerDown, and the pointerUp that       |  | pointerDown, and the pointerUp that
 *        |  | ends a click the chart has handled        |  | sets a boundary where the click landed
 *        v  |                                          v  |
 *    +---------------------------------------------------------+
 *    |                         pressed                         |
 *    |  A press that has not travelled yet, and may still turn |
 *    |  out to be a click.                                     |
 *    +---------------------------------------------------------+
 *        |
 *        | the pointer travels past the drag threshold
 *        v
 *    +----------+ --> idle, applying the zoom, when the drag was wide enough
 *    | dragging |
 *    +----------+ --> back to where the press started from, on a pointerCancel or on a
 *                     drag too narrow to zoom into
 *
 * Both pointer states carry the selection they interrupted, so that a press over a chart in zoom mode
 * returns to that selection, while a press over a chart outside zoom mode returns to idle.
 */

/** The two boundaries of a range being selected. The range is complete once the anchor is set. */
export interface ZoomSelection {
  // Where the cursor is, which is the boundary the next commit sets.
  cursorIndex: number;
  // Where the range starts, or null while no start point has been set.
  anchorIndex: null | number;
}

/** A pointer being held down over the plot. */
export interface ZoomPress {
  pointerId: number;
  // Where the pointer went down, in client coordinates. The hook measures the travel from here against the
  // drag threshold, because only it knows which way the axis runs on screen.
  clientX: number;
  clientY: number;
  // The stop the press started on, and the one under the pointer now. They are equal until the press turns
  // into a drag.
  startIndex: number;
  currentIndex: number;
}

interface IdleState {
  type: "idle";
}

interface SelectingState {
  type: "selecting";
  selection: ZoomSelection;
}

interface PressedState {
  type: "pressed";
  press: ZoomPress;
  // The selection the press interrupted, or null when the press started outside zoom mode.
  resume: null | ZoomSelection;
}

interface DraggingState {
  type: "dragging";
  press: ZoomPress;
  resume: null | ZoomSelection;
}

export type ZoomState = IdleState | SelectingState | PressedState | DraggingState;

export const IDLE_ZOOM_STATE: ZoomState = { type: "idle" };

export type ZoomEvent =
  // The "Zoom" button, the chart API, and a shortcut all start a selection at the stop the hook picks: the
  // visible start of the plot, whichever way the axis runs.
  | { type: "enterZoomMode"; startIndex: number }
  // The "Exit zoom" button, Escape, the chart API, and focus leaving the chart.
  | { type: "exitZoomMode"; moveFocus: boolean }
  // The "Reset" button and the chart API. Whether there is a zoom to reset is the hook's to know, because
  // the range may be controlled by the consumer.
  | { type: "resetZoom"; zoomed: boolean; moveFocus: boolean }
  // The arrow keys, Page Up/Down, and the cursor's step buttons. The offset is already expressed in stops
  // along the value axis, with the direction on screen resolved by the hook.
  | { type: "stepCursor"; offset: number }
  // Home and End.
  | { type: "moveCursorToEdge"; edge: "first" | "last" }
  // Enter, Space, the commit button, and a click on the plot.
  | { type: "commitPoint" }
  | { type: "pointerDown"; press: ZoomPress }
  | {
      type: "pointerMove";
      pointerId: number;
      // The stop nearest to the pointer.
      index: number;
      // Whether the pointer has travelled far enough from where it went down to count as a drag.
      passedThreshold: boolean;
      insidePlot: boolean;
    }
  | { type: "pointerUp"; pointerId: number }
  | { type: "pointerCancel"; pointerId: number }
  // The chart has re-rendered: the stops the cursor can sit on change with the zoomed range and with which
  // series are visible.
  | { type: "chartRendered" };

/** Where focus must go once the transition has been rendered. */
export type ZoomFocusTarget = "cursor" | "zoomButton" | "resetButton";

export type ZoomAnnouncement =
  | { type: "zoomModeEntered"; index: number }
  | { type: "startPointSet"; index: number }
  | { type: "zoomModeExited" };

/**
 * What the hook must do for a transition, beyond drawing the new state. The two zoom commands each also
 * announce their outcome, which the hook words from the values they resolve to.
 */
export type ZoomEffect =
  // Dismiss the highlighted point and its tooltip, which the selection is taking the plot over from.
  | { type: "clearHighlight" }
  | { type: "announce"; announcement: ZoomAnnouncement }
  | { type: "focus"; target: ZoomFocusTarget }
  // Zoom into the range between two stops.
  | { type: "applyZoom"; fromIndex: number; toIndex: number }
  // Show the full range again. Only emitted for a chart that is zoomed in.
  | { type: "resetZoom" };

export interface ZoomTransition {
  state: ZoomState;
  effects: readonly ZoomEffect[];
}

export interface ZoomContext {
  // How many stops the cursor can sit on, as of the chart's last render.
  valuesCount: number;
}

/**
 * The next state and what has to happen for it. An event that means nothing in the current state returns
 * that same state, with no effects: the hook can then skip the work a transition would cause.
 */
export function zoomReducer(state: ZoomState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  switch (state.type) {
    case "idle":
      return fromIdle(state, event, context);
    case "selecting":
      return fromSelecting(state, event, context);
    case "pressed":
      return fromPressed(state, event, context);
    case "dragging":
      return fromDragging(state, event, context);
  }
}

function fromIdle(state: IdleState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  switch (event.type) {
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "resetZoom":
      return resetZoom(event);
    case "pointerDown":
      // Outside zoom mode a press is only watched in case it becomes a drag. Until then the chart keeps
      // behaving as it did, so that a click still selects a point.
      return stay({ type: "pressed", press: event.press, resume: null });
    default:
      return stay(state);
  }
}

function fromSelecting(state: SelectingState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  const { valuesCount } = context;
  switch (event.type) {
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "exitZoomMode":
      return exitZoomMode(event.moveFocus);
    case "resetZoom":
      return resetZoom(event);
    case "stepCursor":
      return moveCursor(state, state.selection.cursorIndex + event.offset, valuesCount);
    case "moveCursorToEdge":
      return moveCursor(state, event.edge === "first" ? 0 : valuesCount - 1, valuesCount);
    case "commitPoint":
      return commitPoint(state.selection, context);
    case "pointerDown":
      return stay({ type: "pressed", press: event.press, resume: state.selection });
    case "pointerMove":
      // With no press in progress the cursor follows the pointer, so that a click sets the boundary the
      // cursor is showing. Outside the plot the cursor stays where it is.
      return event.insidePlot ? moveCursor(state, event.index, valuesCount) : stay(state);
    case "chartRendered":
      return reconcile(state, context);
    default:
      return stay(state);
  }
}

function fromPressed(state: PressedState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  const { press, resume } = state;
  switch (event.type) {
    case "pointerMove":
      if (event.pointerId !== press.pointerId || !event.passedThreshold) {
        // Below the threshold the press is still a candidate click, and the cursor stays where it is, so
        // that releasing sets the boundary the cursor is showing.
        return stay(state);
      }
      return transition({ type: "dragging", press: { ...press, currentIndex: event.index }, resume }, [
        { type: "clearHighlight" },
      ]);
    case "pointerUp": {
      if (event.pointerId !== press.pointerId) {
        return stay(state);
      }
      if (!resume) {
        // Outside zoom mode the chart has already handled the click.
        return stay(IDLE_ZOOM_STATE);
      }
      // In zoom mode a press that did not travel is a click, which sets a range boundary where it landed.
      const cursorIndex = clampIndex(press.startIndex, context.valuesCount);
      return commitPoint({ cursorIndex, anchorIndex: resume.anchorIndex }, context);
    }
    case "pointerCancel":
      return event.pointerId === press.pointerId ? stay(resumeState(resume)) : stay(state);
    case "pointerDown":
      // A new press supersedes the one in progress, and inherits the selection it was interrupting.
      return stay({ type: "pressed", press: event.press, resume });
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "exitZoomMode":
      // Outside zoom mode there is nothing to exit, and the press is left to run its course.
      return resume ? exitZoomMode(event.moveFocus) : stay(state);
    case "resetZoom":
      return resetZoom(event);
    case "chartRendered":
      return reconcile(state, context);
    default:
      return stay(state);
  }
}

function fromDragging(state: DraggingState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  const { press, resume } = state;
  switch (event.type) {
    case "pointerMove":
      if (event.pointerId !== press.pointerId || event.index === press.currentIndex) {
        return stay(state);
      }
      return stay({ type: "dragging", press: { ...press, currentIndex: event.index }, resume });
    case "pointerUp": {
      if (event.pointerId !== press.pointerId) {
        return stay(state);
      }
      if (!isZoomableRange(press.startIndex, press.currentIndex)) {
        // A drag too narrow to zoom into is discarded, and the interaction returns to where it started.
        return stay(resumeState(resume));
      }
      const effects: ZoomEffect[] = [{ type: "applyZoom", fromIndex: press.startIndex, toIndex: press.currentIndex }];
      // Focus only follows the zoom when the drag started in zoom mode, where the cursor holds it and is
      // about to be hidden. A drag started outside zoom mode was driven by the pointer alone.
      if (resume) {
        effects.push({ type: "focus", target: "resetButton" });
      }
      return transition(IDLE_ZOOM_STATE, effects);
    }
    case "pointerCancel":
      return event.pointerId === press.pointerId ? stay(resumeState(resume)) : stay(state);
    case "pointerDown":
      return stay({ type: "pressed", press: event.press, resume });
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "exitZoomMode":
      return exitZoomMode(event.moveFocus);
    case "resetZoom":
      return resetZoom(event);
    case "chartRendered":
      return reconcile(state, context);
    default:
      return stay(state);
  }
}

// Entering zoom mode starts a new selection at the given stop, dropping whatever was selected before.
function enterZoomMode(state: ZoomState, startIndex: number, { valuesCount }: ZoomContext): ZoomTransition {
  if (!canZoomInto(valuesCount)) {
    return stay(state);
  }
  const cursorIndex = clampIndex(startIndex, valuesCount);
  return transition({ type: "selecting", selection: { cursorIndex, anchorIndex: null } }, [
    { type: "clearHighlight" },
    { type: "announce", announcement: { type: "zoomModeEntered", index: cursorIndex } },
    { type: "focus", target: "cursor" },
  ]);
}

function exitZoomMode(moveFocus: boolean): ZoomTransition {
  const effects: ZoomEffect[] = [{ type: "announce", announcement: { type: "zoomModeExited" } }];
  if (moveFocus) {
    effects.push({ type: "focus", target: "zoomButton" });
  }
  return transition(IDLE_ZOOM_STATE, effects);
}

// Resetting ends the interaction from any state, but only a chart that is zoomed in has something to reset.
function resetZoom({ zoomed, moveFocus }: { zoomed: boolean; moveFocus: boolean }): ZoomTransition {
  if (!zoomed) {
    return stay(IDLE_ZOOM_STATE);
  }
  const effects: ZoomEffect[] = [{ type: "resetZoom" }];
  if (moveFocus) {
    effects.push({ type: "focus", target: "zoomButton" });
  }
  return transition(IDLE_ZOOM_STATE, effects);
}

// Sets the range start on the first commit and applies the zoom on the second, which is what a click, a tap
// on the commit button, and Enter all do.
function commitPoint(selection: ZoomSelection, { valuesCount }: ZoomContext): ZoomTransition {
  const selecting: ZoomState = { type: "selecting", selection };
  if (valuesCount === 0) {
    return stay(selecting);
  }
  const { cursorIndex, anchorIndex } = selection;
  if (anchorIndex === null) {
    return transition({ type: "selecting", selection: { cursorIndex, anchorIndex: cursorIndex } }, [
      { type: "announce", announcement: { type: "startPointSet", index: cursorIndex } },
    ]);
  }
  if (!isZoomableRange(anchorIndex, cursorIndex)) {
    // A range of a single point has no width, and the chart cannot display it. Rather than applying a zoom
    // that cannot be undone by zooming again, the start point is kept and restated.
    return transition(selecting, [{ type: "announce", announcement: { type: "startPointSet", index: anchorIndex } }]);
  }
  return transition(IDLE_ZOOM_STATE, [
    { type: "applyZoom", fromIndex: anchorIndex, toIndex: cursorIndex },
    { type: "focus", target: "resetButton" },
  ]);
}

// Brings the state in line with what the chart now shows.
function reconcile(state: ZoomState, { valuesCount }: ZoomContext): ZoomTransition {
  if (valuesCount === 0) {
    // Nothing left to select, for instance because all series were filtered out. A press that is not part
    // of a selection is left alone: it belongs to the chart, which is still there.
    return getInteraction(state) === "idle" ? stay(state) : exitZoomMode(false);
  }
  switch (state.type) {
    case "idle":
      return stay(state);
    case "selecting":
      return stay({ type: "selecting", selection: clampSelection(state.selection, valuesCount) });
    case "pressed":
      return stay({ ...state, resume: state.resume && clampSelection(state.resume, valuesCount) });
    case "dragging":
      return stay({ ...state, resume: state.resume && clampSelection(state.resume, valuesCount) });
  }
}

function moveCursor(state: SelectingState, index: number, valuesCount: number): ZoomTransition {
  if (valuesCount === 0) {
    return stay(state);
  }
  const cursorIndex = clampIndex(index, valuesCount);
  return stay(
    cursorIndex === state.selection.cursorIndex
      ? state
      : { type: "selecting", selection: { ...state.selection, cursorIndex } },
  );
}

function stay(state: ZoomState): ZoomTransition {
  return { state, effects: NO_EFFECTS };
}

function transition(state: ZoomState, effects: readonly ZoomEffect[]): ZoomTransition {
  return { state, effects };
}

const NO_EFFECTS: readonly ZoomEffect[] = [];

function resumeState(resume: null | ZoomSelection): ZoomState {
  return resume ? { type: "selecting", selection: resume } : IDLE_ZOOM_STATE;
}

function clampSelection(selection: ZoomSelection, valuesCount: number): ZoomSelection {
  return {
    cursorIndex: clampIndex(selection.cursorIndex, valuesCount),
    // A start point that is no longer in the plot cannot be zoomed into, so the selection starts over.
    anchorIndex: selection.anchorIndex !== null && selection.anchorIndex < valuesCount ? selection.anchorIndex : null,
  };
}

function clampIndex(index: number, valuesCount: number): number {
  return Math.min(Math.max(index, 0), Math.max(0, valuesCount - 1));
}

// A range must span at least two stops: a narrower one has no width, and the chart cannot display it.
function isZoomableRange(fromIndex: number, toIndex: number): boolean {
  return Math.abs(toIndex - fromIndex) + 1 >= MIN_ZOOM_POINTS;
}

// With two stops or fewer there is no narrower range left to select, so there is nothing to zoom into.
export function canZoomInto(valuesCount: number): boolean {
  return valuesCount > MIN_ZOOM_POINTS;
}

/**
 * What React must know about the state. Everything else is drawn imperatively, so that stepping the cursor
 * or dragging across the plot causes no render at all.
 */
export type ZoomInteraction = "idle" | "cursor" | "drag";

export function getInteraction(state: ZoomState): ZoomInteraction {
  switch (state.type) {
    case "idle":
      return "idle";
    case "selecting":
      return "cursor";
    // A press is invisible until it becomes a drag: it shows whatever it interrupted.
    case "pressed":
      return state.resume ? "cursor" : "idle";
    case "dragging":
      return "drag";
  }
}

/** What the overlay draws for the state. */
export type ZoomOverlayView =
  | { type: "hidden" }
  | { type: "cursor"; cursorIndex: number; anchorIndex: null | number }
  | { type: "range"; fromIndex: number; toIndex: number };

export function getOverlayView(state: ZoomState): ZoomOverlayView {
  switch (state.type) {
    case "idle":
      return HIDDEN_VIEW;
    case "selecting":
      return { type: "cursor", ...state.selection };
    case "pressed":
      return state.resume ? { type: "cursor", ...state.resume } : HIDDEN_VIEW;
    case "dragging":
      return { type: "range", fromIndex: state.press.startIndex, toIndex: state.press.currentIndex };
  }
}

const HIDDEN_VIEW: ZoomOverlayView = { type: "hidden" };

/** The press in progress, which the hook measures the drag threshold against. */
export function getPress(state: ZoomState): null | ZoomPress {
  return state.type === "pressed" || state.type === "dragging" ? state.press : null;
}

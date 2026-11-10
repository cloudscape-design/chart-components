// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ZOOM_POINTS } from "./zoom-utils";

export interface ZoomSelection {
  cursorIndex: number;
  anchorIndex: null | number;
}

export interface ZoomPress {
  pointerId: number;
  startIndex: number;
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
  resume: ZoomSelection;
}

export type ZoomState = IdleState | SelectingState | PressedState;

export const IDLE_ZOOM_STATE: ZoomState = { type: "idle" };

export type ZoomEvent =
  | { type: "enterZoomMode"; startIndex: number }
  | { type: "exitZoomMode"; moveFocus: boolean }
  | { type: "resetZoom"; zoomed: boolean }
  | { type: "stepCursor"; offset: number }
  | { type: "moveCursorToEdge"; edge: "first" | "last" }
  | { type: "commitPoint" }
  | { type: "pointerDown"; press: ZoomPress }
  | {
      type: "pointerMove";
      index: number;
      insidePlot: boolean;
    }
  | { type: "pointerUp"; pointerId: number }
  | { type: "pointerCancel"; pointerId: number }
  | { type: "chartRendered"; stopMapper: ZoomStopMapper };

export interface ZoomStopMapper {
  nearest(index: number): number;
  exact(index: number): null | number;
}

export type ZoomFocusTarget = "cursor" | "zoomButton" | "resetButton";

export type ZoomAnnouncement =
  | { type: "zoomModeEntered"; index: number }
  | { type: "startPointSet"; index: number }
  | { type: "zoomModeExited" };

export type ZoomEffect =
  | { type: "clearHighlight" }
  | { type: "announce"; announcement: ZoomAnnouncement }
  | { type: "focus"; target: ZoomFocusTarget }
  | { type: "applyZoom"; fromIndex: number; toIndex: number }
  | { type: "resetZoom" };

export interface ZoomTransition {
  state: ZoomState;
  effects: readonly ZoomEffect[];
}

export interface ZoomContext {
  valuesCount: number;
}

export function zoomReducer(state: ZoomState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  switch (state.type) {
    case "idle":
      return fromIdle(state, event, context);
    case "selecting":
      return fromSelecting(state, event, context);
    case "pressed":
      return fromPressed(state, event, context);
  }
}

function fromIdle(state: IdleState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  switch (event.type) {
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "resetZoom":
      return resetZoom(event);
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
      return event.insidePlot ? moveCursor(state, event.index, valuesCount) : stay(state);
    case "chartRendered":
      return reconcile(state, event.stopMapper, context);
    default:
      return stay(state);
  }
}

function fromPressed(state: PressedState, event: ZoomEvent, context: ZoomContext): ZoomTransition {
  const { press, resume } = state;
  switch (event.type) {
    case "pointerUp": {
      if (event.pointerId !== press.pointerId) {
        return stay(state);
      }
      const cursorIndex = clampIndex(press.startIndex, context.valuesCount);
      return commitPoint({ cursorIndex, anchorIndex: resume.anchorIndex }, context);
    }
    case "pointerCancel":
      return event.pointerId === press.pointerId ? stay({ type: "selecting", selection: resume }) : stay(state);
    case "pointerDown":
      return stay({ type: "pressed", press: event.press, resume });
    case "enterZoomMode":
      return enterZoomMode(state, event.startIndex, context);
    case "exitZoomMode":
      return exitZoomMode(event.moveFocus);
    case "resetZoom":
      return resetZoom(event);
    case "chartRendered":
      return reconcile(state, event.stopMapper, context);
    default:
      return stay(state);
  }
}

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

function resetZoom({ zoomed }: { zoomed: boolean }): ZoomTransition {
  return zoomed ? transition(IDLE_ZOOM_STATE, [{ type: "resetZoom" }]) : stay(IDLE_ZOOM_STATE);
}

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
    return transition(selecting, [{ type: "announce", announcement: { type: "startPointSet", index: anchorIndex } }]);
  }
  return transition(IDLE_ZOOM_STATE, [
    { type: "applyZoom", fromIndex: anchorIndex, toIndex: cursorIndex },
    { type: "focus", target: "resetButton" },
  ]);
}

function reconcile(state: ZoomState, stopMapper: ZoomStopMapper, { valuesCount }: ZoomContext): ZoomTransition {
  if (valuesCount === 0) {
    return state.type === "idle" ? stay(state) : exitZoomMode(true);
  }
  switch (state.type) {
    case "idle":
      return stay(state);
    case "selecting":
      return stay({ type: "selecting", selection: remapSelection(state.selection, stopMapper) });
    case "pressed":
      return stay({
        type: "pressed",
        press: { ...state.press, startIndex: stopMapper.nearest(state.press.startIndex) },
        resume: remapSelection(state.resume, stopMapper),
      });
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

function remapSelection(selection: ZoomSelection, stopMapper: ZoomStopMapper): ZoomSelection {
  return {
    cursorIndex: stopMapper.nearest(selection.cursorIndex),
    anchorIndex: selection.anchorIndex === null ? null : stopMapper.exact(selection.anchorIndex),
  };
}

function clampIndex(index: number, valuesCount: number): number {
  return Math.min(Math.max(index, 0), Math.max(0, valuesCount - 1));
}

function isZoomableRange(fromIndex: number, toIndex: number): boolean {
  return Math.abs(toIndex - fromIndex) + 1 >= MIN_ZOOM_POINTS;
}

export function canZoomInto(valuesCount: number): boolean {
  return valuesCount > MIN_ZOOM_POINTS;
}

export function isZooming(state: ZoomState): boolean {
  return state.type !== "idle";
}

export type ZoomOverlayView = { type: "hidden" } | { type: "cursor"; cursorIndex: number; anchorIndex: null | number };

export function getOverlayView(state: ZoomState): ZoomOverlayView {
  switch (state.type) {
    case "idle":
      return HIDDEN_VIEW;
    case "selecting":
      return { type: "cursor", ...state.selection };
    case "pressed":
      return { type: "cursor", ...state.resume };
  }
}

const HIDDEN_VIEW: ZoomOverlayView = { type: "hidden" };

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ZOOM_POINTS } from "./zoom-utils";

interface InactiveMode {
  type: "inactive";
}

interface PendingFirstInputMode {
  type: "pendingFirstInput";
  cursorIndex: number;
}

interface PendingSecondInputMode {
  type: "pendingSecondInput";
  startIndex: number;
  cursorIndex: number;
}

export type ZoomMode = InactiveMode | PendingFirstInputMode | PendingSecondInputMode;

type ActiveZoomMode = PendingFirstInputMode | PendingSecondInputMode;

export interface ZoomPress {
  pointerType: string;
  clientX: number;
  clientY: number;
  startIndex: number;
  currentIndex: number;
  dragging: boolean;
}

export interface ZoomState {
  mode: ZoomMode;
  press: null | ZoomPress;
}

const INACTIVE_MODE: ZoomMode = { type: "inactive" };

export const INACTIVE_ZOOM_STATE: ZoomState = { mode: INACTIVE_MODE, press: null };

export const DRAG_THRESHOLD_PX = 10;

export type ZoomEvent =
  | { type: "enter" }
  | { type: "cancel"; reason: ZoomCancelReason }
  | { type: "move"; index: number }
  | { type: "commit" }
  | { type: "pressStart"; pointerType: string; clientX: number; clientY: number; index: number }
  | { type: "pressMove"; clientX: number; clientY: number; index: number }
  | { type: "pressEnd"; index: number }
  | { type: "pressCancel" }
  | { type: "rendered"; stopMapper: ZoomStopMapper };

export interface ZoomStopMapper {
  nearest(index: number): number;
  exact(index: number): null | number;
}

export type ZoomCancelReason = "escape" | "toggle" | "blur" | "noStops";

export type ZoomFocusTarget = "cursor" | "zoomButton" | "resetButton";

export type ZoomAnnouncement =
  | { type: "zoomModeEntered"; index: number }
  | { type: "startPointSet"; index: number }
  | { type: "zoomModeExited" };

export type ZoomEffect =
  | { type: "announce"; announcement: ZoomAnnouncement }
  | { type: "focus"; target: ZoomFocusTarget }
  | { type: "applyZoom"; fromIndex: number; toIndex: number }
  | { type: "dragStart" };

export interface ZoomTransition {
  state: ZoomState;
  effects: readonly ZoomEffect[];
}

export interface ZoomContext {
  valuesCount: number;
}

interface ModeTransition {
  mode: ZoomMode;
  effects: readonly ZoomEffect[];
}

export function zoomReducer(state: ZoomState, event: ZoomEvent, { valuesCount }: ZoomContext): ZoomTransition {
  switch (event.type) {
    case "enter":
      return state.mode.type === "inactive" ? update(state, enter(state.mode, valuesCount), null) : unchanged(state);
    case "cancel":
      return state.mode.type === "inactive"
        ? unchanged(state)
        : update(state, cancel(event.reason), event.reason === "blur" ? state.press : null);
    case "move":
      return state.mode.type === "inactive" || state.press
        ? unchanged(state)
        : update(state, move(state.mode, event.index, valuesCount));
    case "commit":
      return state.mode.type === "inactive" || state.press ? unchanged(state) : update(state, commit(state.mode));
    case "pressStart":
      return update(state, modeOnly(state.mode), {
        pointerType: event.pointerType,
        clientX: event.clientX,
        clientY: event.clientY,
        startIndex: event.index,
        currentIndex: event.index,
        dragging: false,
      });
    case "pressMove":
      return pressMove(state, event.clientX, event.clientY, event.index);
    case "pressEnd":
      return pressEnd(state, event.index, valuesCount);
    case "pressCancel":
      return state.press ? update(state, modeOnly(state.mode), null) : unchanged(state);
    case "rendered":
      return rendered(state, event.stopMapper, valuesCount);
  }
}

function enter(mode: InactiveMode, valuesCount: number): ModeTransition {
  if (!canZoomInto(valuesCount)) {
    return modeOnly(mode);
  }
  return {
    mode: { type: "pendingFirstInput", cursorIndex: 0 },
    effects: [
      { type: "announce", announcement: { type: "zoomModeEntered", index: 0 } },
      { type: "focus", target: "cursor" },
    ],
  };
}

// Focus returns to the Zoom button, unless the user left zoom mode by moving the focus away.
function cancel(reason: ZoomCancelReason): ModeTransition {
  const effects: ZoomEffect[] = [{ type: "announce", announcement: { type: "zoomModeExited" } }];
  if (reason !== "blur") {
    effects.push({ type: "focus", target: "zoomButton" });
  }
  return { mode: INACTIVE_MODE, effects };
}

function move(mode: ActiveZoomMode, index: number, valuesCount: number): ModeTransition {
  const cursorIndex = Math.min(Math.max(index, 0), valuesCount - 1);
  return modeOnly(cursorIndex === mode.cursorIndex ? mode : { ...mode, cursorIndex });
}

function commit(mode: ActiveZoomMode): ModeTransition {
  if (mode.type === "pendingFirstInput") {
    return {
      mode: { type: "pendingSecondInput", startIndex: mode.cursorIndex, cursorIndex: mode.cursorIndex },
      effects: [{ type: "announce", announcement: { type: "startPointSet", index: mode.cursorIndex } }],
    };
  }
  if (!isZoomableRange(mode.startIndex, mode.cursorIndex)) {
    return { mode, effects: [{ type: "announce", announcement: { type: "startPointSet", index: mode.startIndex } }] };
  }
  return {
    mode: INACTIVE_MODE,
    effects: [
      { type: "applyZoom", fromIndex: mode.startIndex, toIndex: mode.cursorIndex },
      { type: "focus", target: "resetButton" },
    ],
  };
}

function select(mode: ZoomMode, fromIndex: number, toIndex: number): ModeTransition {
  if (!isZoomableRange(fromIndex, toIndex)) {
    return modeOnly(mode);
  }
  const effects: ZoomEffect[] = [{ type: "applyZoom", fromIndex, toIndex }];
  if (mode.type !== "inactive") {
    effects.push({ type: "focus", target: "resetButton" });
  }
  return { mode: INACTIVE_MODE, effects };
}

function pressMove(state: ZoomState, clientX: number, clientY: number, index: number): ZoomTransition {
  const press = state.press;
  if (!press) {
    return unchanged(state);
  }
  if (!press.dragging && Math.hypot(clientX - press.clientX, clientY - press.clientY) < DRAG_THRESHOLD_PX) {
    return unchanged(state);
  }
  if (press.dragging && press.currentIndex === index) {
    return unchanged(state);
  }
  const effects: readonly ZoomEffect[] = press.dragging ? NO_EFFECTS : [{ type: "dragStart" }];
  return update(state, { mode: state.mode, effects }, { ...press, currentIndex: index, dragging: true });
}

function pressEnd(state: ZoomState, index: number, valuesCount: number): ZoomTransition {
  const press = state.press;
  if (!press) {
    return unchanged(state);
  }
  if (press.dragging) {
    return update(state, select(state.mode, press.startIndex, index), null);
  }
  if (state.mode.type === "inactive") {
    return update(state, modeOnly(state.mode), null);
  }
  const moved = move(state.mode, press.startIndex, valuesCount);
  const committed = commit(moved.mode as ActiveZoomMode);
  return update(state, { mode: committed.mode, effects: [...moved.effects, ...committed.effects] }, null);
}

function rendered(state: ZoomState, stopMapper: ZoomStopMapper, valuesCount: number): ZoomTransition {
  const press =
    state.press && valuesCount > 0
      ? {
          ...state.press,
          startIndex: stopMapper.nearest(state.press.startIndex),
          currentIndex: stopMapper.nearest(state.press.currentIndex),
        }
      : null;
  if (state.mode.type === "inactive") {
    return state.press ? update(state, modeOnly(state.mode), press) : unchanged(state);
  }
  if (valuesCount === 0) {
    return update(state, cancel("noStops"), null);
  }
  const cursorIndex = stopMapper.nearest(state.mode.cursorIndex);
  const startIndex = state.mode.type === "pendingSecondInput" ? stopMapper.exact(state.mode.startIndex) : null;
  const mode: ZoomMode =
    startIndex === null
      ? { type: "pendingFirstInput", cursorIndex }
      : { type: "pendingSecondInput", startIndex, cursorIndex };
  return update(state, modeOnly(mode), press);
}

function isZoomableRange(fromIndex: number, toIndex: number): boolean {
  return Math.abs(toIndex - fromIndex) + 1 >= MIN_ZOOM_POINTS;
}

function modeOnly(mode: ZoomMode): ModeTransition {
  return { mode, effects: NO_EFFECTS };
}

function update(state: ZoomState, next: ModeTransition, nextPress = state.press): ZoomTransition {
  if (next.mode === state.mode && nextPress === state.press) {
    return { state, effects: next.effects };
  }
  return { state: { mode: next.mode, press: nextPress }, effects: next.effects };
}

function unchanged(state: ZoomState): ZoomTransition {
  return { state, effects: NO_EFFECTS };
}

const NO_EFFECTS: readonly ZoomEffect[] = [];

export function canZoomInto(valuesCount: number): boolean {
  return valuesCount > MIN_ZOOM_POINTS;
}

export function isZooming(state: ZoomState): boolean {
  return state.mode.type !== "inactive";
}

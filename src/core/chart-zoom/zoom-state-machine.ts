// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ZOOM_POINTS } from "./zoom-utils";

interface InactiveState {
  type: "inactive";
}

interface PendingFirstInputState {
  type: "pendingFirstInput";
  cursorIndex: number;
}

interface PendingSecondInputState {
  type: "pendingSecondInput";
  startIndex: number;
  cursorIndex: number;
}

export type ZoomState = InactiveState | PendingFirstInputState | PendingSecondInputState;

export const INACTIVE_ZOOM_STATE: ZoomState = { type: "inactive" };

export type ZoomEvent =
  | { type: "enter" }
  | { type: "cancel"; reason: ZoomCancelReason }
  | { type: "move"; index: number }
  | { type: "commit" }
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
  | { type: "applyZoom"; fromIndex: number; toIndex: number };

export interface ZoomTransition {
  state: ZoomState;
  effects: readonly ZoomEffect[];
}

export interface ZoomContext {
  valuesCount: number;
}

export function zoomReducer(state: ZoomState, event: ZoomEvent, { valuesCount }: ZoomContext): ZoomTransition {
  if (state.type === "inactive") {
    return event.type === "enter" ? enter(state, valuesCount) : transition(state);
  }
  switch (event.type) {
    case "cancel":
      return cancel(event.reason);
    case "move":
      return move(state, event.index, valuesCount);
    case "commit":
      return commit(state);
    case "rendered":
      return rendered(state, event.stopMapper, valuesCount);
    default:
      return transition(state);
  }
}

function enter(state: InactiveState, valuesCount: number): ZoomTransition {
  if (!canZoomInto(valuesCount)) {
    return transition(state);
  }
  return transition({ type: "pendingFirstInput", cursorIndex: 0 }, [
    { type: "announce", announcement: { type: "zoomModeEntered", index: 0 } },
    { type: "focus", target: "cursor" },
  ]);
}

// Focus returns to the Zoom button, unless the user left zoom mode by moving the focus away.
function cancel(reason: ZoomCancelReason): ZoomTransition {
  const effects: ZoomEffect[] = [{ type: "announce", announcement: { type: "zoomModeExited" } }];
  if (reason !== "blur") {
    effects.push({ type: "focus", target: "zoomButton" });
  }
  return transition(INACTIVE_ZOOM_STATE, effects);
}

function move(
  state: PendingFirstInputState | PendingSecondInputState,
  index: number,
  valuesCount: number,
): ZoomTransition {
  const cursorIndex = Math.min(Math.max(index, 0), valuesCount - 1);
  return transition(cursorIndex === state.cursorIndex ? state : { ...state, cursorIndex });
}

function commit(state: PendingFirstInputState | PendingSecondInputState): ZoomTransition {
  if (state.type === "pendingFirstInput") {
    return transition({ type: "pendingSecondInput", startIndex: state.cursorIndex, cursorIndex: state.cursorIndex }, [
      { type: "announce", announcement: { type: "startPointSet", index: state.cursorIndex } },
    ]);
  }
  if (Math.abs(state.cursorIndex - state.startIndex) + 1 < MIN_ZOOM_POINTS) {
    return transition(state, [{ type: "announce", announcement: { type: "startPointSet", index: state.startIndex } }]);
  }
  return transition(INACTIVE_ZOOM_STATE, [
    { type: "applyZoom", fromIndex: state.startIndex, toIndex: state.cursorIndex },
    { type: "focus", target: "resetButton" },
  ]);
}

function rendered(
  state: PendingFirstInputState | PendingSecondInputState,
  stopMapper: ZoomStopMapper,
  valuesCount: number,
): ZoomTransition {
  if (valuesCount === 0) {
    return cancel("noStops");
  }
  const cursorIndex = stopMapper.nearest(state.cursorIndex);
  const startIndex = state.type === "pendingSecondInput" ? stopMapper.exact(state.startIndex) : null;
  return transition(
    startIndex === null
      ? { type: "pendingFirstInput", cursorIndex }
      : { type: "pendingSecondInput", startIndex, cursorIndex },
  );
}

function transition(state: ZoomState, effects: readonly ZoomEffect[] = NO_EFFECTS): ZoomTransition {
  return { state, effects };
}

const NO_EFFECTS: readonly ZoomEffect[] = [];

export function canZoomInto(valuesCount: number): boolean {
  return valuesCount > MIN_ZOOM_POINTS;
}

export function isZooming(state: ZoomState): boolean {
  return state.type !== "inactive";
}

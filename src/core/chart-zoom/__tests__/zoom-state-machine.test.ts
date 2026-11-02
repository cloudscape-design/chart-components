// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import {
  getInteraction,
  getOverlayView,
  IDLE_ZOOM_STATE,
  ZoomEffect,
  ZoomEvent,
  zoomReducer,
  ZoomState,
} from "../../../../lib/components/core/chart-zoom/zoom-state-machine";
import { remapStops } from "../../../../lib/components/core/chart-zoom/zoom-utils";

// The machine is pure, so it can be tabulated: the table below states the outcome of every event in
// every state, which is the whole behaviour of the zoom interaction. The cases after it cover what a
// single transition cannot show: the sequences the two ways of selecting a range are made of.

// Ten stops, which is more than the two a range needs, so zooming is possible throughout.
const COUNT = 10;

const SELECTION = { cursorIndex: 3, anchorIndex: null };
const SELECTING: ZoomState = { type: "selecting", selection: SELECTION };
// A selection whose start point is already set, and which is therefore one commit away from zooming.
const STARTED = { cursorIndex: 5, anchorIndex: 2 };
const PRESS = { pointerId: 1, startIndex: 4 };
const OTHER_PRESS = { pointerId: 2, startIndex: 7 };
const PRESSED: ZoomState = { type: "pressed", press: PRESS, resume: STARTED };

const ENTER: ZoomEvent = { type: "enterZoomMode", startIndex: 0 };
const EXIT: ZoomEvent = { type: "exitZoomMode", moveFocus: true };
const RESET: ZoomEvent = { type: "resetZoom", zoomed: true };
const RESET_UNZOOMED: ZoomEvent = { type: "resetZoom", zoomed: false };
const STEP: ZoomEvent = { type: "stepCursor", offset: 1 };
const TO_EDGE: ZoomEvent = { type: "moveCursorToEdge", edge: "last" };
const COMMIT: ZoomEvent = { type: "commitPoint" };
const DOWN: ZoomEvent = { type: "pointerDown", press: OTHER_PRESS };
const MOVE: ZoomEvent = { type: "pointerMove", index: 8, insidePlot: true };
const UP: ZoomEvent = { type: "pointerUp", pointerId: 1 };
const CANCEL: ZoomEvent = { type: "pointerCancel", pointerId: 1 };
// A render that leaves the stops as they were.
const RENDERED: ZoomEvent = { type: "chartRendered", remap: { nearest: (index) => index, exact: (index) => index } };

// The state a new selection starts in, and the effects that announce it and give it the focus.
const FRESH: ZoomState = { type: "selecting", selection: { cursorIndex: 0, anchorIndex: null } };
const ENTERED = ["clearHighlight", "announce", "focus"];
const EXITED = ["announce", "focus"];
const RESETTED = ["resetZoom"];
const ZOOMED = ["applyZoom", "focus"];

// Every state, against every event. "same" means the event means nothing in that state: the machine
// returns the state it was given, unchanged and with no effects, and the helper can then skip the work
// a transition would cause.
const SAME = "same";

const TRANSITIONS: [name: string, from: ZoomState, event: ZoomEvent, to: ZoomState | typeof SAME, effects: string[]][] =
  [
    // Outside an interaction, only entering zoom mode and resetting a zoom mean anything.
    ["idle + enterZoomMode", IDLE_ZOOM_STATE, ENTER, FRESH, ENTERED],
    ["idle + exitZoomMode", IDLE_ZOOM_STATE, EXIT, SAME, []],
    ["idle + resetZoom", IDLE_ZOOM_STATE, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["idle + resetZoom, not zoomed", IDLE_ZOOM_STATE, RESET_UNZOOMED, IDLE_ZOOM_STATE, []],
    ["idle + stepCursor", IDLE_ZOOM_STATE, STEP, SAME, []],
    ["idle + moveCursorToEdge", IDLE_ZOOM_STATE, TO_EDGE, SAME, []],
    ["idle + commitPoint", IDLE_ZOOM_STATE, COMMIT, SAME, []],
    ["idle + pointerDown", IDLE_ZOOM_STATE, DOWN, SAME, []],
    ["idle + pointerMove", IDLE_ZOOM_STATE, MOVE, SAME, []],
    ["idle + pointerUp", IDLE_ZOOM_STATE, UP, SAME, []],
    ["idle + pointerCancel", IDLE_ZOOM_STATE, CANCEL, SAME, []],
    ["idle + chartRendered", IDLE_ZOOM_STATE, RENDERED, SAME, []],

    // While selecting, the cursor moves and the range is committed a boundary at a time.
    ["selecting + enterZoomMode", SELECTING, ENTER, FRESH, ENTERED],
    ["selecting + exitZoomMode", SELECTING, EXIT, IDLE_ZOOM_STATE, EXITED],
    ["selecting + resetZoom", SELECTING, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["selecting + stepCursor", SELECTING, STEP, { type: "selecting", selection: { cursorIndex: 4, anchorIndex: null } }, []], // prettier-ignore
    ["selecting + moveCursorToEdge", SELECTING, TO_EDGE, { type: "selecting", selection: { cursorIndex: 9, anchorIndex: null } }, []], // prettier-ignore
    ["selecting + commitPoint", SELECTING, COMMIT, { type: "selecting", selection: { cursorIndex: 3, anchorIndex: 3 } }, ["announce"]], // prettier-ignore
    ["selecting + pointerDown", SELECTING, DOWN, { type: "pressed", press: OTHER_PRESS, resume: SELECTION }, []], // prettier-ignore
    // With no press in progress the cursor follows the pointer, so that a click sets the boundary it shows.
    ["selecting + pointerMove", SELECTING, MOVE, { type: "selecting", selection: { cursorIndex: 8, anchorIndex: null } }, []], // prettier-ignore
    ["selecting + pointerMove outside the plot", SELECTING, { ...MOVE, insidePlot: false }, SAME, []],
    ["selecting + pointerUp", SELECTING, UP, SAME, []],
    ["selecting + pointerCancel", SELECTING, CANCEL, SAME, []],
    ["selecting + chartRendered", SELECTING, RENDERED, SELECTING, []],

    // A press belongs to the selection it interrupted, and returns to it.
    ["pressed + enterZoomMode", PRESSED, ENTER, FRESH, ENTERED],
    ["pressed + exitZoomMode", PRESSED, EXIT, IDLE_ZOOM_STATE, EXITED],
    ["pressed + resetZoom", PRESSED, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["pressed + stepCursor", PRESSED, STEP, SAME, []],
    ["pressed + moveCursorToEdge", PRESSED, TO_EDGE, SAME, []],
    ["pressed + commitPoint", PRESSED, COMMIT, SAME, []],
    ["pressed + pointerDown", PRESSED, DOWN, { type: "pressed", press: OTHER_PRESS, resume: STARTED }, []],
    ["pressed + pointerMove", PRESSED, MOVE, SAME, []],
    // The click sets the boundary where it landed, which completes the range this selection had started.
    ["pressed + pointerUp", PRESSED, UP, IDLE_ZOOM_STATE, ZOOMED],
    ["pressed + pointerUp of another pointer", PRESSED, { ...UP, pointerId: 2 }, SAME, []],
    ["pressed + pointerCancel", PRESSED, CANCEL, { type: "selecting", selection: STARTED }, []],
    ["pressed + pointerCancel of another pointer", PRESSED, { ...CANCEL, pointerId: 2 }, SAME, []],
    ["pressed + chartRendered", PRESSED, RENDERED, PRESSED, []],
  ];

describe("zoomReducer", () => {
  test.each(TRANSITIONS)("%s", (_name, from, event, to, effects) => {
    const transition = zoomReducer(from, event, { valuesCount: COUNT });

    expect(transition.state).toEqual(to === SAME ? from : to);
    expect(transition.effects.map((effect) => effect.type)).toEqual(effects);
    if (to === SAME) {
      // The helper compares the state by identity to tell a transition from an event it can ignore.
      expect(transition.state).toBe(from);
    }
  });

  // The two ways of selecting a range are the same interaction, and they end in the same zoom.

  test("zooms with the keyboard, a stop at a time", () => {
    const entered = reduce(IDLE_ZOOM_STATE, ENTER);
    expect(effectTypes(entered)).toEqual(ENTERED);

    const stepped = reduce(entered.state, { type: "stepCursor", offset: 2 });
    const started = reduce(stepped.state, COMMIT);
    expect(started.effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 2 } }]);

    const steppedAgain = reduce(started.state, { type: "stepCursor", offset: 3 });
    expect(getOverlayView(steppedAgain.state)).toEqual({ type: "cursor", cursorIndex: 5, anchorIndex: 2 });

    const zoomed = reduce(steppedAgain.state, COMMIT);
    expect(zoomed.state).toEqual(IDLE_ZOOM_STATE);
    expect(zoomed.effects).toEqual([
      { type: "applyZoom", fromIndex: 2, toIndex: 5 },
      { type: "focus", target: "resetButton" },
    ]);
  });

  test("zooms with two clicks, which set the boundaries where they land", () => {
    const selecting = reduce(IDLE_ZOOM_STATE, ENTER).state;
    // The first click lands on the stop the press started on, which sets the range start.
    const pressed = reduce(selecting, { type: "pointerDown", press: PRESS }).state;
    const started = reduce(pressed, UP);

    expect(started.state).toEqual({ type: "selecting", selection: { cursorIndex: 4, anchorIndex: 4 } });
    expect(started.effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 4 } }]);

    const secondPress = { ...PRESS, startIndex: 8 };
    const pressedAgain = reduce(started.state, { type: "pointerDown", press: secondPress });
    const zoomed = reduce(pressedAgain.state, UP);

    expect(zoomed.state).toEqual(IDLE_ZOOM_STATE);
    expect(zoomed.effects).toEqual([
      { type: "applyZoom", fromIndex: 4, toIndex: 8 },
      { type: "focus", target: "resetButton" },
    ]);
  });

  // A range of a single stop has no width, and the chart cannot show it. Rather than applying a zoom
  // that cannot be undone by zooming again, such a selection is refused.

  test("keeps the start point when the range would be a single stop", () => {
    const selection = { cursorIndex: 4, anchorIndex: 4 };
    const { state, effects } = reduce({ type: "selecting", selection }, COMMIT);

    expect(state).toEqual({ type: "selecting", selection });
    expect(effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 4 } }]);
  });

  test("cannot enter zoom mode when there is no narrower range left", () => {
    for (const valuesCount of [0, 1, 2]) {
      const transition = zoomReducer(IDLE_ZOOM_STATE, ENTER, { valuesCount });

      expect(transition.state).toBe(IDLE_ZOOM_STATE);
      expect(transition.effects).toEqual([]);
    }
  });

  test("keeps the cursor within the stops the chart shows", () => {
    const forward = reduce(SELECTING, { type: "stepCursor", offset: 100 });
    expect(forward.state).toEqual({ type: "selecting", selection: { cursorIndex: 9, anchorIndex: null } });

    const back = reduce(SELECTING, { type: "stepCursor", offset: -100 });
    expect(back.state).toEqual({ type: "selecting", selection: { cursorIndex: 0, anchorIndex: null } });

    // A step that does not move the cursor is not a transition at all, so nothing is redrawn for it.
    expect(reduce(back.state, { type: "stepCursor", offset: -1 }).state).toBe(back.state);
  });

  // The stops the cursor can sit on change with the zoomed range and with which series are visible,
  // and a selection that was made over stops that are gone cannot be applied.

  test("brings the selection back within the stops after a render", () => {
    // The stops 0..9 become 0..4: the cursor at 8 moves to the nearest stop, and the start point at 7 is gone.
    const previous = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const current = [0, 1, 2, 3, 4];
    const { state } = zoomReducer(
      { type: "selecting", selection: { cursorIndex: 8, anchorIndex: 7 } },
      { type: "chartRendered", remap: remapStops(previous, current) },
      { valuesCount: current.length },
    );

    expect(state).toEqual({ type: "selecting", selection: { cursorIndex: 4, anchorIndex: null } });
  });

  test("keeps the boundaries on their values when the stops change", () => {
    // The stop at 10 is removed: the start point at 20 and the cursor at 30 keep their values, at new indices.
    const remap = remapStops([0, 10, 20, 30, 40], [0, 20, 30, 40]);
    const selecting = zoomReducer(
      { type: "selecting", selection: { cursorIndex: 3, anchorIndex: 2 } },
      { type: "chartRendered", remap },
      { valuesCount: 4 },
    );
    const pressed = zoomReducer(
      { type: "pressed", press: { pointerId: 1, startIndex: 4 }, resume: { cursorIndex: 3, anchorIndex: 2 } },
      { type: "chartRendered", remap },
      { valuesCount: 4 },
    );

    expect(selecting.state).toEqual({ type: "selecting", selection: { cursorIndex: 2, anchorIndex: 1 } });
    expect(pressed.state).toEqual({
      type: "pressed",
      press: { pointerId: 1, startIndex: 3 },
      resume: { cursorIndex: 2, anchorIndex: 1 },
    });
  });

  test("leaves zoom mode after a render that left no stops to select", () => {
    for (const state of [SELECTING, PRESSED]) {
      const transition = zoomReducer(state, RENDERED, { valuesCount: 0 });

      expect(transition.state).toEqual(IDLE_ZOOM_STATE);
      // The cursor is hidden, so the focus moves to the controls.
      expect(transition.effects).toEqual([
        { type: "announce", announcement: { type: "zoomModeExited" } },
        { type: "focus", target: "zoomButton" },
      ]);
    }
  });

  // Focus leaving the chart ends zoom mode without taking the focus back.
  test("only moves the focus when asked to", () => {
    expect(effectTypes(reduce(SELECTING, { type: "exitZoomMode", moveFocus: false }))).toEqual(["announce"]);
  });
});

describe("zoom state projections", () => {
  test.each([
    [IDLE_ZOOM_STATE, "idle", { type: "hidden" }],
    [SELECTING, "cursor", { type: "cursor", cursorIndex: 3, anchorIndex: null }],
    // A press shows the selection it interrupted.
    [PRESSED, "cursor", { type: "cursor", ...STARTED }],
  ])("describes the %# state to React and to the overlay", (state, interaction, view) => {
    expect(getInteraction(state)).toBe(interaction);
    expect(getOverlayView(state)).toEqual(view);
  });
});

function reduce(state: ZoomState, event: ZoomEvent) {
  return zoomReducer(state, event, { valuesCount: COUNT });
}

function effectTypes({ effects }: { effects: readonly ZoomEffect[] }) {
  return effects.map((effect) => effect.type);
}

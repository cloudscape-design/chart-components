// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import {
  getInteraction,
  getOverlayView,
  getPress,
  IDLE_ZOOM_STATE,
  ZoomEffect,
  ZoomEvent,
  zoomReducer,
  ZoomState,
} from "../../../../lib/components/core/chart-zoom/zoom-state-machine";

// The machine is pure, so it can be tabulated: the table below states the outcome of every event in
// every state, which is the whole behaviour of the zoom interaction. The cases after it cover what a
// single transition cannot show: the sequences the three ways of selecting a range are made of.

// Ten stops, which is more than the two a range needs, so zooming is possible throughout.
const COUNT = 10;

const SELECTION = { cursorIndex: 3, anchorIndex: null };
const SELECTING: ZoomState = { type: "selecting", selection: SELECTION };
// A selection whose start point is already set, and which is therefore one commit away from zooming.
const STARTED = { cursorIndex: 5, anchorIndex: 2 };
const PRESS = { pointerId: 1, clientX: 100, clientY: 100, startIndex: 4, currentIndex: 4 };
const OTHER_PRESS = { pointerId: 2, clientX: 200, clientY: 200, startIndex: 7, currentIndex: 7 };
// A press over a chart that is not in zoom mode, and one that interrupted a selection in progress.
const PRESSED: ZoomState = { type: "pressed", press: PRESS, resume: null };
const PRESSED_IN_ZOOM: ZoomState = { type: "pressed", press: PRESS, resume: STARTED };
const DRAGGING: ZoomState = { type: "dragging", press: { ...PRESS, currentIndex: 8 }, resume: null };
const DRAGGING_IN_ZOOM: ZoomState = { type: "dragging", press: { ...PRESS, currentIndex: 8 }, resume: STARTED };

const ENTER: ZoomEvent = { type: "enterZoomMode", startIndex: 0 };
const EXIT: ZoomEvent = { type: "exitZoomMode", moveFocus: true };
const RESET: ZoomEvent = { type: "resetZoom", zoomed: true, moveFocus: true };
const RESET_UNZOOMED: ZoomEvent = { type: "resetZoom", zoomed: false, moveFocus: true };
const STEP: ZoomEvent = { type: "stepCursor", offset: 1 };
const TO_EDGE: ZoomEvent = { type: "moveCursorToEdge", edge: "last" };
const COMMIT: ZoomEvent = { type: "commitPoint" };
const DOWN: ZoomEvent = { type: "pointerDown", press: OTHER_PRESS };
// A move of the pointer that is holding the press, either past the drag threshold or short of it.
const DRAG_MOVE: ZoomEvent = { type: "pointerMove", pointerId: 1, index: 8, passedThreshold: true, insidePlot: true };
const SMALL_MOVE: ZoomEvent = { type: "pointerMove", pointerId: 1, index: 8, passedThreshold: false, insidePlot: true };
const UP: ZoomEvent = { type: "pointerUp", pointerId: 1 };
const CANCEL: ZoomEvent = { type: "pointerCancel", pointerId: 1 };
const RENDERED: ZoomEvent = { type: "chartRendered" };

// The state a new selection starts in, and the effects that announce it and give it the focus.
const FRESH: ZoomState = { type: "selecting", selection: { cursorIndex: 0, anchorIndex: null } };
const ENTERED = ["clearHighlight", "announce", "focus"];
const EXITED = ["announce", "focus"];
const RESETTED = ["resetZoom", "focus"];
const ZOOMED = ["applyZoom", "focus"];

// Every state, against every event. "same" means the event means nothing in that state: the machine
// returns the state it was given, unchanged and with no effects, and the hook can then skip the work
// a transition would cause.
const SAME = "same";

const TRANSITIONS: [name: string, from: ZoomState, event: ZoomEvent, to: ZoomState | typeof SAME, effects: string[]][] =
  [
    // Outside an interaction, only entering zoom mode, resetting a zoom, and a press mean anything.
    ["idle + enterZoomMode", IDLE_ZOOM_STATE, ENTER, FRESH, ENTERED],
    ["idle + exitZoomMode", IDLE_ZOOM_STATE, EXIT, SAME, []],
    ["idle + resetZoom", IDLE_ZOOM_STATE, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["idle + resetZoom, not zoomed", IDLE_ZOOM_STATE, RESET_UNZOOMED, IDLE_ZOOM_STATE, []],
    ["idle + stepCursor", IDLE_ZOOM_STATE, STEP, SAME, []],
    ["idle + moveCursorToEdge", IDLE_ZOOM_STATE, TO_EDGE, SAME, []],
    ["idle + commitPoint", IDLE_ZOOM_STATE, COMMIT, SAME, []],
    ["idle + pointerDown", IDLE_ZOOM_STATE, DOWN, { type: "pressed", press: OTHER_PRESS, resume: null }, []],
    ["idle + pointerMove", IDLE_ZOOM_STATE, DRAG_MOVE, SAME, []],
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
    ["selecting + pointerMove", SELECTING, DRAG_MOVE, { type: "selecting", selection: { cursorIndex: 8, anchorIndex: null } }, []], // prettier-ignore
    ["selecting + pointerMove outside the plot", SELECTING, { ...DRAG_MOVE, insidePlot: false }, SAME, []],
    ["selecting + pointerUp", SELECTING, UP, SAME, []],
    ["selecting + pointerCancel", SELECTING, CANCEL, SAME, []],
    ["selecting + chartRendered", SELECTING, RENDERED, SELECTING, []],

    // A press is watched until it either travels far enough to be a drag, or ends as a click.
    ["pressed + enterZoomMode", PRESSED, ENTER, FRESH, ENTERED],
    ["pressed + exitZoomMode", PRESSED, EXIT, SAME, []],
    ["pressed + resetZoom", PRESSED, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["pressed + stepCursor", PRESSED, STEP, SAME, []],
    ["pressed + moveCursorToEdge", PRESSED, TO_EDGE, SAME, []],
    ["pressed + commitPoint", PRESSED, COMMIT, SAME, []],
    ["pressed + pointerDown", PRESSED, DOWN, { type: "pressed", press: OTHER_PRESS, resume: null }, []],
    ["pressed + pointerMove past the threshold", PRESSED, DRAG_MOVE, DRAGGING, ["clearHighlight"]],
    ["pressed + pointerMove short of it", PRESSED, SMALL_MOVE, SAME, []],
    ["pressed + pointerMove of another pointer", PRESSED, { ...DRAG_MOVE, pointerId: 2 }, SAME, []],
    // Outside zoom mode the chart has handled the click itself, so the press just ends.
    ["pressed + pointerUp", PRESSED, UP, IDLE_ZOOM_STATE, []],
    ["pressed + pointerUp of another pointer", PRESSED, { ...UP, pointerId: 2 }, SAME, []],
    ["pressed + pointerCancel", PRESSED, CANCEL, IDLE_ZOOM_STATE, []],
    ["pressed + chartRendered", PRESSED, RENDERED, PRESSED, []],

    // A press in zoom mode belongs to the selection it interrupted, and returns to it.
    ["pressed in zoom mode + exitZoomMode", PRESSED_IN_ZOOM, EXIT, IDLE_ZOOM_STATE, EXITED],
    ["pressed in zoom mode + pointerMove past the threshold", PRESSED_IN_ZOOM, DRAG_MOVE, DRAGGING_IN_ZOOM, ["clearHighlight"]], // prettier-ignore
    // The click sets the boundary where it landed, which completes the range this selection had started.
    ["pressed in zoom mode + pointerUp", PRESSED_IN_ZOOM, UP, IDLE_ZOOM_STATE, ZOOMED],
    ["pressed in zoom mode + pointerCancel", PRESSED_IN_ZOOM, CANCEL, { type: "selecting", selection: STARTED }, []],
    ["pressed in zoom mode + pointerDown", PRESSED_IN_ZOOM, DOWN, { type: "pressed", press: OTHER_PRESS, resume: STARTED }, []], // prettier-ignore

    // A drag draws the range as it goes, and applies it when it ends.
    ["dragging + enterZoomMode", DRAGGING, ENTER, FRESH, ENTERED],
    ["dragging + exitZoomMode", DRAGGING, EXIT, IDLE_ZOOM_STATE, EXITED],
    ["dragging + resetZoom", DRAGGING, RESET, IDLE_ZOOM_STATE, RESETTED],
    ["dragging + stepCursor", DRAGGING, STEP, SAME, []],
    ["dragging + moveCursorToEdge", DRAGGING, TO_EDGE, SAME, []],
    ["dragging + commitPoint", DRAGGING, COMMIT, SAME, []],
    ["dragging + pointerDown", DRAGGING, DOWN, { type: "pressed", press: OTHER_PRESS, resume: null }, []],
    ["dragging + pointerMove", DRAGGING, { ...DRAG_MOVE, index: 6 }, { type: "dragging", press: { ...PRESS, currentIndex: 6 }, resume: null }, []], // prettier-ignore
    ["dragging + pointerMove onto the same stop", DRAGGING, DRAG_MOVE, SAME, []],
    ["dragging + pointerMove of another pointer", DRAGGING, { ...DRAG_MOVE, pointerId: 2, index: 6 }, SAME, []],
    // Focus only follows the zoom when the cursor was holding it, which is the case in zoom mode alone.
    ["dragging + pointerUp", DRAGGING, UP, IDLE_ZOOM_STATE, ["applyZoom"]],
    ["dragging in zoom mode + pointerUp", DRAGGING_IN_ZOOM, UP, IDLE_ZOOM_STATE, ZOOMED],
    ["dragging + pointerUp of another pointer", DRAGGING, { ...UP, pointerId: 2 }, SAME, []],
    ["dragging + pointerCancel", DRAGGING, CANCEL, IDLE_ZOOM_STATE, []],
    ["dragging in zoom mode + pointerCancel", DRAGGING_IN_ZOOM, CANCEL, { type: "selecting", selection: STARTED }, []],
    ["dragging + chartRendered", DRAGGING, RENDERED, DRAGGING, []],
  ];

describe("zoomReducer", () => {
  test.each(TRANSITIONS)("%s", (_name, from, event, to, effects) => {
    const transition = zoomReducer(from, event, { valuesCount: COUNT });

    expect(transition.state).toEqual(to === SAME ? from : to);
    expect(transition.effects.map((effect) => effect.type)).toEqual(effects);
    if (to === SAME) {
      // The hook compares the state by identity to tell a transition from an event it can ignore.
      expect(transition.state).toBe(from);
    }
  });

  // The three ways of selecting a range are the same interaction, and they end in the same zoom.

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

    const secondPress = { ...PRESS, startIndex: 8, currentIndex: 8 };
    const pressedAgain = reduce(started.state, { type: "pointerDown", press: secondPress });
    const zoomed = reduce(pressedAgain.state, UP);

    expect(zoomed.state).toEqual(IDLE_ZOOM_STATE);
    expect(zoomed.effects).toEqual([
      { type: "applyZoom", fromIndex: 4, toIndex: 8 },
      { type: "focus", target: "resetButton" },
    ]);
  });

  test("zooms by dragging across the plot", () => {
    const pressed = reduce(IDLE_ZOOM_STATE, { type: "pointerDown", press: PRESS }).state;
    // The press is invisible, and the chart keeps behaving as it did, until it travels far enough.
    expect(getInteraction(pressed)).toBe("idle");
    expect(getOverlayView(pressed)).toEqual({ type: "hidden" });

    const dragging = reduce(pressed, { ...DRAG_MOVE, index: 7 }).state;

    expect(getInteraction(dragging)).toBe("drag");
    expect(getOverlayView(dragging)).toEqual({ type: "range", fromIndex: 4, toIndex: 7 });

    const zoomed = reduce(dragging, UP);

    expect(zoomed.state).toEqual(IDLE_ZOOM_STATE);
    expect(zoomed.effects).toEqual([{ type: "applyZoom", fromIndex: 4, toIndex: 7 }]);
  });

  // A range of a single stop has no width, and the chart cannot show it. Rather than applying a zoom
  // that cannot be undone by zooming again, such a selection is refused.

  test("keeps the start point when the range would be a single stop", () => {
    const selection = { cursorIndex: 4, anchorIndex: 4 };
    const { state, effects } = reduce({ type: "selecting", selection }, COMMIT);

    expect(state).toEqual({ type: "selecting", selection });
    expect(effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 4 } }]);
  });

  test("discards a drag that is too narrow to zoom into", () => {
    const narrow: ZoomState = { type: "dragging", press: PRESS, resume: STARTED };

    // The interaction returns to where the drag started from, with nothing applied.
    expect(reduce(narrow, UP)).toEqual({ state: { type: "selecting", selection: STARTED }, effects: [] });
    expect(reduce({ ...narrow, resume: null }, UP)).toEqual({ state: IDLE_ZOOM_STATE, effects: [] });
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
    const { state } = zoomReducer({ type: "selecting", selection: { cursorIndex: 8, anchorIndex: 7 } }, RENDERED, {
      valuesCount: 5,
    });

    // The cursor moves to the last stop, and the start point, which is no longer shown, is dropped.
    expect(state).toEqual({ type: "selecting", selection: { cursorIndex: 4, anchorIndex: null } });
  });

  test("leaves zoom mode after a render that left no stops to select", () => {
    for (const state of [SELECTING, PRESSED_IN_ZOOM, DRAGGING]) {
      const transition = zoomReducer(state, RENDERED, { valuesCount: 0 });

      expect(transition.state).toEqual(IDLE_ZOOM_STATE);
      expect(transition.effects).toEqual([{ type: "announce", announcement: { type: "zoomModeExited" } }]);
    }

    // A press that is not part of a selection belongs to the chart, which is still there.
    expect(zoomReducer(PRESSED, RENDERED, { valuesCount: 0 }).state).toBe(PRESSED);
  });

  // Focus is only moved when the interaction was being driven from the keyboard: the pointer paths
  // leave it where it is, and the chart API is called from outside the chart altogether.

  test("only moves the focus when asked to", () => {
    expect(effectTypes(reduce(SELECTING, { type: "exitZoomMode", moveFocus: false }))).toEqual(["announce"]);
    expect(effectTypes(reduce(SELECTING, { type: "resetZoom", zoomed: true, moveFocus: false }))).toEqual([
      "resetZoom",
    ]);
  });
});

describe("zoom state projections", () => {
  test.each([
    [IDLE_ZOOM_STATE, "idle", { type: "hidden" }, null],
    [SELECTING, "cursor", { type: "cursor", cursorIndex: 3, anchorIndex: null }, null],
    // A press shows whatever it interrupted, until it becomes a drag.
    [PRESSED, "idle", { type: "hidden" }, PRESS],
    [PRESSED_IN_ZOOM, "cursor", { type: "cursor", ...STARTED }, PRESS],
    [DRAGGING, "drag", { type: "range", fromIndex: 4, toIndex: 8 }, { ...PRESS, currentIndex: 8 }],
  ])(
    "describes the %# state to React, to the overlay, and to the pointer handlers",
    (state, interaction, view, press) => {
      expect(getInteraction(state)).toBe(interaction);
      expect(getOverlayView(state)).toEqual(view);
      expect(getPress(state)).toEqual(press);
    },
  );
});

function reduce(state: ZoomState, event: ZoomEvent) {
  return zoomReducer(state, event, { valuesCount: COUNT });
}

function effectTypes({ effects }: { effects: readonly ZoomEffect[] }) {
  return effects.map((effect) => effect.type);
}

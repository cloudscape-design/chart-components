// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import {
  INACTIVE_ZOOM_STATE,
  ZoomEvent,
  ZoomMode,
  ZoomPress,
  zoomReducer,
  ZoomState,
} from "../../../../lib/components/core/chart-zoom/zoom-state-machine";
import { createStopMapper } from "../../../../lib/components/core/chart-zoom/zoom-utils";

const COUNT = 10;

const FIRST_MODE: ZoomMode = { type: "pendingFirstInput", cursorIndex: 3 };
const SECOND_MODE: ZoomMode = { type: "pendingSecondInput", startIndex: 2, cursorIndex: 5 };

const FIRST = state(FIRST_MODE);
const SECOND = state(SECOND_MODE);

const PRESS: ZoomPress = { pointerType: "mouse", clientX: 100, clientY: 50, startIndex: 4, currentIndex: 4, dragging: false }; // prettier-ignore
const DRAG: ZoomPress = { ...PRESS, currentIndex: 7, dragging: true };

const ENTER: ZoomEvent = { type: "enter" };
const CANCEL: ZoomEvent = { type: "cancel", reason: "escape" };
const BLUR: ZoomEvent = { type: "cancel", reason: "blur" };
const MOVE: ZoomEvent = { type: "move", index: 8 };
const COMMIT: ZoomEvent = { type: "commit" };
const RENDERED: ZoomEvent = { type: "rendered", stopMapper: { nearest: (index) => index, exact: (index) => index } };
const PRESS_START: ZoomEvent = { type: "pressStart", pointerType: "mouse", clientX: 100, clientY: 50, index: 4 };
const PRESS_NUDGE: ZoomEvent = { type: "pressMove", clientX: 105, clientY: 50, index: 4 };
const PRESS_DRAG: ZoomEvent = { type: "pressMove", clientX: 160, clientY: 50, index: 7 };
const PRESS_END: ZoomEvent = { type: "pressEnd", index: 7 };
const PRESS_END_ON_START: ZoomEvent = { type: "pressEnd", index: 4 };
const PRESS_CANCEL: ZoomEvent = { type: "pressCancel" };

const SAME = "same";

const TRANSITIONS: [name: string, from: ZoomState, event: ZoomEvent, to: ZoomState | typeof SAME, effects: string[]][] =
  [
    ["inactive + enter", INACTIVE_ZOOM_STATE, ENTER, state({ type: "pendingFirstInput", cursorIndex: 0 }), ["announce", "focus"]], // prettier-ignore
    ["inactive + cancel", INACTIVE_ZOOM_STATE, CANCEL, SAME, []],
    ["inactive + move", INACTIVE_ZOOM_STATE, MOVE, SAME, []],
    ["inactive + commit", INACTIVE_ZOOM_STATE, COMMIT, SAME, []],
    ["inactive + rendered", INACTIVE_ZOOM_STATE, RENDERED, SAME, []],

    ["first input + enter", FIRST, ENTER, SAME, []],
    ["first input + cancel", FIRST, CANCEL, INACTIVE_ZOOM_STATE, ["announce", "focus"]],
    ["first input + cancel by blur", FIRST, BLUR, INACTIVE_ZOOM_STATE, ["announce"]],
    ["first input + move", FIRST, MOVE, state({ type: "pendingFirstInput", cursorIndex: 8 }), []],
    ["first input + commit", FIRST, COMMIT, state({ type: "pendingSecondInput", startIndex: 3, cursorIndex: 3 }), ["announce"]], // prettier-ignore
    ["first input + rendered", FIRST, RENDERED, FIRST, []],

    ["second input + enter", SECOND, ENTER, SAME, []],
    ["second input + cancel", SECOND, CANCEL, INACTIVE_ZOOM_STATE, ["announce", "focus"]],
    ["second input + move", SECOND, MOVE, state({ type: "pendingSecondInput", startIndex: 2, cursorIndex: 8 }), []],
    ["second input + commit", SECOND, COMMIT, INACTIVE_ZOOM_STATE, ["applyZoom", "focus"]],
    ["second input + rendered", SECOND, RENDERED, SECOND, []],

    ["inactive + press start", INACTIVE_ZOOM_STATE, PRESS_START, state(INACTIVE_ZOOM_STATE.mode, PRESS), []],
    ["press + move under the drag threshold", state(INACTIVE_ZOOM_STATE.mode, PRESS), PRESS_NUDGE, SAME, []],
    ["press + move past the drag threshold", state(INACTIVE_ZOOM_STATE.mode, PRESS), PRESS_DRAG, state(INACTIVE_ZOOM_STATE.mode, DRAG), ["dragStart"]], // prettier-ignore
    ["drag + move", state(INACTIVE_ZOOM_STATE.mode, DRAG), { ...PRESS_DRAG, index: 8 }, state(INACTIVE_ZOOM_STATE.mode, { ...DRAG, currentIndex: 8 }), []], // prettier-ignore
    ["drag + move to the same point", state(INACTIVE_ZOOM_STATE.mode, DRAG), PRESS_DRAG, SAME, []],
    ["drag + press end", state(INACTIVE_ZOOM_STATE.mode, DRAG), PRESS_END, INACTIVE_ZOOM_STATE, ["applyZoom"]],
    ["drag + press end on a single point", state(INACTIVE_ZOOM_STATE.mode, DRAG), PRESS_END_ON_START, INACTIVE_ZOOM_STATE, []], // prettier-ignore
    ["drag in zoom mode + press end", state(FIRST_MODE, DRAG), PRESS_END, INACTIVE_ZOOM_STATE, ["applyZoom", "focus"]],
    ["press + press end", state(INACTIVE_ZOOM_STATE.mode, PRESS), PRESS_END, INACTIVE_ZOOM_STATE, []],
    ["press in first input + press end", state(FIRST_MODE, PRESS), PRESS_END, state({ type: "pendingSecondInput", startIndex: 4, cursorIndex: 4 }), ["announce"]], // prettier-ignore
    ["press in second input + press end", state(SECOND_MODE, PRESS), PRESS_END, INACTIVE_ZOOM_STATE, ["applyZoom", "focus"]], // prettier-ignore
    ["drag + press cancel", state(INACTIVE_ZOOM_STATE.mode, DRAG), PRESS_CANCEL, INACTIVE_ZOOM_STATE, []],
    ["inactive + press move", INACTIVE_ZOOM_STATE, PRESS_DRAG, SAME, []],
    ["inactive + press end", INACTIVE_ZOOM_STATE, PRESS_END, SAME, []],
    ["inactive + press cancel", INACTIVE_ZOOM_STATE, PRESS_CANCEL, SAME, []],

    ["drag in zoom mode + move", state(FIRST_MODE, DRAG), MOVE, SAME, []],
    ["drag in zoom mode + commit", state(FIRST_MODE, DRAG), COMMIT, SAME, []],
    ["drag in zoom mode + cancel", state(FIRST_MODE, DRAG), CANCEL, INACTIVE_ZOOM_STATE, ["announce", "focus"]],
    ["drag in zoom mode + cancel by blur", state(FIRST_MODE, DRAG), BLUR, state(INACTIVE_ZOOM_STATE.mode, DRAG), ["announce"]], // prettier-ignore
  ];

describe("zoomReducer", () => {
  test.each(TRANSITIONS)("%s", (_name, from, event, to, effects) => {
    const transition = reduce(from, event);

    expect(transition.state).toEqual(to === SAME ? from : to);
    expect(transition.effects.map((effect) => effect.type)).toEqual(effects);
    if (to === SAME) {
      expect(transition.state).toBe(from);
    }
  });

  test("cannot enter zoom mode when there is no narrower range left", () => {
    for (const valuesCount of [0, 1, 2]) {
      const transition = zoomReducer(INACTIVE_ZOOM_STATE, ENTER, { valuesCount });

      expect(transition.state).toBe(INACTIVE_ZOOM_STATE);
      expect(transition.effects).toEqual([]);
    }
  });

  test("goes back to the first input after a render removed the start point", () => {
    const { state } = zoomReducer(
      { mode: { type: "pendingSecondInput", startIndex: 7, cursorIndex: 8 }, press: null },
      { type: "rendered", stopMapper: createStopMapper([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 2, 3, 4]) },
      { valuesCount: 5 },
    );

    expect(state).toEqual({ mode: { type: "pendingFirstInput", cursorIndex: 4 }, press: null });
  });

  test("moves a drag to the nearest points after a render", () => {
    const { state } = zoomReducer(
      { mode: { type: "inactive" }, press: { ...DRAG, startIndex: 2, currentIndex: 8 } },
      { type: "rendered", stopMapper: createStopMapper([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 4, 8]) },
      { valuesCount: 3 },
    );

    expect(state.press).toEqual({ ...DRAG, startIndex: 0, currentIndex: 2 });
  });

  test("drops a drag when a render leaves no points", () => {
    const { state } = zoomReducer(
      { mode: { type: "inactive" }, press: DRAG },
      { type: "rendered", stopMapper: createStopMapper([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], []) },
      { valuesCount: 0 },
    );

    expect(state).toEqual(INACTIVE_ZOOM_STATE);
  });
});

function state(mode: ZoomMode, press: null | ZoomPress = null): ZoomState {
  return { mode, press };
}

function reduce(from: ZoomState, event: ZoomEvent) {
  return zoomReducer(from, event, { valuesCount: COUNT });
}

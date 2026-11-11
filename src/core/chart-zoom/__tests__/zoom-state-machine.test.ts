// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import {
  INACTIVE_ZOOM_STATE,
  isZooming,
  ZoomEffect,
  ZoomEvent,
  zoomReducer,
  ZoomState,
} from "../../../../lib/components/core/chart-zoom/zoom-state-machine";
import { createStopMapper } from "../../../../lib/components/core/chart-zoom/zoom-utils";

const COUNT = 10;

const FIRST: ZoomState = { type: "pendingFirstInput", cursorIndex: 3 };
const SECOND: ZoomState = { type: "pendingSecondInput", startIndex: 2, cursorIndex: 5 };

const ENTER: ZoomEvent = { type: "enter" };
const CANCEL: ZoomEvent = { type: "cancel", moveFocus: true };
const MOVE: ZoomEvent = { type: "move", index: 8 };
const COMMIT: ZoomEvent = { type: "commit" };
const RENDERED: ZoomEvent = { type: "rendered", stopMapper: { nearest: (index) => index, exact: (index) => index } };

const SAME = "same";

const TRANSITIONS: [name: string, from: ZoomState, event: ZoomEvent, to: ZoomState | typeof SAME, effects: string[]][] =
  [
    ["inactive + enter", INACTIVE_ZOOM_STATE, ENTER, { type: "pendingFirstInput", cursorIndex: 0 }, ["announce", "focus"]], // prettier-ignore
    ["inactive + cancel", INACTIVE_ZOOM_STATE, CANCEL, SAME, []],
    ["inactive + move", INACTIVE_ZOOM_STATE, MOVE, SAME, []],
    ["inactive + commit", INACTIVE_ZOOM_STATE, COMMIT, SAME, []],
    ["inactive + rendered", INACTIVE_ZOOM_STATE, RENDERED, SAME, []],

    ["first input + enter", FIRST, ENTER, SAME, []],
    ["first input + cancel", FIRST, CANCEL, INACTIVE_ZOOM_STATE, ["announce", "focus"]],
    ["first input + move", FIRST, MOVE, { type: "pendingFirstInput", cursorIndex: 8 }, []],
    ["first input + commit", FIRST, COMMIT, { type: "pendingSecondInput", startIndex: 3, cursorIndex: 3 }, ["announce"]], // prettier-ignore
    ["first input + rendered", FIRST, RENDERED, FIRST, []],

    ["second input + enter", SECOND, ENTER, SAME, []],
    ["second input + cancel", SECOND, CANCEL, INACTIVE_ZOOM_STATE, ["announce", "focus"]],
    ["second input + move", SECOND, MOVE, { type: "pendingSecondInput", startIndex: 2, cursorIndex: 8 }, []],
    ["second input + commit", SECOND, COMMIT, INACTIVE_ZOOM_STATE, ["applyZoom", "focus"]],
    ["second input + rendered", SECOND, RENDERED, SECOND, []],
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

  test("zooms into the range between the two committed inputs", () => {
    const first = reduce(reduce(INACTIVE_ZOOM_STATE, ENTER).state, { type: "move", index: 2 });
    const started = reduce(first.state, COMMIT);
    expect(started.effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 2 } }]);

    const second = reduce(started.state, { type: "move", index: 5 });
    const zoomed = reduce(second.state, COMMIT);
    expect(zoomed.state).toEqual(INACTIVE_ZOOM_STATE);
    expect(zoomed.effects).toEqual([
      { type: "applyZoom", fromIndex: 2, toIndex: 5 },
      { type: "focus", target: "resetButton" },
    ]);
  });

  test("keeps the start point when the range would be a single stop", () => {
    const state: ZoomState = { type: "pendingSecondInput", startIndex: 4, cursorIndex: 4 };
    const transition = reduce(state, COMMIT);

    expect(transition.state).toBe(state);
    expect(transition.effects).toEqual([{ type: "announce", announcement: { type: "startPointSet", index: 4 } }]);
  });

  test("cannot enter zoom mode when there is no narrower range left", () => {
    for (const valuesCount of [0, 1, 2]) {
      const transition = zoomReducer(INACTIVE_ZOOM_STATE, ENTER, { valuesCount });

      expect(transition.state).toBe(INACTIVE_ZOOM_STATE);
      expect(transition.effects).toEqual([]);
    }
  });

  test("keeps the cursor within the stops the chart shows", () => {
    expect(reduce(FIRST, { type: "move", index: 100 }).state).toEqual({ type: "pendingFirstInput", cursorIndex: 9 });
    expect(reduce(FIRST, { type: "move", index: -100 }).state).toEqual({ type: "pendingFirstInput", cursorIndex: 0 });
  });

  test("goes back to the first input after a render removed the start point", () => {
    const { state } = zoomReducer(
      { type: "pendingSecondInput", startIndex: 7, cursorIndex: 8 },
      { type: "rendered", stopMapper: createStopMapper([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 1, 2, 3, 4]) },
      { valuesCount: 5 },
    );

    expect(state).toEqual({ type: "pendingFirstInput", cursorIndex: 4 });
  });

  test("keeps the inputs on their values when the stops change", () => {
    const { state } = zoomReducer(
      { type: "pendingSecondInput", startIndex: 2, cursorIndex: 3 },
      { type: "rendered", stopMapper: createStopMapper([0, 10, 20, 30, 40], [0, 20, 30, 40]) },
      { valuesCount: 4 },
    );

    expect(state).toEqual({ type: "pendingSecondInput", startIndex: 1, cursorIndex: 2 });
  });

  test("leaves zoom mode after a render that left no stops to select", () => {
    for (const state of [FIRST, SECOND]) {
      const transition = zoomReducer(state, RENDERED, { valuesCount: 0 });

      expect(transition.state).toEqual(INACTIVE_ZOOM_STATE);
      expect(transition.effects).toEqual([
        { type: "announce", announcement: { type: "zoomModeExited" } },
        { type: "focus", target: "zoomButton" },
      ]);
    }
  });

  test("only moves the focus when asked to", () => {
    expect(effectTypes(reduce(FIRST, { type: "cancel", moveFocus: false }))).toEqual(["announce"]);
  });

  test.each([
    [INACTIVE_ZOOM_STATE, false],
    [FIRST, true],
    [SECOND, true],
  ])("tells whether zooming is in progress in the %# state", (state, zooming) => {
    expect(isZooming(state)).toBe(zooming);
  });
});

function reduce(state: ZoomState, event: ZoomEvent) {
  return zoomReducer(state, event, { valuesCount: COUNT });
}

function effectTypes({ effects }: { effects: readonly ZoomEffect[] }) {
  return effects.map((effect) => effect.type);
}

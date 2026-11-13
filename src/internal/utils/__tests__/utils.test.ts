// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";

import { DebouncedCall, escapeHtml } from "../../../../lib/components/internal/utils/utils";

describe("escapeHtml", () => {
  test.each([
    ["", ""],
    ["plain text", "plain text"],
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
    ["'", "&#x27;"],
    ["<script>alert('x')</script>", "&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;"],
    ["&amp;", "&amp;amp;"],
    ["🍕 ünïcødé", "🍕 ünïcødé"],
  ])("escapes %j", (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });
});

describe("DebouncedCall", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("keeps a pending call for the same key instead of restarting the delay", () => {
    const debounced = new DebouncedCall<string>();
    const first = vi.fn();
    const second = vi.fn();

    expect(debounced.call(first, 100, "a")).toBe(true);
    vi.advanceTimersByTime(60);
    expect(debounced.call(second, 100, "a")).toBe(false);
    vi.advanceTimersByTime(40);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  test("replaces a pending call for a different key", () => {
    const debounced = new DebouncedCall<string>();
    const first = vi.fn();
    const second = vi.fn();

    debounced.call(first, 100, "a");
    vi.advanceTimersByTime(60);
    debounced.call(second, 100, "b");
    vi.advanceTimersByTime(60);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(40);

    expect(second).toHaveBeenCalledTimes(1);
  });

  test("compares keys with the given function", () => {
    const debounced = new DebouncedCall<{ id: string }>((a, b) => a.id === b.id);
    const first = vi.fn();

    debounced.call(first, 100, { id: "a" });
    expect(debounced.call(vi.fn(), 100, { id: "a" })).toBe(false);
    vi.advanceTimersByTime(100);

    expect(first).toHaveBeenCalledTimes(1);
  });

  test("runs the pending call at once on flush", () => {
    const debounced = new DebouncedCall();
    const callback = vi.fn();

    debounced.call(callback, 100);
    debounced.flush();
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("reports whether a call was pending when cancelled", () => {
    const debounced = new DebouncedCall();
    const callback = vi.fn();

    debounced.call(callback, 100);

    expect(debounced.cancelPrevious()).toBe(true);
    expect(debounced.cancelPrevious()).toBe(false);
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  test("calls at once without a delay", () => {
    const debounced = new DebouncedCall<string>();
    const callback = vi.fn();

    expect(debounced.call(callback, -1, "a")).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(debounced.cancelPrevious()).toBe(false);
  });
});

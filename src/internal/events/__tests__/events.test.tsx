// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CustomEventStub, fireCancelableEvent } from "..";

describe("CustomEventStub", () => {
  it("should initialize with default values", () => {
    const event = new CustomEventStub();

    expect(event.defaultPrevented).toBe(false);
    expect(event.cancelBubble).toBe(false);
    expect(event.cancelable).toBe(false);
    expect(event.detail).toBeNull();
  });

  it("should initialize with provided values", () => {
    const detail = { key: "value" };
    const event = new CustomEventStub(true, detail);

    expect(event.cancelable).toBe(true);
    expect(event.detail).toBe(detail);
  });

  it("should set defaultPrevented to true when preventDefault is called", () => {
    const event = new CustomEventStub();
    event.preventDefault();

    expect(event.defaultPrevented).toBe(true);
  });

  it("should set cancelBubble to true when stopPropagation is called", () => {
    const event = new CustomEventStub();
    event.stopPropagation();

    expect(event.cancelBubble).toBe(true);
  });

  it("should work with generic detail type", () => {
    const event = new CustomEventStub<string>(false, "Test detail");

    expect(event.detail).toBe("Test detail");
    expect(typeof event.detail).toBe("string");
  });
});

describe("fireCancelableEvent", () => {
  it("should call the handler with a cancelable event and return the result", () => {
    const handler = vi.fn();
    const detail = { key: "value" };

    const result = fireCancelableEvent(handler, detail);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.cancelable).toBe(true);
    expect(event.detail).toEqual(detail);
    expect(result).toBe(false);
  });

  it("should prevent the default action if preventDefault is called in the handler", () => {
    const handler = vi.fn((event) => {
      event.preventDefault();
    });
    const detail = { key: "value" };

    const result = fireCancelableEvent(handler, detail);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.defaultPrevented).toBe(true);

    expect(result).toBe(true);
  });

  it("should call sourceEvent.preventDefault() when event.defaultPrevented is true", () => {
    const handler = vi.fn((event) => {
      event.preventDefault();
    });
    const detail = { key: "value" };
    const mockSourceEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as any;

    const result = fireCancelableEvent(handler, detail, mockSourceEvent);

    expect(handler).toHaveBeenCalled();
    expect(mockSourceEvent.preventDefault).toHaveBeenCalled();
    expect(result).toBe(true); // Ensures the event's default was prevented
  });

  it("should stop propagation if stopPropagation is called in the handler", () => {
    const handler = vi.fn((event) => {
      event.stopPropagation();
    });
    const detail = { key: "value" };
    const mockSourceEvent = { stopPropagation: vi.fn() };

    const result = fireCancelableEvent(handler, detail, mockSourceEvent as unknown as Event);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.cancelBubble).toBe(true);
    expect(mockSourceEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });

  it("should not call preventDefault or stopPropagation on sourceEvent if the event handler does not trigger them", () => {
    const handler = vi.fn();
    const detail = { key: "value" };
    const mockSourceEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };

    fireCancelableEvent(handler, detail, mockSourceEvent as unknown as Event);

    expect(mockSourceEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockSourceEvent.stopPropagation).not.toHaveBeenCalled();
  });

  it("should return false if no handler is provided", () => {
    const result = fireCancelableEvent(undefined, { key: "value" });

    expect(result).toBe(false);
  });
});

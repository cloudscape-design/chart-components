// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type CancelableEventHandler<Detail = object> = (event: CustomEvent<Detail>) => void;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NonCancelableEventHandler<Detail = {}> = (event: NonCancelableCustomEvent<Detail>) => void;

export type NonCancelableCustomEvent<DetailType> = Omit<CustomEvent<DetailType>, "preventDefault">;

export interface ClickDetail {
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export class CustomEventStub<T> {
  defaultPrevented = false;
  cancelBubble = false;
  constructor(
    public cancelable: boolean = false,
    public detail: T | null = null,
  ) {}

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this.cancelBubble = true;
  }
}

export function createCustomEvent<T>({ cancelable, detail }: CustomEventInit<T>): CustomEvent<T> {
  return new CustomEventStub(cancelable, detail) as CustomEvent;
}

export function fireCancelableEvent<T>(
  handler: CancelableEventHandler<T> | undefined,
  detail: T,
  sourceEvent?: React.SyntheticEvent | Event,
) {
  if (!handler) {
    return false;
  }
  const event = createCustomEvent({ cancelable: true, detail });
  handler(event);
  if (event.defaultPrevented && sourceEvent) {
    sourceEvent.preventDefault();
  }
  if (event.cancelBubble && sourceEvent) {
    sourceEvent.stopPropagation();
  }
  return event.defaultPrevented;
}

export function fireNonCancelableEvent<T = null>(handler: NonCancelableEventHandler<T> | undefined, detail?: T) {
  if (!handler) {
    return;
  }
  const event = createCustomEvent({ cancelable: false, detail });
  handler(event);
}

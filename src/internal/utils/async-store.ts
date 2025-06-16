// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useLayoutEffect, useState } from "react";

import { usePrevious } from "./use-previous";

type Selector<S, R> = (state: S) => R;
type Listener<S> = (state: S, prevState: S) => void;

export interface ReadonlyAsyncStore<S> {
  get(): S;
  subscribe<R>(selector: Selector<S, R>, listener: Listener<S>): () => void;
  unsubscribe(listener: Listener<S>): void;
}

export default class AsyncStore<S> implements ReadonlyAsyncStore<S> {
  private _state: S;
  private _listeners: [Selector<S, unknown>, Listener<S>][] = [];

  constructor(state: S) {
    this._state = state;
  }

  public get(): S {
    return this._state;
  }

  public set(cb: (state: S) => S): void {
    const prevState = this._state;
    const newState = cb(prevState);

    this._state = newState;

    for (const [selector, listener] of this._listeners) {
      if (selector(prevState) !== selector(newState)) {
        listener(newState, prevState);
      }
    }
  }

  public subscribe<R>(selector: Selector<S, R>, listener: Listener<S>): () => void {
    this._listeners.push([selector, listener]);

    return () => this.unsubscribe(listener);
  }

  public unsubscribe(listener: Listener<S>): void {
    this._listeners = this._listeners.filter(([, storedListener]) => storedListener !== listener);
  }
}

export function useReaction<S, R>(store: ReadonlyAsyncStore<S>, selector: Selector<S, R>, effect: Listener<R>): void {
  useLayoutEffect(
    () => {
      const unsubscribe = store.subscribe(selector, (newState, prevState) =>
        effect(selector(newState), selector(prevState)),
      );
      return unsubscribe;
    },
    // ignoring selector and effect as they are expected to stay constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store],
  );
}

export function useSelector<S, R>(store: ReadonlyAsyncStore<S>, selector: Selector<S, R>): R {
  const [state, setState] = useState<R>(selector(store.get()));

  useReaction(store, selector, (newState) => {
    setState(newState);
  });

  useLayoutEffect(
    () => {
      setState(selector(store.get()));
    },
    // ignoring selector as we only need a single time update
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // When store changes we need the state to be updated synchronously to avoid inconsistencies.
  const prevStore = usePrevious(store);
  if (prevStore !== null && prevStore !== store) {
    return selector(store.get());
  }

  return state;
}

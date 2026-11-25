// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { DebouncedCall, isEqualArrays } from "../../internal/utils/utils";

export type HighlightSource = "pointer" | "legend" | "api";

export type HighlightKey = string | readonly string[] | Highcharts.Point | readonly Highcharts.Point[];

export interface PendingHighlight {
  source: HighlightSource;
  key: HighlightKey;
}

type CancelListener = (pending: PendingHighlight, detail: { notify: boolean }) => void;

export class HighlightScheduler {
  private call = new DebouncedCall();
  private pending: null | (PendingHighlight & { commit: () => boolean }) = null;
  private cancelListeners: CancelListener[] = [];

  constructor(private getDelay: () => null | number) {}

  public get pendingSource(): null | HighlightSource {
    return this.pending?.source ?? null;
  }

  public onCancel(listener: CancelListener) {
    this.cancelListeners.push(listener);
  }

  public schedule(source: HighlightSource, key: HighlightKey, commit: () => boolean): boolean {
    if (this.pending && this.pending.source === source && isSameHighlightKey(this.pending.key, key)) {
      return false;
    }
    this.cancel({ notify: false });
    const delay = this.getDelay();
    if (!delay) {
      commit();
      return false;
    }
    this.pending = { source, key, commit };
    this.call.call(this.flush, delay);
    return true;
  }

  public flush = () => {
    const pending = this.pending;
    if (pending) {
      this.pending = null;
      this.call.cancelPending();
      if (!pending.commit()) {
        this.notifyCancel(pending, true);
      }
    }
  };

  public cancel({ notify = true }: { notify?: boolean } = {}): boolean {
    const pending = this.pending;
    if (!pending) {
      return false;
    }
    this.pending = null;
    this.call.cancelPending();
    this.notifyCancel(pending, notify);
    return true;
  }

  public destroy() {
    this.pending = null;
    this.call.cancelPending();
  }

  private notifyCancel(pending: PendingHighlight, notify: boolean) {
    this.cancelListeners.forEach((listener) => listener(pending, { notify }));
  }
}

export function isSameHighlightKey(a: HighlightKey, b: HighlightKey) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return isEqualArrays(a, b, (x, y) => x === y);
  }
  return a === b;
}

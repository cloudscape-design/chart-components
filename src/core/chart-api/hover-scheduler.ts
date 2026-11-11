// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DebouncedCall } from "../../internal/utils/utils";

export class HoverScheduler<Target> {
  private call = new DebouncedCall();
  private pending: null | { target: Target; apply: () => void } = null;

  constructor(
    private getDelay: () => number,
    private isSameTarget: (a: Target, b: Target) => boolean,
  ) {}

  public schedule(target: Target, apply: () => void): boolean {
    const delay = this.getDelay();
    if (delay <= 0) {
      this.cancel();
      apply();
      return false;
    }
    if (this.pending && this.isSameTarget(this.pending.target, target)) {
      return false;
    }
    this.pending = { target, apply };
    this.call.call(this.flush, delay);
    return true;
  }

  public flush = () => {
    const pending = this.pending;
    this.cancel();
    pending?.apply();
  };

  public cancel = () => {
    const hadPending = this.pending !== null;
    this.call.cancelPrevious();
    this.pending = null;
    return hadPending;
  };
}

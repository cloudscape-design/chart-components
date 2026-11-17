// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe } from "vitest";

import { ZoomOptions } from "../../../lib/components/core/internal-interfaces";

let currentZoom: undefined | ZoomOptions = undefined;

export function getTestZoom() {
  return currentZoom;
}

export function describeWithAndWithoutZoom(name: string, fn: () => void) {
  describe.each([
    { label: "zoom off", zoom: undefined },
    { label: "zoom on", zoom: { enabled: true } },
  ])(`${name}, $label`, ({ zoom }) => {
    beforeEach(() => {
      currentZoom = zoom;
    });
    afterEach(() => {
      currentZoom = undefined;
    });
    fn();
  });
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

import { DebouncedCall } from "./utils";

export function useDebouncedValue<T>(value: T, duration: number) {
  const [debouncedValue, setDebouncedValue] = useState<T | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const debouncedCall = useRef(new DebouncedCall());

  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    setShouldRender(false);
    const current = debouncedCall.current;
    current.call(() => {
      setDebouncedValue(value);
      setShouldRender(true);
    }, duration);

    return () => current.cancelPrevious();
  }, [value, duration]);

  if (duration <= 0) {
    return value;
  }

  return shouldRender ? debouncedValue : null;
}

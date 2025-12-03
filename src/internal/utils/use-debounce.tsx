// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

import { DebouncedCall } from "./utils";

export function useDebounce<T>(component: T, duration: number) {
  const [debouncedComponent, setDebouncedComponent] = useState<T | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const debouncedCall = useRef(new DebouncedCall());

  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    setShouldRender(false);
    const current = debouncedCall.current;
    current.call(() => {
      setDebouncedComponent(component);
      setShouldRender(true);
    }, duration);

    return () => current.cancelPrevious();
  }, [component, duration]);

  if (duration <= 0) {
    return component;
  }

  return shouldRender ? debouncedComponent : null;
}

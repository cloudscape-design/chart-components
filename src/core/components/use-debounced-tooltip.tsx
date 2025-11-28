// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

import { useSelector } from "../../internal/utils/async-store";
import { DebouncedCall } from "../../internal/utils/utils";
import { ChartAPI } from "../chart-api";
import { ReactiveTooltipState } from "../chart-api/chart-extra-tooltip";

export function useDebouncedTooltip(api: ChartAPI, renderDebounceDuration: number = 500) {
  const tooltip = useSelector(api.tooltipStore, (s) => s);
  const [debouncedTooltip, setDebouncedTooltip] = useState<ReactiveTooltipState | null>(null);
  const [shouldRender, setShouldRender] = useState(renderDebounceDuration <= 0);
  const debouncedCall = useRef(new DebouncedCall());

  useEffect(() => {
    if (renderDebounceDuration <= 0) {
      setDebouncedTooltip(tooltip);
      setShouldRender(true);
    } else {
      setShouldRender(false);
      debouncedCall.current.call(() => {
        setDebouncedTooltip(tooltip);
        setShouldRender(true);
      }, renderDebounceDuration);
    }
  }, [renderDebounceDuration, tooltip]);

  return shouldRender ? debouncedTooltip : null;
}

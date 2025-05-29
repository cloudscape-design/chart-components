// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";

export function ChartApplication({ keyboardNavigation, api }: { keyboardNavigation: boolean; api: ChartAPI }) {
  const ariaLabel = useSelector(api.store, (s) => s.chartLabel);
  const isNoData = !!useSelector(api.store, (s) => s.noData.container);
  return keyboardNavigation && !isNoData ? (
    // Do not remove the empty outer div. It is used to contain the application element to perform
    // focus juggling, necessary to trigger a screen-reader announcement.
    <div>
      <div ref={api.setApplication} tabIndex={0} role="application" aria-label={ariaLabel} />
    </div>
  ) : null;
}

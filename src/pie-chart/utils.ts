// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getOptionsId } from "../core/utils";
import { InternalSeriesOptions } from "./interfaces-pie";

export function getAllSegmentIds(series: InternalSeriesOptions[]): string[] {
  const allSegmentIds = series.flatMap((s) => {
    const itemIds: string[] = [];
    if ((s.type === "pie" || s.type === "donut") && s.data) {
      for (const dataItem of s.data) {
        if (dataItem && typeof dataItem === "object" && !Array.isArray(dataItem)) {
          itemIds.push(getOptionsId(dataItem));
        }
      }
    }
    return itemIds;
  });
  return allSegmentIds;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LiveRegion from "@cloudscape-design/components/live-region";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";

export function ChartZoomLiveRegion({ api }: { api: ChartAPI }) {
  const announcement = useSelector(api.zoomStore, (s) => s.announcement);
  const announcementKey = useSelector(api.zoomStore, (s) => s.announcementKey);
  return (
    <LiveRegion key={announcementKey} hidden={true}>
      {announcement}
    </LiveRegion>
  );
}

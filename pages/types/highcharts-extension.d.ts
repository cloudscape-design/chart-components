// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ChartSeriesMarkerStatus } from "../src/internal/components/series-marker";

declare module "highcharts" {
  interface SeriesOptions {
    status?: ChartSeriesMarkerStatus;
  }
}

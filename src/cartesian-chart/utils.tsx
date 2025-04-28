// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

export function getDataExtremes(axis?: Highcharts.Axis): [number, number] {
  const extremes = axis?.getExtremes();
  return [extremes?.dataMin ?? 0, extremes?.dataMax ?? 0];
}

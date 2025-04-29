// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Highcharts from "highcharts";

import { colorTextBodySecondary, fontFamilyBase, fontSizeBodyS } from "@cloudscape-design/design-tokens";

export const donutInnerValueCss: Highcharts.CSSObject = {
  fontSize: "28",
  fontWeight: "bold",
};

export const donutInnerDescriptionCss: Highcharts.CSSObject = {
  fontSize: "18",
  fontWeight: "bold",
  color: colorTextBodySecondary,
};

export const segmentDescriptionCss: React.CSSProperties = {
  fontFamily: fontFamilyBase,
  fontWeight: "normal",
  fontSize: fontSizeBodyS,
  color: colorTextBodySecondary,
};

export const segmentBorderWidth = 2;

export const pieSeriesSize = "80%";
export const donutSeriesSize = "80%";
export const donutSeriesInnerSize = "80%";

export const innerDescriptionZIndex = 5;

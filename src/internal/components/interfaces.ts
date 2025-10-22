// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface LegendItem {
  id: string;
  name: string;
  marker: React.ReactNode;
  visible: boolean;
  highlighted: boolean;
}

export type GetLegendTooltipContent = (props: GetLegendTooltipContentProps) => LegendTooltipContent;

export interface GetLegendTooltipContentProps {
  legendItem: LegendItem;
}

export interface LegendTooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

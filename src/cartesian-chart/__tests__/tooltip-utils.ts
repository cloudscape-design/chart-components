// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import createWrapper from "../../../lib/components/test-utils/dom";

export const getChart = () => createWrapper().findChart("cartesian")!;
export const getTooltip = () => getChart().findTooltip()!;
export const getTooltipHeader = () => getChart().findTooltip()!.findHeader()!;
export const getTooltipBody = () => getChart().findTooltip()!.findBody()!;
export const getTooltipFooter = () => getChart().findTooltip()!.findFooter()!;
export const getAllTooltipSeries = () => getChart().findTooltip()!.findSeries();
export const getTooltipSeries = (index: number) => getAllTooltipSeries()[index];

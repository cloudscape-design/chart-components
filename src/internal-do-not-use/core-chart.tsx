// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps } from "../core/interfaces-core";
import useBaseComponent from "../internal/base-component/use-base-component";

export default function CoreChart(props: CoreChartProps) {
  const baseComponentProps = useBaseComponent("ChartCore", { props: {} });
  return <InternalCoreChart {...props} {...baseComponentProps} />;
}

export type { CoreChartProps };

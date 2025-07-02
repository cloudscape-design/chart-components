// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InternalCoreChart } from "../core/chart-core";
import { type CoreChartProps } from "../core/interfaces";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";

export { CoreChartProps };

function CoreChart(props: CoreChartProps) {
  const baseComponentProps = useBaseComponent("ChartCore", { props: {} });
  return <InternalCoreChart {...props} {...baseComponentProps} />;
}

applyDisplayName(CoreChart, "CoreChart");

export default CoreChart;

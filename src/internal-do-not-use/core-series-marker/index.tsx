// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useBaseComponent from "../../internal/base-component/use-base-component";
import { ChartSeriesMarker, type ChartSeriesMarkerProps } from "../../internal/components/series-marker";
import { applyDisplayName } from "../../internal/utils/apply-display-name";

export { ChartSeriesMarkerProps };

function CoreSeriesMarker(props: ChartSeriesMarkerProps) {
  const baseComponentProps = useBaseComponent("ChartSeriesMarker", { props: {} });
  return <ChartSeriesMarker {...props} {...baseComponentProps} />;
}

applyDisplayName(CoreSeriesMarker, "CoreSeriesMarker");

export default CoreSeriesMarker;

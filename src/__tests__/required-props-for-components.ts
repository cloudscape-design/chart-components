// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const defaultProps: Record<string, Record<string, any>> = {
  "pie-chart": { series: null },
  "cartesian-chart": { series: [] },
};

export function getRequiredPropsForComponent(componentName: string): Record<string, any> {
  return defaultProps[componentName] || {};
}

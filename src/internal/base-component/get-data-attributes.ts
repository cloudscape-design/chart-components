// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function getDataAttributes(props: Record<string, any>) {
  const result: Record<string, any> = {};
  Object.keys(props).forEach((prop) => {
    if (prop.startsWith("data-") && typeof props[prop] === "string") {
      result[prop] = props[prop];
    }
  });
  return result;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Calculates the sum of values in an array
 */
export default function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

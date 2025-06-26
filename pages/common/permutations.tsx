// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import flatten from "lodash/flatten";

import SpaceBetween from "@cloudscape-design/components/space-between";

export type ComponentPermutations<Props> = {
  [prop in keyof Props]: ReadonlyArray<Props[prop]>;
};

export function createPermutations<Props>(permutations: Array<ComponentPermutations<Props>>) {
  return flatten(permutations.map((set) => doCreatePermutations(set)));
}

function doCreatePermutations<Props>(permutations: ComponentPermutations<Props>) {
  const result: Props[] = [];
  const propertyNames = Object.keys(permutations) as Array<keyof Props>;

  function addPermutations(remainingPropertyNames: Array<keyof Props>, currentPropertyValues: Partial<Props>) {
    if (remainingPropertyNames.length === 0) {
      result.push({ ...currentPropertyValues } as Props);
      return;
    }

    const propertyName = remainingPropertyNames[0];

    permutations[propertyName].forEach((propertyValue) => {
      currentPropertyValues[propertyName] = propertyValue;
      addPermutations(remainingPropertyNames.slice(1), currentPropertyValues);
    });
  }

  addPermutations(propertyNames, {});

  return result;
}

interface PermutationsViewProps<T> {
  permutations: ReadonlyArray<T>;
  render: (props: T, index?: number) => React.ReactElement;
  direction?: "vertical" | "horizontal";
}

function formatValue(key: string, value: any) {
  if (typeof value === "function") {
    return value.toString();
  }
  if (value && value.$$typeof) {
    return JSON.stringify(value);
  }
  return value;
}

const maximumPermutations = 276;

export default function PermutationsView<T>({
  permutations,
  render,
  direction = "vertical",
}: PermutationsViewProps<T>) {
  if (permutations.length > maximumPermutations) {
    throw new Error(`Too many permutations (${permutations.length}), maximum is ${maximumPermutations}`);
  }

  return (
    <SpaceBetween size="m" direction={direction}>
      {permutations.map((permutation, index) => {
        const id = JSON.stringify(permutation, formatValue);
        return (
          <div key={id} data-permutation={id}>
            {render(permutation, index)}
          </div>
        );
      })}
    </SpaceBetween>
  );
}

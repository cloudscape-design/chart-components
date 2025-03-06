// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";

export function ReorderableList({
  options,
  onReorder,
  onRemove,
}: {
  options: readonly string[];
  onReorder: (options: readonly string[]) => void;
  onRemove: (option: string) => void;
}) {
  const moveUp = (index: number) => {
    const option = options[index];
    const newOptions = [...options];
    newOptions.splice(index, 1);
    newOptions.splice(index - 1, 0, option);
    onReorder(newOptions);
  };
  const moveDown = (index: number) => {
    const option = options[index];
    const newOptions = [...options];
    newOptions.splice(index, 1);
    newOptions.splice(index + 1, 0, option);
    onReorder(newOptions);
  };
  return (
    <ul role="list">
      {options.map((option, index) => (
        <li key={option}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <div>
              <Button
                variant="inline-icon"
                ariaLabel="Move up"
                iconName="arrow-up"
                onClick={() => moveUp(index)}
                disabled={index === 0}
              />
              <Button
                variant="inline-icon"
                ariaLabel="Move down"
                iconName="arrow-down"
                onClick={() => moveDown(index)}
                disabled={index === options.length - 1}
              />
              <label>{option}</label>
            </div>

            <Button variant="inline-icon" iconName="remove" onClick={() => onRemove(option)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { usePageSettings } from "./page-settings";

const placementOptions = [{ value: "target" }, { value: "bottom" }];

const sizeOptions = [{ value: "small" }, { value: "medium" }, { value: "large" }];

export function TooltipSettings() {
  const {
    settings: { tooltipPlacement = "target", tooltipSize = "medium" },
    setSettings,
  } = usePageSettings();
  return (
    <SpaceBetween size="s">
      <FormField label="Tooltip placement">
        <Select
          options={placementOptions}
          selectedOption={placementOptions.find((option) => option.value === tooltipPlacement) ?? placementOptions[0]}
          onChange={({ detail }) =>
            setSettings({ tooltipPlacement: detail.selectedOption.value as string as "target" | "bottom" })
          }
        />
      </FormField>

      <FormField label="Tooltip size">
        <Select
          options={sizeOptions}
          selectedOption={sizeOptions.find((option) => option.value === tooltipSize) ?? sizeOptions[1]}
          onChange={({ detail }) =>
            setSettings({ tooltipSize: detail.selectedOption.value as string as "small" | "medium" | "large" })
          }
        />
      </FormField>
    </SpaceBetween>
  );
}

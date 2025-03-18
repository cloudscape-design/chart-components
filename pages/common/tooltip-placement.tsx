// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";

import { usePageSettings } from "./page-settings";

const options = [{ value: "target" }, { value: "bottom" }];

export function TooltipPlacement() {
  const {
    settings: { tooltipPlacement = "target" },
    setSettings,
  } = usePageSettings();
  return (
    <FormField label="Tooltip placement">
      <div style={{ maxWidth: 300 }}>
        <Select
          options={options}
          selectedOption={options.find((option) => option.value === tooltipPlacement) ?? options[0]}
          onChange={({ detail }) =>
            setSettings({ tooltipPlacement: detail.selectedOption.value as string as "target" | "bottom" })
          }
        />
      </div>
    </FormField>
  );
}

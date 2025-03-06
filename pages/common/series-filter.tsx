// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import FormField from "@cloudscape-design/components/form-field";
import Multiselect from "@cloudscape-design/components/multiselect";

import { usePageSettings } from "./page-settings";

export function SeriesFilter({ allSeries }: { allSeries: string[] }) {
  const { settings, setSettings } = usePageSettings();
  const options = allSeries.map((value) => ({ value, label: value }));
  return (
    <FormField label="Visible series">
      <div style={{ maxWidth: 300 }}>
        <Multiselect
          options={options}
          selectedOptions={options.filter((option) => settings.visibleContent.includes(option.value))}
          onChange={({ detail }) =>
            setSettings({ visibleContent: detail.selectedOptions.map((option) => option.value!) })
          }
          inlineTokens={true}
        />
      </div>
    </FormField>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Autosuggest from "@cloudscape-design/components/autosuggest";
import Box from "@cloudscape-design/components/box";
import FormField from "@cloudscape-design/components/form-field";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { usePageSettings } from "./page-settings";
import { ReorderableList } from "./reorderable-list";

export function SeriesSelector({ allSeries }: { allSeries: string[] }) {
  const { settings, setSettings } = usePageSettings();
  const [autosuggestValue, setAutosuggestValue] = useState("");
  const availableSeries = allSeries.filter((s) => !settings.selectedSeries.includes(s));
  return (
    <FormField
      label={
        <Box variant="span" fontWeight="bold">
          Selected series{" "}
          <Box variant="span" color="text-body-secondary">
            ({settings.selectedSeries.length})
          </Box>
        </Box>
      }
    >
      <div style={{ maxWidth: 300 }}>
        <SpaceBetween size="s">
          <Autosuggest
            options={availableSeries.map((value) => ({ value }))}
            value={autosuggestValue}
            onChange={({ detail }) => setAutosuggestValue(detail.value)}
            onSelect={({ detail }) => {
              const closest = availableSeries.find((seriesName) => seriesName.includes(detail.value));
              if (closest) {
                setSettings({ selectedSeries: [...new Set([...settings.selectedSeries, closest])] });
              }
              setAutosuggestValue("");
            }}
            enteredTextLabel={(value) => {
              const closest = availableSeries.find((seriesName) => seriesName.includes(value));
              return closest ? `Use "${closest}"` : "Clear input";
            }}
          />

          <ReorderableList
            options={settings.selectedSeries}
            onReorder={(selectedSeries) => setSettings({ selectedSeries: [...selectedSeries] })}
            onRemove={(removedSeries) =>
              setSettings({ selectedSeries: settings.selectedSeries.filter((s) => s !== removedSeries) })
            }
          />
        </SpaceBetween>
      </div>
    </FormField>
  );
}

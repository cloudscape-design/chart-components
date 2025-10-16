// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Checkbox from "@cloudscape-design/components/checkbox";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { dateFormatter } from "../common/formatters";
import { PageSettings, PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

interface ThisPageSettings extends PageSettings {
  boostEnabled: boolean;
}

export default function () {
  const {
    settings: { boostEnabled = false },
    setSettings,
  } = useChartSettings<ThisPageSettings>();
  return (
    <Page
      title="Boost module"
      subtitle="This demonstrates the use of the boost module"
      settings={
        <PageSettingsForm
          selectedSettings={[
            {
              content: (
                <Checkbox
                  checked={boostEnabled}
                  onChange={({ detail }) => setSettings({ boostEnabled: detail.checked })}
                >
                  Enable boost module
                </Checkbox>
              ),
            },
          ]}
        />
      }
    >
      <Component boostEnabled={boostEnabled} />
    </Page>
  );
}

const domain: number[] = [];
for (
  let time = new Date("2015-01-01").getTime();
  time < new Date("2025-01-01").getTime();
  time += 12 * 60 * 60 * 1000
) {
  domain.push(time);
}
function Component({ boostEnabled }: { boostEnabled: boolean }) {
  const { chartProps } = useChartSettings({ boost: true });
  return (
    <CoreChart
      {...chartProps.cartesian}
      chartHeight={500}
      options={{
        boost: { enabled: boostEnabled },
        plotOptions: { series: { boostThreshold: 1 } },
        series: [
          {
            name: "Site 1",
            type: "spline",
            data: domain.map((x, index) => ({
              x,
              y: Math.round(1000 + pseudoRandom() * 10 * index),
            })),
          },
          {
            name: "Site 2",
            type: "spline",
            data: domain.map((x, index) => ({
              x,
              y: Math.round(99_000 - pseudoRandom() * 10 * index),
            })),
          },
        ],
        xAxis: [
          {
            type: "linear",
            title: { text: "Time (UTC)" },
            min: domain[0],
            max: domain[domain.length - 1],
            valueFormatter: dateFormatter,
          },
        ],
        yAxis: [{ title: { text: "Bytes transferred" }, min: 0, max: 100_000 }],
      }}
      ariaLabel="Large chart"
      tooltip={{
        placement: "outside",
      }}
    />
  );
}

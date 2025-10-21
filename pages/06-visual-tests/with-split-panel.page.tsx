// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Link from "@cloudscape-design/components/link";
import SplitPanel from "@cloudscape-design/components/split-panel";

import { PieChart } from "../../lib/components";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { moneyFormatter } from "../common/formatters";
import { PageSettings, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

interface ThisPageSettings extends PageSettings {
  visibleItems: string;
}

const categories = ["Jun 2019", "Jul 2019", "Aug 2019", "Sep 2019", "Oct 2019", "Nov 2019", "Dec 2019"];

export default function () {
  const [splitPanelContent, setSplitPanelContent] = useState("");
  const chartSplitPanelProps = {
    onToggle: (content: string) => setSplitPanelContent((prev) => (prev === content ? "" : content)),
  };
  return (
    <Page
      title="Chart with split panel demo"
      subtitle="This page demonstrates opening a split panel from inside chart's tooltip."
      splitPanel={<SplitPanel header="Details">{splitPanelContent}</SplitPanel>}
      splitPanelOpen={splitPanelContent !== ""}
      splitPanelPreferences={{ position: "side" }}
      onSplitPanelToggle={() => setSplitPanelContent((prev) => (prev ? "" : "generic content"))}
    >
      <Container>
        <ColumnLayout columns={2}>
          <LineChartDemo splitPanel={chartSplitPanelProps} />
          <PieChartDemo splitPanel={chartSplitPanelProps} />
        </ColumnLayout>
      </Container>
    </Page>
  );
}

function LineChartDemo({ splitPanel }: { splitPanel: { onToggle: (content: string) => void } }) {
  const { chartProps } = useChartSettings<ThisPageSettings>();
  return (
    <CoreChart
      {...chartProps.cartesian}
      chartHeight={200}
      ariaLabel="Line chart"
      legend={{ enabled: false }}
      options={{
        series: [
          {
            id: "Costs",
            name: "Costs",
            type: "line",
            data: [6562, 8768, 9742, 10464, 16777, 9956, 5876],
          },
        ],
        xAxis: [{ title: { text: "" }, type: "category", categories }],
        yAxis: [{ title: { text: "" } }],
      }}
      getTooltipContent={() => ({
        point: ({ item }) => {
          return {
            key: item.point.series.name,
            value: (
              <Link
                external={true}
                href="#"
                ariaLabel={`See details for ${item.point.series.name} (opens in a new tab)`}
              >
                {item.point.y !== null ? moneyFormatter(item.point.y!) : null}
              </Link>
            ),
          };
        },
        footer: (detail) => (
          <Button onClick={() => splitPanel.onToggle(`Line chart point, x=${detail.x}`)}>Toggle details</Button>
        ),
      })}
      callback={(api) => {
        setTimeout(() => {
          if (api.chart.series) {
            const seriesIndex = Math.min(api.chart.series.length - 1, 1);
            const point = api.chart.series[seriesIndex].data.find((p) => p.x === 2)!;
            api.highlightChartPoint(point);
            splitPanel.onToggle(`Line chart point, x=${point.x}`);
          }
        }, 0);
      }}
    />
  );
}

function PieChartDemo({ splitPanel }: { splitPanel: { onToggle: (content: string) => void } }) {
  const { chartProps } = useChartSettings<ThisPageSettings>();
  return (
    <PieChart
      {...chartProps.pie}
      chartHeight={200}
      ariaLabel="Pie chart"
      legend={{ enabled: false }}
      segmentTitle={() => ""}
      tooltip={{
        footer: (detail) => (
          <Button onClick={() => splitPanel.onToggle(`Pie chart point, segment=${detail.segmentName}`)}>
            Toggle details
          </Button>
        ),
      }}
      series={{
        name: "Resource count",
        type: "pie",
        data: [
          { name: "Running", y: 60 },
          { name: "Failed", y: 30 },
          { name: "In-progress", y: 10 },
        ],
      }}
    />
  );
}

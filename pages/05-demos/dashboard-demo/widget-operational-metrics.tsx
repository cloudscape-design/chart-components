// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { CartesianChart, CartesianChartProps } from "../../../lib/components";
import { dateFormatter } from "../../common/formatters";
import { useChartSettings } from "../../common/page-settings";

import styles from "./responsive-layout.module.scss";

const series: CartesianChartProps.SeriesOptions[] = [
  {
    name: "Value",
    type: "column",
    data: [170.25, 116.07, 54.19, 15.18, 15.03, 49.85],
  },
];

export function WidgetOperationalMetrics() {
  const { chartProps, isEmpty } = useChartSettings();
  return (
    <ResponsiveLayout
      filters={
        <FormField label="Filter displayed data">
          <Select
            selectedOption={{ label: "December 2022" }}
            placeholder="Filter data"
            empty="Not supported in the demo"
            onChange={() => {
              /*noop*/
            }}
          />
        </FormField>
      }
    >
      <ResponsiveLayoutColumn header={<Header variant="h3">Overview</Header>}>
        <SpaceBetween size="s">
          <KeyValuePairs
            items={[
              {
                label: "Status",
                value: <StatusIndicator type="success">Running</StatusIndicator>,
              },
              {
                label: "Running resources",
                value: "120",
              },
              {
                label: "Monitoring",
                value: "Enabled",
              },
              {
                label: "Open issues",
                value: "0",
              },
            ]}
          />
        </SpaceBetween>
      </ResponsiveLayoutColumn>

      <ResponsiveLayoutColumn header={<Header variant="h3">Breakdown</Header>}>
        <CartesianChart
          {...chartProps.cartesian}
          ariaLabel="Operational metrics"
          ariaDescription="Bar chart showing operational metrics."
          fitHeight={true}
          chartMinHeight={200}
          series={isEmpty ? [] : series}
          xAxis={{
            title: "Chars",
            type: "category",
            categories: ["A", "B", "C", "D", "E", "F"],
            valueFormatter: dateFormatter,
          }}
          yAxis={{ title: "Numbers" }}
          legend={{
            enabled: false,
          }}
          emphasizeBaseline={true}
        />
      </ResponsiveLayoutColumn>
    </ResponsiveLayout>
  );
}

function ResponsiveLayout({ filters, children }: { children: React.ReactNode; filters: React.ReactNode }) {
  const [width, ref] = useContainerQuery((rect) => rect.borderBoxWidth);
  const multiColumn = width && width > 480;
  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.filters}>{filters}</div>
      <div className={[styles.columns, multiColumn ? styles.multi : styles.single].join(" ")}>{children}</div>
    </div>
  );
}

function ResponsiveLayoutColumn({ header, children }: { children: React.ReactNode; header: React.ReactNode }) {
  return (
    <div className={styles["column-item"]}>
      {header}
      {children}
    </div>
  );
}

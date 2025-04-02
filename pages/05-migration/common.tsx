// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { ChartFrame } from "../common/chart-frame";
import { PageSection } from "../common/templates";

export interface MigrationExample {
  tags?: string[];
  old: React.ReactNode;
  new: React.ReactNode;
  containerHeight?: number | { old: number; new: number };
}

export interface MigrationDetails {
  functional?: MigrationDetailsSection;
  visualDesign?: MigrationDetailsSection;
  behavior?: MigrationDetailsSection;
  implementation?: MigrationDetailsSection;
}

export interface MigrationDetailsSection {
  before?: React.ReactNode;
  bullets?: MigrationDetailsBullet[];
  after?: React.ReactNode;
}

export type MigrationDetailsBullet =
  | string
  | {
      content: React.ReactNode;
    };

export function MigrationDemos({ examples }: { examples: MigrationExample[] }) {
  const defaultContainerHeight = 400;
  return (
    <SpaceBetween size="s">
      {examples.map((example, index) => {
        const containerHeightOld =
          typeof example.containerHeight === "object" ? example.containerHeight.old : example.containerHeight;
        const containerHeightNew =
          typeof example.containerHeight === "object" ? example.containerHeight.new : example.containerHeight;
        return (
          <SpaceBetween size="xxs" key={index}>
            {example.tags ? (
              <SpaceBetween size="xxs" direction="horizontal">
                {example.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </SpaceBetween>
            ) : null}

            <ColumnLayout columns={2}>
              <ChartFrame height={containerHeightOld ?? defaultContainerHeight} customAnnotation="Old">
                {example.old}
              </ChartFrame>

              <ChartFrame height={containerHeightNew ?? defaultContainerHeight} customAnnotation="New">
                {example.new}
              </ChartFrame>
            </ColumnLayout>
          </SpaceBetween>
        );
      })}
    </SpaceBetween>
  );
}

export function MigrationGuidance({
  functional,
  visualDesign,
  behavior,
  implementation,
  before,
  after,
}: MigrationDetails & {
  before?: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <SpaceBetween size="s">
      {before}
      {functional ? <MigrationGuidanceSection title="Functional" {...functional} /> : null}
      {visualDesign ? <MigrationGuidanceSection title="Visual design" {...visualDesign} /> : null}
      {behavior ? <MigrationGuidanceSection title="Behavior" {...behavior} /> : null}
      {implementation ? <MigrationGuidanceSection title="Dev" {...implementation} /> : null}
      {after}
    </SpaceBetween>
  );
}

function MigrationGuidanceSection(props: MigrationDetailsSection & { title: string }) {
  return (
    <SpaceBetween size="s">
      <Box variant="h4">{props.title}</Box>

      {props.before ? <Box>{props.before}</Box> : null}

      {props.bullets ? (
        <ul style={{ margin: 0 }}>
          {props.bullets.map((item, index) => (
            <li key={index}>
              <Box>{typeof item === "string" ? item : item.content}</Box>
            </li>
          ))}
        </ul>
      ) : null}

      {props.after ? <Box>{props.after}</Box> : null}
    </SpaceBetween>
  );
}

export function MigrationSection({
  title,
  subtitle,
  details,
  examples = [],
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  details?: MigrationDetails;
  examples?: MigrationExample[];
}) {
  return (
    <PageSection title={title} subtitle={subtitle}>
      <SpaceBetween size="m">
        {details ? <MigrationGuidance {...details} after={examples.length > 0 ? <hr /> : null} /> : null}
        <MigrationDemos examples={examples} />
      </SpaceBetween>
    </PageSection>
  );
}

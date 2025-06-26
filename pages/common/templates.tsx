// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useContext, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useMergeRefs } from "@cloudscape-design/component-toolkit/internal";
import AppLayout, { AppLayoutProps } from "@cloudscape-design/components/app-layout";
import Badge from "@cloudscape-design/components/badge";
import Box from "@cloudscape-design/components/box";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Drawer from "@cloudscape-design/components/drawer";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import AppContext from "../app/app-context";
import { ScreenshotArea } from "./screenshot-area";

import styles from "./styles.module.scss";

export interface DocsSectionProps {
  functional?: DocsBlockProps;
  visualDesign?: DocsBlockProps;
  behavior?: DocsBlockProps;
  implementation?: DocsBlockProps;
  custom?: TitledDocsBlockProps[];
}

export interface DocsBlockProps {
  before?: React.ReactNode;
  bullets?: DocsBulletPoint[];
  after?: React.ReactNode;
}

export interface TitledDocsBlockProps extends DocsBlockProps {
  title: string;
}

export type DocsBulletPoint =
  | string
  | {
      content: React.ReactNode;
    };

export function Page({
  title,
  subtitle,
  settings,
  children,
  screenshotArea = true,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  settings?: React.ReactNode;
  children: React.ReactNode;
  screenshotArea?: boolean;
}) {
  const { urlParams } = useContext(AppContext);
  const [toolsOpen, setToolsOpen] = useState(!urlParams.screenshotMode);
  const drawers: AppLayoutProps.Drawer[] = [];
  if (settings) {
    drawers.push({
      id: "settings",
      content: <Drawer header={<Header variant="h2">Page settings</Header>}>{settings}</Drawer>,
      trigger: { iconName: "ellipsis" },
      ariaLabels: { drawerName: "Page settings", triggerButton: "Open page settings" },
    });
  }
  return (
    <AppLayout
      headerSelector="#h"
      navigationHide={true}
      activeDrawerId={toolsOpen ? "settings" : null}
      onDrawerChange={({ detail }) => setToolsOpen(!!detail.activeDrawerId)}
      tools={settings && <Drawer header={<Header variant="h2">Page settings</Header>}>{settings}</Drawer>}
      toolsHide={!settings}
      drawers={drawers}
      content={
        <Box>
          <h1>{title}</h1>
          {subtitle && !urlParams.screenshotMode && (
            <Box variant="p" margin={{ bottom: "xs" }}>
              {subtitle}
            </Box>
          )}
          <Box>{screenshotArea ? <ScreenshotArea>{children}</ScreenshotArea> : children}</Box>
        </Box>
      }
    />
  );
}

export function PageSection({
  title,
  subtitle,
  children,
  docs,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  docs?: DocsSectionProps;
}) {
  const { urlParams } = useContext(AppContext);
  if (urlParams.screenshotMode && !children) {
    return null;
  }
  return (
    <Box margin={{ vertical: "m" }}>
      {title && <Box variant="h2">{title}</Box>}

      {subtitle && !urlParams.screenshotMode && (
        <Box variant={typeof subtitle === "string" ? "p" : "div"} color="text-body-secondary">
          {subtitle}
        </Box>
      )}

      <SpaceBetween size="s">
        {docs && !urlParams.screenshotMode ? <DocsSection {...docs} /> : null}

        {children && <Box padding={{ vertical: "m" }}>{children}</Box>}
      </SpaceBetween>
    </Box>
  );
}

interface MigrationDemoExample {
  tags?: string[];
  old: React.ReactNode;
  new: React.ReactNode;
  containerHeight?: number | { old: number; new: number };
}

export function MigrationDemo({ examples }: { examples: MigrationDemoExample[] }) {
  const { urlParams } = useContext(AppContext);

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
              <ChartFrame height={containerHeightOld ?? 400} annotation="Old">
                {!urlParams.screenshotMode ? (
                  example.old === null ? (
                    <div className={styles["old-chart-placeholder"]}>
                      <Box color="text-body-secondary">No demo</Box>
                    </div>
                  ) : (
                    example.old
                  )
                ) : (
                  <div className={styles["old-chart-placeholder"]}>
                    <Box color="text-body-secondary">Legacy chart example is hidden in screenshot mode</Box>
                  </div>
                )}
              </ChartFrame>

              <ChartFrame height={containerHeightNew ?? 400} annotation="New">
                {example.new}
              </ChartFrame>
            </ColumnLayout>
          </SpaceBetween>
        );
      })}
    </SpaceBetween>
  );
}

export function FitSizeDemo({
  children,
  height,
  width,
}: {
  children: React.ReactNode;
  height?: number | string;
  width?: number | string;
}) {
  const [measuredWidth, measureWidthRef] = useContainerQuery((entry) => entry.contentBoxWidth);
  const [measuredHeight, measureHeightRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const ref = useMergeRefs(measureWidthRef, measureHeightRef);
  return (
    <ChartFrame
      ref={ref}
      height={height}
      width={width}
      annotation={
        <>
          <span>width: {measuredWidth}px, </span>
          <span>height: {measuredHeight}px</span>
        </>
      }
    >
      {children}
    </ChartFrame>
  );
}

export function FramedDemo({ children }: { children: React.ReactNode }) {
  return <ChartFrame>{children}</ChartFrame>;
}

export function DocsSection({ functional, visualDesign, behavior, implementation, custom = [] }: DocsSectionProps) {
  return (
    <SpaceBetween size="s">
      {functional ? <DocsBlock title="Functional" {...functional} /> : null}
      {visualDesign ? <DocsBlock title="Visual design" {...visualDesign} /> : null}
      {behavior ? <DocsBlock title="Behavior" {...behavior} /> : null}
      {implementation ? <DocsBlock title="Dev" {...implementation} /> : null}
      {custom.map((block, index) => (
        <DocsBlock key={index} {...block} />
      ))}
    </SpaceBetween>
  );
}

function DocsBlock(props: TitledDocsBlockProps) {
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

const ChartFrame = forwardRef(
  (
    {
      children,
      height,
      width,
      annotation,
    }: {
      children: React.ReactNode;
      height?: number | string;
      width?: number | string;
      annotation?: React.ReactNode;
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    return (
      <div ref={ref} className={styles["chart-frame"]} style={{ height, width, overflow: "hidden" }}>
        {children}
        <div className={styles["chart-frame-annotation"]}>{annotation}</div>
      </div>
    );
  },
);

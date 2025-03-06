// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AppLayout, { AppLayoutProps } from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Drawer from "@cloudscape-design/components/drawer";
import Header from "@cloudscape-design/components/header";

export function Page({
  title,
  subtitle,
  settings,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  settings?: React.ReactNode;
  children: React.ReactNode;
}) {
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
      tools={settings && <Drawer header={<Header variant="h2">Page settings</Header>}>{settings}</Drawer>}
      toolsHide={!settings}
      drawers={drawers}
      content={
        <Box>
          <h1>{title}</h1>
          {subtitle && <Box variant="p">{subtitle}</Box>}
          <Box>{children}</Box>
        </Box>
      }
    />
  );
}

export function PageSection({
  title,
  subtitle,
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box margin={{ vertical: "m" }}>
      {title && <h2>{title}</h2>}
      {subtitle && <Box variant="p">{subtitle}</Box>}

      <Box padding={{ vertical: "m" }}>{children}</Box>
    </Box>
  );
}

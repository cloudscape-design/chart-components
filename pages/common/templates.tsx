// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import AppLayout from "@cloudscape-design/components/app-layout";
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
  const [toolsOpen, setToolsOpen] = useState(!!settings);
  return (
    <AppLayout
      navigationHide={true}
      tools={settings && <Drawer header={<Header variant="h2">Page settings</Header>}>{settings}</Drawer>}
      toolsOpen={toolsOpen}
      toolsHide={!settings}
      onToolsChange={({ detail: { open } }) => setToolsOpen(open)}
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

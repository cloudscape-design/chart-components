// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { I18nProvider } from "@cloudscape-design/components/i18n";

interface TestI18nProviderProps {
  messages: Record<string, Record<string, string>>;
  locale?: string;
  children: React.ReactNode;
}

export function TestI18nProvider({ messages = {}, locale = "en", children }: TestI18nProviderProps) {
  return (
    <I18nProvider locale={locale} messages={[{ "@cloudscape-design/components": { [locale]: messages } }]}>
      {children}
    </I18nProvider>
  );
}

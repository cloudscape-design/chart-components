// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { I18nProvider } from "@cloudscape-design/components/i18n";

const zoomMessages = {
  "cloudscape-design-components": {
    en: {
      "[charts]": {
        "i18nStrings.resetZoomButtonText": "Reset",
        "i18nStrings.resetZoomButtonAriaLabel": "Reset zoom to show full data range",
        "i18nStrings.zoomControlsAriaLabel": "Chart zoom controls",
        "i18nStrings.zoomResetAnnouncementText": "Zoom reset. Showing the full data range.",
      },
    },
  },
};

export function ZoomI18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en" messages={[zoomMessages]}>
      {children}
    </I18nProvider>
  );
}

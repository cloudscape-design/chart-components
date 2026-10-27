// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import enMessages from "@cloudscape-design/components/i18n/messages/all.en";

// The chart messages that are not yet published in the components package, merged with the standard ones.
const unpublishedMessages = {
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

export const pageMessages = [enMessages, unpublishedMessages];

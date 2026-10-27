// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import enMessages from "@cloudscape-design/components/i18n/messages/all.en";

// The chart messages that are not yet published in the components package, merged with the standard ones.
const unpublishedMessages = {
  "cloudscape-design-components": {
    en: {
      "[charts]": {
        "i18nStrings.enterZoomModeButtonText": "Zoom",
        "i18nStrings.enterZoomModeButtonAriaLabel": "Enter zoom mode",
        "i18nStrings.exitZoomModeButtonText": "Exit zoom",
        "i18nStrings.exitZoomModeButtonAriaLabel": "Exit zoom mode",
        "i18nStrings.resetZoomButtonText": "Reset",
        "i18nStrings.resetZoomButtonAriaLabel": "Reset zoom to show full data range",
        "i18nStrings.zoomControlsAriaLabel": "Chart zoom controls",
        "i18nStrings.zoomCursorAriaLabel": "Zoom range cursor",
        "i18nStrings.zoomCursorPreviousButtonAriaLabel": "Move zoom cursor to previous point",
        "i18nStrings.zoomCursorNextButtonAriaLabel": "Move zoom cursor to next point",
        "i18nStrings.zoomModeEnteredAnnouncementText":
          "Zoom mode. Cursor at {value}. Use arrow keys to move, Enter to set the start point.",
        "i18nStrings.zoomStartPointAnnouncementText":
          "Start point set at {value}. Move the cursor and set the end point to zoom.",
        "i18nStrings.zoomRangeChangeAnnouncementText": "Zoomed from {startValue} to {endValue}.",
        "i18nStrings.zoomSelectionAnnouncementText": "Selecting zoom range from {startValue} to {endValue}.",
        "i18nStrings.zoomModeExitedAnnouncementText": "Zoom mode cancelled.",
        "i18nStrings.zoomResetAnnouncementText": "Zoom reset. Showing the full data range.",
      },
    },
  },
};

export const pageMessages = [enMessages, unpublishedMessages];

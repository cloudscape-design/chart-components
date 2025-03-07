// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KeyboardEventHandler, MouseEventHandler, ReactNode } from "react";
import clsx from "clsx";

import Icon from "@cloudscape-design/components/icon";

import styles from "./styles.css.js";

interface ExpandableSectionHeaderProps {
  expanded: boolean;
  ariaControls: string;
  ariaLabel?: string;
  onKeyUp: KeyboardEventHandler;
  onKeyDown: KeyboardEventHandler;
  onClick: MouseEventHandler;
  headerText?: ReactNode;
  headerActions?: ReactNode;
}

export function ExpandableSectionHeader({
  headerText,
  headerActions,
  expanded,
  ariaControls,
  ariaLabel,
  onKeyUp,
  onKeyDown,
  onClick,
}: ExpandableSectionHeaderProps) {
  const alwaysShowDivider = headerActions;
  const icon = (
    <Icon size="normal" className={clsx(styles.icon, expanded && styles.expanded)} name="caret-down-filled" />
  );
  const defaultHeaderProps = {
    icon: icon,
    expanded: expanded,
    ariaControls: ariaControls,
    ariaLabel: ariaLabel,
    onClick: onClick,
  };

  const supportsInteractiveElements = true;
  const restrictClickableArea = supportsInteractiveElements && headerActions;
  const actions = supportsInteractiveElements && headerActions;
  const listeners = { onClick, onKeyDown, onKeyUp };

  // If interactive elements are present, constrain the clickable area to only the icon and the header text
  // to prevent nesting interactive elements.
  const headerButtonListeners = restrictClickableArea ? listeners : undefined;
  // For the default and footer variants with description,
  // include also the immediate wrapper around it to include the entire row for backwards compatibility,
  // but exclude the description.
  const headingTagListeners = !headerButtonListeners ? listeners : undefined;
  // For all other cases, make the entire header clickable for backwards compatibility.
  const wrapperListeners = !headerButtonListeners && !headingTagListeners ? listeners : undefined;
  const headerButton = (
    <span
      className={clsx(
        styles["expand-button"],
        styles["header-button"],
        headerButtonListeners && styles["click-target"],
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={expanded}
      {...headerButtonListeners}
    >
      <span className={styles["icon-container"]}>{icon}</span>
      <span>{headerText}</span>
    </span>
  );

  return (
    <div
      className={clsx(
        styles.header,
        styles.wrapper,
        (expanded || alwaysShowDivider) && styles["wrapper-expanded"],
        expanded && styles.expanded,
        wrapperListeners && styles["click-target"],
      )}
      {...wrapperListeners}
      {...defaultHeaderProps}
    >
      <div className={clsx(actions && styles["header-actions-wrapper"])}>
        <div
          className={clsx(styles["header-wrapper"], headingTagListeners && styles["click-target"])}
          {...headingTagListeners}
        >
          {headerButton}
        </div>
        {actions}
      </div>
    </div>
  );
}

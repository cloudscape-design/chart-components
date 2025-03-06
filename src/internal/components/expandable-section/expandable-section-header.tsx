// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KeyboardEventHandler, MouseEventHandler, ReactNode } from "react";
import clsx from "clsx";

import Icon from "@cloudscape-design/components/icon";

import styles from "./styles.css.js";

interface ExpandableDefaultHeaderProps {
  id: string;
  className?: string;
  children?: ReactNode;
  expanded: boolean;
  ariaControls: string;
  ariaLabel?: string;
  onKeyUp: KeyboardEventHandler;
  onKeyDown: KeyboardEventHandler;
  onClick: MouseEventHandler;
  icon: JSX.Element;
}

interface ExpandableHeaderTextWrapperProps extends ExpandableDefaultHeaderProps {
  headerActions?: ReactNode;
}

interface ExpandableSectionHeaderProps extends Omit<ExpandableDefaultHeaderProps, "children" | "icon"> {
  header?: ReactNode;
  headerText?: ReactNode;
  headerDescription?: ReactNode;
  headerCounter?: string;
  headerInfo?: ReactNode;
  headerActions?: ReactNode;
  ariaLabelledBy?: string;
}

const ExpandableDeprecatedHeader = ({
  id,
  className,
  onClick,
  ariaLabel,
  ariaControls,
  expanded,
  children,
  icon,
  onKeyUp,
  onKeyDown,
}: ExpandableDefaultHeaderProps) => {
  return (
    <div
      id={id}
      role="button"
      className={clsx(className, styles["expand-button"], styles["click-target"], styles["header-deprecated"])}
      tabIndex={0}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={expanded}
    >
      <div className={clsx(styles["icon-container"], styles["icon-container-compact"])}>{icon}</div>
      {children}
    </div>
  );
};

const ExpandableHeaderTextWrapper = ({
  id,
  className,
  onClick,
  ariaLabel,
  ariaControls,
  expanded,
  children,
  icon,
  headerActions,
  onKeyUp,
  onKeyDown,
}: ExpandableHeaderTextWrapperProps) => {
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
      aria-labelledby={!ariaLabel ? id : undefined}
      aria-controls={ariaControls}
      aria-expanded={expanded}
      {...headerButtonListeners}
    >
      <span className={clsx(styles["icon-container"], styles[`icon-container-compact`])}>{icon}</span>
      <span id={id} className={clsx(styles["header-text"])}>
        {children}
      </span>
    </span>
  );

  return (
    <div className={clsx(className, wrapperListeners && styles["click-target"])} {...wrapperListeners}>
      <>
        <div className={clsx(actions && styles["header-actions-wrapper"])}>
          <div
            className={clsx(styles["header-wrapper"], headingTagListeners && styles["click-target"])}
            {...headingTagListeners}
          >
            {headerButton}
          </div>
          {actions}
        </div>
      </>
    </div>
  );
};

export const ExpandableSectionHeader = ({
  id,
  className,
  header,
  headerText,
  headerActions,
  expanded,
  ariaControls,
  ariaLabel,
  onKeyUp,
  onKeyDown,
  onClick,
}: ExpandableSectionHeaderProps) => {
  const alwaysShowDivider = headerActions;
  const icon = (
    <Icon size="normal" className={clsx(styles.icon, expanded && styles.expanded)} name="caret-down-filled" />
  );
  const defaultHeaderProps = {
    id: id,
    icon: icon,
    expanded: expanded,
    ariaControls: ariaControls,
    ariaLabel: ariaLabel,
    onClick: onClick,
  };

  const wrapperClassName = clsx(
    styles.wrapper,
    styles["wrapper-compact"],
    (expanded || alwaysShowDivider) && styles["wrapper-expanded"],
  );

  if (headerText) {
    return (
      <ExpandableHeaderTextWrapper
        className={clsx(className, wrapperClassName, expanded && styles.expanded)}
        headerActions={headerActions}
        onKeyUp={onKeyUp}
        onKeyDown={onKeyDown}
        {...defaultHeaderProps}
      >
        {headerText}
      </ExpandableHeaderTextWrapper>
    );
  }

  return (
    <ExpandableDeprecatedHeader
      className={clsx(className, wrapperClassName, styles.focusable, expanded && styles.expanded)}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
      {...defaultHeaderProps}
    >
      {header}
    </ExpandableDeprecatedHeader>
  );
};

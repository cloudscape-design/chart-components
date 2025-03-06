// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KeyboardEvent, useCallback, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import clsx from "clsx";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { KeyCode } from "../../keycode";
import { useUniqueId } from "../../utils/unique-id";
import { ExpandableSectionContainer } from "./expandable-section-container";
import { ExpandableSectionHeader } from "./expandable-section-header";

import styles from "./styles.css.js";

interface ExpandableSectionProps {
  /**
   * Determines whether the component is in the expanded state (that is, with content visible). The component operates in a controlled
   * manner if you provide a value for this property.
   */
  expanded?: boolean;

  /**
   * Primary content displayed in the expandable section element.
   */
  children?: React.ReactNode;

  /**
   * The heading text. Use plain text. When using the container variant, you can use additional header props like `headerDescription` and `headerCounter` to display other elements in the header.
   */
  headerText?: React.ReactNode;

  /**
   * Called when the state changes (that is, when the user expands or collapses the component).
   * The event `detail` contains the current value of the `expanded` property.
   */
  onChange?: (expanded: boolean) => void;

  /**
   * Actions for the header. Use with the default or container variant.
   */
  headerActions?: React.ReactNode;
}

export default function ExpandableSection({
  expanded: controlledExpanded,
  onChange,
  children,
  headerText,
  headerActions,
  ...props
}: ExpandableSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlId = useUniqueId();
  const triggerControlId = `${controlId}-trigger`;

  const [expanded, setExpanded] = useControllableState(controlledExpanded, onChange, false, {
    componentName: "ExpandableSection",
    propertyName: "expanded",
    changeHandlerName: "onChange",
  });

  const onExpandChange = useCallback(
    (expanded: boolean) => {
      setExpanded(expanded);
      onChange?.(expanded);
    },
    [onChange, setExpanded],
  );

  const onClick = useCallback(() => {
    onExpandChange(!expanded);
  }, [onExpandChange, expanded]);

  const onKeyUp = useCallback(
    (event: KeyboardEvent<Element>) => {
      const interactionKeys = [KeyCode.enter, KeyCode.space];

      if (interactionKeys.indexOf(event.keyCode) !== -1) {
        onExpandChange(!expanded);
      }
    },
    [onExpandChange, expanded],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<Element>) => {
    if (event.keyCode === KeyCode.space) {
      // Prevent the page from scrolling when toggling the component with the space bar.
      event.preventDefault();
    }
  }, []);

  const triggerProps = {
    ariaControls: controlId,
    onKeyUp,
    onKeyDown,
    onClick,
  };

  return (
    <ExpandableSectionContainer
      {...props}
      className={styles.root}
      header={
        <ExpandableSectionHeader
          id={triggerControlId}
          className={clsx(styles.header, styles["header-compact"])}
          expanded={!!expanded}
          headerText={headerText}
          headerActions={headerActions}
          {...triggerProps}
        />
      }
    >
      <CSSTransition in={expanded} timeout={30} classNames={{ enter: styles["content-enter"] }} nodeRef={ref}>
        <div
          id={controlId}
          ref={ref}
          className={clsx(styles.content, styles["content-compact"], expanded && styles["content-expanded"])}
          role="group"
        >
          {children}
        </div>
      </CSSTransition>
    </ExpandableSectionContainer>
  );
}

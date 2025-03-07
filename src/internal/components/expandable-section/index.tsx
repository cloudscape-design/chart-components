// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { KeyboardEvent, useCallback, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import clsx from "clsx";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { useUniqueId } from "../../utils/unique-id";
import { ExpandableSectionHeader } from "./header";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface ExpandableSectionProps {
  expanded: boolean;
  onChange: (expanded: boolean) => void;
  children?: React.ReactNode;
  headerText?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function ExpandableSection({ expanded, onChange, children, headerText, headerActions }: ExpandableSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controlId = useUniqueId();

  const onKeyUp = (event: KeyboardEvent<Element>) => {
    if ([KeyCode.enter, KeyCode.space].indexOf(event.keyCode) !== -1) {
      onChange(!expanded);
    }
  };

  const onKeyDown = useCallback((event: KeyboardEvent<Element>) => {
    // Prevent the page from scrolling when toggling the component with the space bar.
    if (event.keyCode === KeyCode.space) {
      event.preventDefault();
    }
  }, []);

  const triggerProps = {
    ariaControls: controlId,
    onKeyUp,
    onKeyDown,
    onClick: () => onChange(!expanded),
  };

  return (
    <div className={clsx(testClasses.root, styles.root)}>
      <ExpandableSectionHeader
        expanded={!!expanded}
        headerText={headerText}
        headerActions={headerActions}
        {...triggerProps}
      />
      <CSSTransition in={expanded} timeout={30} classNames={{ enter: styles["content-enter"] }} nodeRef={ref}>
        <div
          role="group"
          id={controlId}
          ref={ref}
          className={clsx(testClasses.content, styles.content, expanded && styles["content-expanded"])}
        >
          {children}
        </div>
      </CSSTransition>
    </div>
  );
}

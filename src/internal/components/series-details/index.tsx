// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, memo, ReactNode, useEffect, useRef } from "react";
import clsx from "clsx";

import { useMergeRefs } from "@cloudscape-design/component-toolkit/internal";
import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { InternalExpandableSection } from "@cloudscape-design/components/internal/do-not-use/expandable-section";

import { getDataAttributes } from "../../base-component/get-data-attributes";
import getSeriesDetailsText from "./series-details-text";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface ChartDetailPair {
  key: ReactNode;
  value: ReactNode;
}

interface ListItemProps {
  itemKey: ReactNode;
  value: ReactNode;
  subItems?: ReadonlyArray<ChartDetailPair>;
  marker?: React.ReactNode;
  details?: ReactNode;
}

export interface ChartSeriesDetailItem extends ChartDetailPair {
  marker?: React.ReactNode;
  isDimmed?: boolean;
  subItems?: ReadonlyArray<ChartDetailPair>;
  expandableId?: string;
  details?: ReactNode;
}
export type ExpandedSeries = Set<string>;

interface ChartSeriesDetailsProps extends BaseComponentProps {
  details: ReadonlyArray<ChartSeriesDetailItem>;
  expandedSeries?: ExpandedSeries;
  setPopoverText?: (s: string) => void;
  setExpandedState?: (seriesTitle: string, state: boolean) => void;
  compactList?: boolean;
}

export default memo(forwardRef(ChartSeriesDetails));

function ChartSeriesDetails(
  { details, expandedSeries, setPopoverText, setExpandedState, compactList, ...restProps }: ChartSeriesDetailsProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const baseProps = getDataAttributes(restProps);
  const className = clsx(baseProps.className, styles.root);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergeRefs(ref, detailsRef);

  // Once the component has rendered, pass its content in plain text
  // so that it can be used by screen readers.
  useEffect(() => {
    if (setPopoverText) {
      if (detailsRef.current) {
        setPopoverText(getSeriesDetailsText(detailsRef.current));
      }
      return () => {
        setPopoverText("");
      };
    }
  }, [details, setPopoverText]);

  const isExpanded = (seriesTitle: string) => !!expandedSeries && expandedSeries.has(seriesTitle);

  return (
    <div {...baseProps} className={className} ref={mergedRef}>
      <ul className={clsx(styles.list, compactList && styles.compact)}>
        {details.map(({ key, value, marker, isDimmed, subItems, expandableId, details: extraDetails }, index) => (
          <li
            key={index}
            className={clsx({
              [styles.dimmed]: isDimmed,
              [styles["list-item"]]: true,
              [testClasses["list-item"]]: true,
              [styles["with-sub-items"]]: subItems?.length,
              [styles.expandable]: !!expandableId,
            })}
          >
            {subItems?.length && !!expandableId ? (
              <ExpandableSeries
                itemKey={key}
                value={value}
                marker={marker}
                details={extraDetails}
                subItems={subItems}
                expanded={isExpanded(expandableId)}
                setExpandedState={(state) => setExpandedState && setExpandedState(expandableId, state)}
              />
            ) : (
              <NonExpandableSeries
                itemKey={key}
                value={value}
                marker={marker}
                details={extraDetails}
                subItems={subItems}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubItems({
  items,
  expandable,
  expanded,
}: {
  items: ReadonlyArray<ChartDetailPair>;
  expandable?: boolean;
  expanded?: boolean;
}) {
  return (
    <ul className={clsx(styles["sub-items"], expandable && styles.expandable)}>
      {items.map(({ key, value }, index) => (
        <li
          key={index}
          className={clsx(
            testClasses["inner-list-item"],
            styles["inner-list-item"],
            styles["key-value-pair"],
            (expanded || !expandable) && styles.announced,
          )}
        >
          <span className={clsx(testClasses.key, styles.key)}>{key}</span>
          <span className={clsx(testClasses.value, styles.value)}>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function ExpandableSeries({
  itemKey,
  value,
  subItems,
  marker,
  expanded,
  setExpandedState,
  details,
}: ListItemProps &
  Required<Pick<ListItemProps, "subItems">> & {
    expanded: boolean;
    setExpandedState: (state: boolean) => void;
  }) {
  return (
    <div className={styles["expandable-section"]}>
      {marker && <div style={{ blockSize: "20px", inlineSize: "20px", marginInlineEnd: "2px" }}>{marker}</div>}
      <div className={styles["full-width"]}>
        <InternalExpandableSection
          headerText={<span className={clsx(testClasses.key, styles.key)}>{itemKey}</span>}
          headerActions={<span className={clsx(testClasses.value, styles.value, styles.expandable)}>{value}</span>}
          expanded={expanded}
          onChange={({ detail }) => setExpandedState(detail.expanded)}
          variant="compact"
        >
          <SubItems items={subItems} expandable={true} expanded={expanded} />
        </InternalExpandableSection>
        <Details>{details}</Details>
      </div>
    </div>
  );
}

function NonExpandableSeries({ itemKey, value, subItems, marker, details }: ListItemProps) {
  return (
    <>
      <div className={clsx(styles["key-value-pair"], styles.announced)}>
        <div className={clsx(testClasses.key, styles.key)}>
          {marker && <div style={{ blockSize: "20px", inlineSize: "20px", marginInlineEnd: "2px" }}>{marker}</div>}
          <span>{itemKey}</span>
        </div>
        <span className={clsx(testClasses.value, styles.value)}>{value}</span>
      </div>
      {subItems && <SubItems items={subItems} />}
      <Details>{details}</Details>
    </>
  );
}

function Details({ children }: { children: ReactNode }) {
  return children ? <div className={styles.details}>{children}</div> : null;
}

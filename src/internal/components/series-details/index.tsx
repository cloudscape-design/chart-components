// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, memo, ReactNode, useEffect, useRef } from "react";
import clsx from "clsx";

import { useMergeRefs } from "@cloudscape-design/component-toolkit/internal";
import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { InternalExpandableSection } from "@cloudscape-design/components/internal/do-not-use/expandable-section";

import { getDataAttributes } from "../../base-component/get-data-attributes";

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
  description?: ReactNode;
}

export interface ChartSeriesDetailItem extends ChartDetailPair {
  highlighted?: boolean;
  marker?: React.ReactNode;
  isDimmed?: boolean;
  subItems?: ReadonlyArray<ChartDetailPair>;
  expandableId?: string;
  description?: ReactNode;
}
export type ExpandedSeries = Set<string>;

interface ChartSeriesDetailsProps extends BaseComponentProps {
  details: ReadonlyArray<ChartSeriesDetailItem>;
  expandedSeries?: ExpandedSeries;
  setExpandedState?: (seriesTitle: string, state: boolean) => void;
  compactList?: boolean;
}

export default memo(forwardRef(ChartSeriesDetails));

function ChartSeriesDetails(
  { details, expandedSeries, setExpandedState, compactList, ...restProps }: ChartSeriesDetailsProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const baseProps = getDataAttributes(restProps);
  const className = clsx(baseProps.className, styles.root);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMergeRefs(ref, detailsRef);
  const selectedRef = useRef<HTMLDivElement>(null);

  const isExpanded = (seriesTitle: string) => !!expandedSeries && expandedSeries.has(seriesTitle);

  const selectedIndex = details.findIndex((d) => d.highlighted);
  useEffect(() => {
    if (selectedIndex !== -1 && selectedRef.current && "scrollIntoView" in selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedIndex]);

  return (
    <div {...baseProps} className={className} ref={mergedRef}>
      <ul className={clsx(styles.list, compactList && styles.compact)}>
        {details.map(({ key, value, marker, isDimmed, subItems, expandableId, description, highlighted }, index) => (
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
            {details.length > 1 && highlighted ? (
              <div ref={selectedRef} className={styles["highlight-indicator"]}></div>
            ) : null}
            {subItems?.length && !!expandableId ? (
              <ExpandableSeries
                itemKey={key}
                value={value}
                marker={marker}
                description={description}
                subItems={subItems}
                expanded={isExpanded(expandableId)}
                setExpandedState={(state) => setExpandedState && setExpandedState(expandableId, state)}
              />
            ) : (
              <NonExpandableSeries
                itemKey={key}
                value={value}
                marker={marker}
                description={description}
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
  description,
}: ListItemProps &
  Required<Pick<ListItemProps, "subItems">> & {
    expanded: boolean;
    setExpandedState: (state: boolean) => void;
  }) {
  return (
    <div className={styles["expandable-section"]}>
      {marker}
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
        <Details>{description}</Details>
      </div>
    </div>
  );
}

function NonExpandableSeries({ itemKey, value, subItems, marker, description }: ListItemProps) {
  return (
    <>
      <div className={clsx(styles["key-value-pair"], styles.announced)}>
        <div className={clsx(testClasses.key, styles.key)}>
          {marker}
          <span>{itemKey}</span>
        </div>
        <span className={clsx(testClasses.value, styles.value)}>{value}</span>
      </div>
      {subItems && <SubItems items={subItems} />}
      <Details>{description}</Details>
    </>
  );
}

function Details({ children }: { children: ReactNode }) {
  return children ? <div className={clsx(testClasses.description, styles.description)}>{children}</div> : null;
}

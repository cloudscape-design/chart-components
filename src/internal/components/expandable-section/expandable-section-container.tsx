// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

interface ExpandableSectionContainerProps {
  className?: string;
  header: React.ReactNode;
  children?: React.ReactNode;
}

export const ExpandableSectionContainer = ({
  className,
  children,
  header,
  ...rest
}: ExpandableSectionContainerProps) => {
  return (
    <div className={className} {...rest}>
      {header}
      {children}
    </div>
  );
};

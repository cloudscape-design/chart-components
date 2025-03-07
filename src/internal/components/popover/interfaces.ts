// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The position the popover is actually in, given space constraints.
 */
export type InternalPosition =
  | "right-top"
  | "right-bottom"
  | "left-top"
  | "left-bottom"
  | "top-center"
  | "top-right"
  | "top-left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

export interface Offset {
  insetInlineStart: number;
  insetBlockStart: number;
}

export interface Dimensions {
  inlineSize: number;
  blockSize: number;
}

export type BoundingBox = Dimensions & Offset;

export type Rect = BoundingBox & {
  insetBlockEnd: number;
  insetInlineEnd: number;
};

export namespace PopoverProps {
  export type Position = "top" | "right" | "bottom" | "left";
  export type Size = "small" | "medium" | "large";
  export type TriggerType = "text" | "text-inline" | "custom";

  export interface Ref {
    /**
     * Sets focus on the popover's trigger.
     */
    focus(): void;
  }
}

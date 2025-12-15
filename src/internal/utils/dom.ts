// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Polyfill for `element.scrollIntoView({ container: "nearest", scrollMode: "..." })`
 * For ease of implementation, behaves like `{ block: "center" }` is provided.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView (for `container`)
 * @see https://caniuse.com/wf-scroll-into-view-container (for `container` browser support)
 * @see https://github.com/w3c/csswg-drafts/pull/5677 (for discussion of `if-needed`)
 */
export function scrollIntoViewNearestContainer(
  element: HTMLElement,
  options?: ScrollOptions & { scrollMode?: "always" | "if-needed" },
) {
  // Scroll methods (scrollTo, scrollIntoView, etc) are not supported in test environments like JSDOM.
  if (!("scrollTo" in element)) {
    return;
  }

  // Get element boundaries to measure scroll offsets.
  // In the future, could be replaced with a simple `element.scrollParent`.
  // https://drafts.csswg.org/cssom-view/#dom-htmlelement-scrollparent
  const scrollParent = getScrollParent(element) ?? element.ownerDocument.documentElement;
  const { top: elementTop, bottom: elementBottom, height: elementHeight } = element.getBoundingClientRect();
  const { top: scrollTop, bottom: scrollBottom, height: scrollHeight } = scrollParent.getBoundingClientRect();

  if (options?.scrollMode === "if-needed") {
    // Technically, getBoundingClientRect() returns the border-box, which includes the border width.
    // We should subtract the border width to get the padding box, but all that computation isn't worth it.
    const isNeeded = elementTop < scrollTop || elementBottom > scrollBottom;
    if (!isNeeded) {
      return;
    }
  }

  const topRelativeToParent = elementTop + scrollParent.scrollTop - scrollTop;
  const blockCenterOffset = scrollHeight / 2 - elementHeight / 2;
  scrollParent.scrollTo({ top: topRelativeToParent - blockCenterOffset, ...options });
}

function getScrollParent(element: HTMLElement): HTMLElement | null {
  for (
    let node: HTMLElement | null = element.parentElement;
    node !== null && node !== element.ownerDocument.body;
    node = node.parentElement
  ) {
    const overflow = getComputedStyle(node).overflow;
    if (overflow !== "visible" && overflow !== "hidden") {
      return node;
    }
  }
  return null;
}

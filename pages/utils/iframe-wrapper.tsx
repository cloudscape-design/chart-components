// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import styles from "./iframe-wrapper.module.scss";

export function IframeWrapper({ id = "iframe", AppComponent }: { id?: string; AppComponent: React.ComponentType }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }

    const iframeDocument = iframe.contentDocument!;
    // Prevent iframe document instance from reload
    // https://bugzilla.mozilla.org/show_bug.cgi?id=543435
    iframeDocument.open();
    // set html5 doctype
    iframeDocument.writeln("<!DOCTYPE html>");
    iframeDocument.close();

    const innerAppRoot = iframeDocument.createElement("div");
    iframeDocument.body.appendChild(innerAppRoot);
    copyStyles(document, iframeDocument);
    iframeDocument.dir = document.dir;
    const syncClassesCleanup = syncClasses(document.body, iframeDocument.body);
    const root = createRoot(innerAppRoot);
    root.render(<AppComponent />);
    return () => {
      syncClassesCleanup();
      root.unmount();
    };
  }, [id, AppComponent]);

  return <iframe ref={iframeRef} id={id} title={id} className={styles["full-screen"]}></iframe>;
}

function copyStyles(srcDoc: Document, targetDoc: Document) {
  for (const stylesheet of Array.from(srcDoc.querySelectorAll("link[rel=stylesheet]"))) {
    const newStylesheet = targetDoc.createElement("link");
    for (const attr of stylesheet.getAttributeNames()) {
      newStylesheet.setAttribute(attr, stylesheet.getAttribute(attr)!);
    }
    targetDoc.head.appendChild(newStylesheet);
  }

  for (const styleEl of Array.from(srcDoc.querySelectorAll("style"))) {
    const newStyle = targetDoc.createElement("style");
    newStyle.textContent = styleEl.textContent;
    targetDoc.head.appendChild(newStyle);
  }
}

function syncClasses(from: HTMLElement, to: HTMLElement) {
  to.className = from.className;
  const observer = new MutationObserver(() => {
    to.className = from.className;
  });

  observer.observe(from, { attributes: true, attributeFilter: ["class"] });

  return () => {
    observer.disconnect();
  };
}

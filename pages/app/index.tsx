// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Suspense, useContext } from "react";
import { HashRouter, Route, Routes, useHref, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import Alert from "@cloudscape-design/components/alert";
import AppLayout from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import { I18nProvider } from "@cloudscape-design/components/i18n";
import enMessages from "@cloudscape-design/components/i18n/messages/all.en";
import Link, { LinkProps } from "@cloudscape-design/components/link";
import Spinner from "@cloudscape-design/components/spinner";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { Density, Mode } from "@cloudscape-design/global-styles";

import { pages, pagesMap } from "../pages";
import AppContext, { AppContextProvider } from "./app-context";

import "@cloudscape-design/global-styles/index.css";

export default function App() {
  return (
    <I18nProvider locale="en" messages={[enMessages]}>
      <HashRouter>
        <AppContextProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/*" element={<PageWithFallback />} />
          </Routes>
        </AppContextProvider>
      </HashRouter>
    </I18nProvider>
  );
}

function Page({ pageId }: { pageId: string }) {
  const Component = pagesMap[pageId];
  return (
    <Suspense fallback={<Spinner />}>{Component ? <Component /> : <Alert type="error">Page not found</Alert>}</Suspense>
  );
}

function Navigation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { urlParams, setUrlParams } = useContext(AppContext);
  const isDarkMode = urlParams.mode === Mode.Dark;
  const isCompactMode = urlParams.density === Density.Compact;
  const isRtl = urlParams.direction === "rtl";
  return (
    <header
      id="h"
      style={{ position: "sticky", insetBlockStart: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 1002 }}
    >
      <TopNavigation
        identity={{
          title: "Chart components - dev pages",
          href: "#",
          onFollow: () => navigate(`/?${searchParams.toString()}`),
        }}
        utilities={[
          {
            type: "menu-dropdown",
            text: "Settings",
            iconName: "settings",
            items: [
              { id: "dark-mode", text: isDarkMode ? "Set light mode" : "Set dark mode" },
              { id: "compact-mode", text: isCompactMode ? "Set comfortable mode" : "Set compact mode" },
              { id: "rtl", text: isRtl ? "Set left to right text" : "Set right to left text" },
            ],
            onItemClick({ detail }) {
              switch (detail.id) {
                case "dark-mode":
                  return setUrlParams({ mode: isDarkMode ? Mode.Light : Mode.Dark });
                case "compact-mode":
                  return setUrlParams({ density: isCompactMode ? Density.Comfortable : Density.Compact });
                case "rtl":
                  return setUrlParams({ direction: isRtl ? "ltr" : "rtl" });
              }
            },
          },
        ]}
      />
    </header>
  );
}

interface TreeItem {
  name: string;
  href?: string;
  items: TreeItem[];
  level: number;
}

function IndexPage() {
  const tree = createPagesTree(pages);
  return (
    <AppLayout
      navigationHide={true}
      toolsHide={true}
      content={
        <Box>
          <h1>Welcome!</h1>
          <p>Select a page:</p>
          <ul>
            {tree.items.map((item) => (
              <TreeItemView key={item.name} item={item} />
            ))}
          </ul>
        </Box>
      }
    />
  );
}

function createPagesTree(pages: string[]) {
  const tree: TreeItem = { name: ".", items: [], level: 0 };
  function putInTree(segments: string[], node: TreeItem, item: string, level = 1) {
    if (segments.length === 0) {
      node.href = item;
    } else {
      let match = node.items.filter((item) => item.name === segments[0])[0];
      if (!match) {
        match = { name: segments[0], items: [], level };
        node.items.push(match);
      }
      putInTree(segments.slice(1), match, item, level + 1);
      // make directories to be displayed above files
      node.items.sort((a, b) => Math.min(b.items.length, 1) - Math.min(a.items.length, 1));
    }
  }
  for (const page of pages) {
    const segments = page.slice(1).split("/");
    putInTree(segments, tree, page);
  }
  return tree;
}

function TreeItemView({ item }: { item: TreeItem }) {
  return (
    <li>
      {item.href ? (
        <RouterLink to={item.href}>{item.name}</RouterLink>
      ) : (
        <Box variant={item.level === 1 ? "h2" : "h3"}>{item.name}</Box>
      )}
      <ul style={{ marginBlock: 0, marginInline: 0 }}>
        {item.items.map((item) => (
          <TreeItemView key={item.name} item={item} />
        ))}
      </ul>
    </li>
  );
}

function RouterLink({ to, children, ...rest }: LinkProps & { to: string }) {
  const [searchParams] = useSearchParams();
  const href = useHref(to);
  return (
    <Link href={`${href}?${searchParams.toString()}`} {...rest}>
      {children}
    </Link>
  );
}

const PageWithFallback = () => {
  const { pathname: page } = useLocation();

  if (!page || !page.includes(page)) {
    return <span>Not Found</span>;
  }

  return <Page pageId={page} />;
};

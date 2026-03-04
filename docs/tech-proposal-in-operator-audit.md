# Tech proposal: Audit and refactor `in` operator checks

This document describes the audit and refactoring of `'prop' in obj` checks across the Cloudscape repositories, following an action item from the August 2024 Property Filter COE.

Related links:

* [COE: Property filter not creating filtering tokens](https://quip-amazon.com/YpPBAPz2BrqF/COE-Property-filter-not-creating-filtering-tokens)
* [SIM ticket: AWSUI-59006](https://issues.amazon.com/issues/AWSUI-59006) — Review current usage of the "in" property checks
* [PR with the fix](https://github.com/cloudscape-design/components/pull/2629)
* [PR introducing the bug](https://github.com/cloudscape-design/components/pull/2618)

## The problem

In August 2024, a refactoring changed the token type from `Token` (with `propertyKey`) to `InternalToken` (with `property`). The guard condition still checked for the old property:

```ts
// BEFORE refactoring — worked correctly
interface Token { propertyKey?: string; operator: string; value: any; }
if (!('propertyKey' in newToken)) { return; }

// AFTER refactoring — silently broken, always returns false
interface InternalToken { property: null | InternalFilteringProperty; operator: string; value: any; }
if (!('propertyKey' in newToken)) { return; }  // ← 'propertyKey' no longer exists, but TS doesn't care
```

**TypeScript does not validate the `in` operator.** You can write `'banana' in obj` and it compiles fine. This means every `'prop' in obj` check in the codebase is vulnerable to the same silent breakage during refactoring.

The fix was straightforward:

```ts
// FIXED — direct property access, TypeScript validates this
if (!newToken.property) { return; }
```

## Audit results

### Scope

| Repository | Category 1 (actionable) | Category 2 (keep as-is) | Total | Status |
|------------|------------------------|------------------------|-------|--------|
| `cloudscape-design/components` | ~30 | ~10 | ~40 | ✅ Audited — type guards needed |
| `cloudscape-design/chart-components` | **0** | **12** | **12** | ✅ Audited — no action needed |

---

### `components` repository

We found **40 usages** of `'prop' in obj` across **20 files** in `src/`. They fall into two categories:

#### Category 1: Union type discrimination (~30 usages) — CAN be made type-safe

These check whether an object is one type or another in a union. For example, `InternalToken` has `operator` but `InternalTokenGroup` has `operation`:

```ts
if ('operator' in tokenOrGroup) {
  // it's a token
}
```

This is the standard TypeScript pattern for narrowing unions, but the string `'operator'` is **not validated** against the type.

**Affected files and lines:**

| Component | File | Code | GitHub link |
|-----------|------|------|-------------|
| property-filter | `internal.tsx:164` | `'operation' in tokenOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/internal.tsx#L164) |
| property-filter | `token.tsx:74` | `'operation' in tokenOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/token.tsx#L74) |
| property-filter | `token.tsx:80` | `'operation' in tokenOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/token.tsx#L80) |
| property-filter | `token.tsx:87` | `'operator' in token` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/token.tsx#L87) |
| property-filter | `utils.ts:146` | `'operator' in tokenOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/utils.ts#L146) |
| property-filter | `utils.ts:150` | `'operator' in nestedTokenOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/utils.ts#L150) |
| property-filter | `controller.ts:49` | `'operator' in token` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/controller.ts#L49) |
| property-filter | `filter-options.ts:30` | `'options' in optionOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/filter-options.ts#L30) |
| autosuggest | `utils/utils.ts:8` | `'type' in option` | [link](https://github.com/cloudscape-design/components/tree/main/src/autosuggest/utils/utils.ts#L8) |
| autosuggest | `options-controller.ts:182` | `'options' in optionOrGroup` | [link](https://github.com/cloudscape-design/components/tree/main/src/autosuggest/options-controller.ts#L182) |
| autosuggest | `autosuggest-option.tsx:111` | `'type' in option` | [link](https://github.com/cloudscape-design/components/tree/main/src/autosuggest/autosuggest-option.tsx#L111) |
| autosuggest | `autosuggest-option.tsx:112` | `'type' in option` | [link](https://github.com/cloudscape-design/components/tree/main/src/autosuggest/autosuggest-option.tsx#L112) |
| autosuggest | `autosuggest-option.tsx:113` | `'type' in option` | [link](https://github.com/cloudscape-design/components/tree/main/src/autosuggest/autosuggest-option.tsx#L113) |
| internal/option | `filter-options.ts:77` | `'options' in option` | [link](https://github.com/cloudscape-design/components/tree/main/src/internal/components/option/utils/filter-options.ts#L77) |
| mixed-line-bar-chart | `utils.ts:103` | `'y' in series` | [link](https://github.com/cloudscape-design/components/tree/main/src/mixed-line-bar-chart/utils.ts#L103) |
| mixed-line-bar-chart | `utils.ts:109` | `'x' in series` | [link](https://github.com/cloudscape-design/components/tree/main/src/mixed-line-bar-chart/utils.ts#L109) |
| side-navigation | `util.tsx:53` | `'href' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/side-navigation/util.tsx#L53) |
| side-navigation | `util.tsx:60` | `'items' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/side-navigation/util.tsx#L60) |
| top-navigation | `parts/utility.tsx:136` | `'items' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/top-navigation/parts/utility.tsx#L136) |
| button-dropdown | `internal.tsx:184` | `'items' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/button-dropdown/internal.tsx#L184) |
| button-dropdown | `internal.tsx:193` | `'badge' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/button-dropdown/internal.tsx#L193) |
| button-group | `item-element.tsx:106` | `'popoverFeedback' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/button-group/item-element.tsx#L106) |
| select | `check-option-value-field.ts:18` | `'options' in element` | [link](https://github.com/cloudscape-design/components/tree/main/src/select/utils/check-option-value-field.ts#L18) |
| flashbar | `collapsible-flashbar.tsx:217` | `'expandedIndex' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/flashbar/collapsible-flashbar.tsx#L217) |
| flashbar | `collapsible-flashbar.tsx:221` | `'expandedIndex' in item` | [link](https://github.com/cloudscape-design/components/tree/main/src/flashbar/collapsible-flashbar.tsx#L221) |
| flashbar | `non-collapsible-flashbar.tsx:127` | `'current' in transitionRootElement` | [link](https://github.com/cloudscape-design/components/tree/main/src/flashbar/non-collapsible-flashbar.tsx#L127) |
| flashbar | `collapsible-flashbar.tsx:307` | `'current' in transitionRootElement` | [link](https://github.com/cloudscape-design/components/tree/main/src/flashbar/collapsible-flashbar.tsx#L307) |

#### Category 2: Runtime / feature detection (~10 usages) — MUST stay as-is

These check browser capabilities or cross-window duck typing where there is no TypeScript type to validate against. The `in` operator is the only correct approach here.

| Component | File | Code | Why it must stay | GitHub link |
|-----------|------|------|------------------|-------------|
| internal/dom | `dom.ts:67-71` | `'nodeType' in target`, `'nodeName' in target`, `'parentNode' in target` | Cross-window duck typing (`instanceof` fails across iframes) | [link](https://github.com/cloudscape-design/components/tree/main/src/internal/utils/dom.ts#L67) |
| internal/dom | `dom.ts:81` | `'style' in target` | Cross-window HTMLElement detection | [link](https://github.com/cloudscape-design/components/tree/main/src/internal/utils/dom.ts#L81) |
| internal/dom | `dom.ts:93` | `'ownerSVGElement' in target` | Cross-window SVGElement detection | [link](https://github.com/cloudscape-design/components/tree/main/src/internal/utils/dom.ts#L93) |
| focus-lock | `utils.ts:30` | `'checkVisibility' in element` | Browser API feature detection | [link](https://github.com/cloudscape-design/components/tree/main/src/internal/components/focus-lock/utils.ts#L30) |
| tabs | `native-smooth-scroll-supported.ts:6` | `'scrollBehavior' in document.documentElement.style` | CSS feature detection | [link](https://github.com/cloudscape-design/components/tree/main/src/tabs/native-smooth-scroll-supported.ts#L6) |
| link | `internal.tsx:132` | `'button' in event` | MouseEvent vs KeyboardEvent | [link](https://github.com/cloudscape-design/components/tree/main/src/link/internal.tsx#L132) |
| navigable-group | `internal.tsx:136` | `'disabled' in element` | DOM element capability check | [link](https://github.com/cloudscape-design/components/tree/main/src/navigable-group/internal.tsx#L136) |
| app-layout | `runtime-drawer/index.tsx:90,94` | `'iconSvg' in runtimeHeaderAction` | Runtime plugin API | [link](https://github.com/cloudscape-design/components/tree/main/src/app-layout/runtime-drawer/index.tsx#L90) |
| app-layout | `use-app-layout.tsx:243` | `'payload' in message` | postMessage validation | [link](https://github.com/cloudscape-design/components/tree/main/src/app-layout/visual-refresh-toolbar/state/use-app-layout.tsx#L243) |
| property-filter | `internal.tsx:319` | `'keepOpenOnSelect' in option` | Runtime property not in TS type | [link](https://github.com/cloudscape-design/components/tree/main/src/property-filter/internal.tsx#L319) |
| flashbar | `common.tsx:84` | `'id' in item` | Optional property existence check | [link](https://github.com/cloudscape-design/components/tree/main/src/flashbar/common.tsx#L84) |
| test-utils | `code-editor/index.ts:56` | `'env' in editor` | External library duck typing | [link](https://github.com/cloudscape-design/components/tree/main/src/test-utils/dom/code-editor/index.ts#L56) |

---

### `chart-components` repository

We found **12 usages** of `'prop' in obj` across **6 files** in `src/` (plus 1 in test code). **All are Category 2** — no type guards are needed.

#### Undocumented Highcharts properties (7 usages)

Properties that exist at runtime but are intentionally absent from the Highcharts TypeScript definitions. Using `keyof` would be meaningless since the properties are not in the type.

| Component | File | Code | Why it must stay | GitHub link |
|-----------|------|------|------------------|-------------|
| core/utils | `utils.ts:87` | `"symbol" in series` | `Highcharts.Series.symbol` is not in TS types but exists at runtime for scatter series markers | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L87) |
| core/utils | `utils.ts:90` | `"dashStyle" in series.options` | `dashStyle` exists on some Highcharts series types but not in the base `SeriesOptions` type | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L90) |
| core/utils | `utils.ts:387` | `"whiskers" in point` | `Highcharts.Point.whiskers` SVG element exists only on errorbar points at runtime, not in TS types | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L387) |
| chart-api/highlight | `chart-extra-highlight.ts:215` | `"plotLinesAndBands" in axis` | `Highcharts.Axis.plotLinesAndBands` array is explicitly not covered by TS types (comment in code) | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-highlight.ts#L215) |
| chart-api/tooltip | `chart-extra-tooltip.tsx:243` | `"tooltipPos" in point` | `Highcharts.Point.tooltipPos` tuple exists only on pie series points, not in TS types | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-tooltip.tsx#L243) |
| chart-api/index | `index.tsx:372` | `"colorCounter" in chart` | `Highcharts.Chart.colorCounter` is an internal property used for color assignment, not in TS types | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/index.tsx#L372) |
| internal/series-marker | `render-marker.tsx:102` | `"symbol" in series` | Same as first entry — undocumented `Highcharts.Series.symbol`, duplicate pattern in marker rendering | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/internal/components/series-marker/render-marker.tsx#L102) |

#### Highcharts complex external unions (3 usages)

Properties being checked belong to Highcharts-defined union types (e.g., `SeriesOptionsType` is a union of 50+ series configuration types). These are external types not controlled by this codebase.

| Component | File | Code | Why it must stay | GitHub link |
|-----------|------|------|------------------|-------------|
| core/utils | `utils.ts:218` | `"type" in series` | `Highcharts.SeriesOptionsType` is a union of 50+ series option types; `type` may or may not be present | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L218) |
| core/utils | `utils.ts:249` | `"xAxis" in item \|\| "yAxis" in item` | Duck-typing on `Highcharts.SeriesOptionsType \| Highcharts.PointOptionsType` — external union | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L249) |
| chart-api/nodata | `chart-extra-nodata.tsx:55-56` | `"data" in s.options` and `"y" in i` | Defensive check on Highcharts options; data items can be `number \| [number, number] \| { y: number } \| null` | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-nodata.tsx#L55) |

#### Browser API feature detection (1 usage)

| Component | File | Code | Why it must stay | GitHub link |
|-----------|------|------|------------------|-------------|
| internal/utils/dom | `dom.ts:17` | `"scrollTo" in element` | `scrollTo` is not available in JSDOM test environments; classic feature detection pattern | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/internal/utils/dom.ts#L17) |

#### Test file usages (1 usage, not counted in primary audit)

| Component | File | Code | Why it must stay | GitHub link |
|-----------|------|------|------------------|-------------|
| core/\_\_tests\_\_ | `common.tsx:68` | `"asymmetricMatch" in value` | Runtime Jest matcher detection — `asymmetricMatch` is a Jest convention property not in any TS type | [link](https://github.com/cloudscape-design/chart-components/tree/main/src/core/__tests__/common.tsx#L68) |

#### Notable cases

- **`"symbol" in series`** (utils.ts:87, render-marker.tsx:102): The Highcharts `Series` type does not include `symbol` in its TS definition, but scatter series set it at runtime based on the marker configuration. The `in` check is the only way to safely access it without a type assertion.

- **`"plotLinesAndBands" in axis`** (chart-extra-highlight.ts:215): The code even has an inline comment: *"The Highcharts `Axis.plotLinesAndBands` API is not covered with TS."* This is intentional — Highcharts considers this an internal API.

- **`"tooltipPos" in point`** (chart-extra-tooltip.tsx:243): Pie chart points provide tooltip coordinates via an undocumented `tooltipPos` tuple. The code includes a fallback path for when this property is absent, making the `in` check a necessary defensive guard.

- **`"colorCounter" in chart`** (index.tsx:372): This accesses a Highcharts internal used for automatic color assignment. It's part of a workaround for [a Highcharts bug](https://github.com/highcharts/highcharts/issues/23077).

- **`"data" in s.options` and `"y" in i`** (chart-extra-nodata.tsx:55-56): Highcharts data arrays can contain `number`, `[number, number]`, `{ y: number }`, or `null`. The `"y" in i` check is the standard way to differentiate the object form from the primitive forms.

#### Additional patterns found in chart-components

| Pattern | Count | Details |
|---------|-------|---------|
| `for...in` loops | 0 | None found |
| `Object.keys()` | 1 | `src/internal/base-component/get-data-attributes.ts` — iterating `data-*` attributes from props |
| `Object.entries()` | 1 | `src/core/chart-api/chart-extra-navigation.ts` — iterating element attributes for `setAttribute` |
| `hasOwnProperty` | 0 | None found |

---

## Proposed solution: type guard functions with `keyof`

Replace each inline `'prop' in obj` check (Category 1, components repo only) with a **type guard function** that validates the property name at compile time:

```ts
// BEFORE — 'operator' is an unchecked string, vulnerable to refactoring
if ('operator' in tokenOrGroup) {
  // tokenOrGroup is narrowed to InternalToken
}

// AFTER — 'operator' is validated against InternalToken via keyof
function isInternalToken(
  t: InternalToken | InternalTokenGroup
): t is InternalToken {
  const key: keyof InternalToken = 'operator';  // ← TypeScript validates this!
  return key in t;
}

if (isInternalToken(tokenOrGroup)) {
  // tokenOrGroup is narrowed to InternalToken
}
```

**Why this works:** `keyof InternalToken` restricts the value to actual properties of `InternalToken`. If someone renames `operator` to `op`, the line `const key: keyof InternalToken = 'operator'` immediately produces a TypeScript error.

### Type guards to create

Each union type gets one or two type guard functions. All checks for that union are replaced with the same function call:

| Type guard | Union | Discriminant | Replaces |
|-----------|-------|-------------|----------|
| `isInternalToken()` | `InternalToken \| InternalTokenGroup` | `operator` | 7 checks in property-filter |
| `isInternalTokenGroup()` | `InternalToken \| InternalTokenGroup` | `operation` | 2 checks in property-filter |
| `isOptionGroup()` | `Option \| OptionGroup` | `options` | 3 checks in property-filter, internal/option, select |
| `isAutosuggestGroup()` | `AutosuggestItem` union | `type` | 4 checks in autosuggest |
| `isAutosuggestOptionGroup()` | option vs group | `options` | 1 check in autosuggest |
| `isThresholdWithY()` | threshold series | `y` | 1 check in mixed-line-bar-chart |
| `isThresholdWithX()` | threshold series | `x` | 1 check in mixed-line-bar-chart |
| `isSideNavLink()` | SideNavigation item union | `href` | 1 check in side-navigation |
| `isSideNavSection()` | SideNavigation item union | `items` | 1 check in side-navigation |
| `isMenuDropdown()` | TopNavigation utility union | `items` | 1 check in top-navigation |
| `isItemGroup()` | ButtonDropdown item union | `items` | 1 check in button-dropdown |
| `isStackableItem()` | `StackableItem \| MessageDefinition` | `expandedIndex` | 2 checks in flashbar |
| `isReactRef()` | `HTMLElement \| React.RefObject` | `current` | 2 checks in flashbar |

### Where type guards live

Type guard functions will be co-located with the types they guard — typically in the same file as the interface definition or in a dedicated `utils.ts` within the component folder. For types shared across components (e.g., `OptionGroup` used in property-filter, internal/option, and select), the guard will live next to the shared type definition and be imported where needed.

### What stays as-is

The ~10 runtime/feature-detection checks in the components repo (Category 2) and all 12 checks in chart-components cannot use `keyof` because we don't own the types. These stay as inline `in` checks with an `eslint-disable` comment explaining why.

Notable cases in components Category 2:

- **`'keepOpenOnSelect' in option`** (property-filter): This property is intentionally absent from the public type definition — it's an internal runtime extension added programmatically to certain autosuggest options. Adding it to the type would expose it in the public API. Keeping the `in` check with an eslint-disable comment is the right approach.
- **`'id' in item`** (flashbar): `id` is an optional property on `FlashbarProps.MessageDefinition`. The `in` check tests for runtime key existence (whether the user provided the key at all), which is subtly different from `item.id !== undefined`. Both would work in practice, but we keep `in` here for semantic correctness.

## Test coverage

The COE action item asks to both refactor `in` checks and ensure test coverage. Our approach:

1. Existing component tests that exercise union-type code paths (e.g., property filter with token groups, flashbar with stacked items) already provide integration-level coverage for the logic that depends on these checks.
2. We will verify that each `in` check code path is reachable from existing tests. Where coverage gaps are found, we will document them for follow-up but not block the refactoring on adding new integration tests.
3. The real testing opportunity is with the cases where a guard function **cannot** be introduced (e.g., `'keepOpenOnSelect' in option`, `'id' in item`). There, component-level tests that exercise both branches can fail conveniently if unsafe changes are made to the concerned code.

## Future prevention: ESLint rule

To prevent new raw `in` checks from being introduced, add an ESLint rule:

```js
// eslint.config.mjs
{
  'no-restricted-syntax': ['error', {
    selector: 'BinaryExpression[operator="in"]',
    message: 'Do not use the "in" operator directly. Use a typed type guard function instead.'
  }]
}
```

The Category 2 usages get `// eslint-disable-next-line no-restricted-syntax` with an explanation.

Note: This rule only catches the binary expression `'prop' in obj`, not `for...in` loops (which use `ForInStatement` in the AST, a different node type).

### What this gives us

| Scenario | Today | After this change |
|----------|-------|-------------------|
| Someone renames a property during refactoring | ❌ Silent failure at runtime (the COE bug) | ✅ TypeScript compile error in the type guard |
| Someone writes a new `'prop' in obj` check | ❌ No warning | ✅ ESLint error, must use a type guard |
| Browser feature detection | ✅ Works | ✅ Still works (explicit eslint-disable) |

## Effort and risk

**Estimated effort:** ~3-4 days of implementation + code review for the components repo. No code changes needed for chart-components.

**Risk:** Low. Type guard functions are pure wrappers around the existing `in` logic — runtime behavior is identical. No public API, visual, or behavioral changes. If any issue is found, type guards can be inlined back to raw `in` checks with a simple find-and-replace.

**Why now?** While no similar bug has recurred since the August 2024 COE, the risk is latent — any future refactoring of a discriminant property will silently break the corresponding `in` check. The type guard approach addresses this with minimal effort and also introduces an ESLint rule that prevents the pattern from proliferating further. Given that we found 40 usages across 20 files (and this number will only grow), addressing it now is cheaper than addressing it later.

## Alternatives considered

### Direct property access (`obj.prop`)

Replace `'prop' in obj` with `obj.prop !== undefined`.

- ✅ TypeScript validates property names
- ❌ Only works when the property exists on all types in the union (otherwise it's a type error)
- ❌ Doesn't narrow union types
- Only applicable to ~3 of the 40 cases

### Discriminant tag property (`kind: 'token' | 'group'`)

Add an explicit `kind` field to all union types.

- ✅ Gold standard for discriminated unions
- ❌ Requires changing internal interfaces across many components
- ❌ Much larger scope (~2-3 weeks vs ~1 week)
- Could be done as a future improvement

Adding a `kind` discriminant to e.g. `InternalToken | InternalTokenGroup` would require changing every call site that **creates** these objects (~15+ locations in property-filter alone), updating all test fixtures, and modifying serialization/deserialization logic. The type guard approach achieves the same compile-time safety with changes only at the ~30 **consumption** sites, not the creation sites.

### Why not a `@typescript-eslint` rule?

`@typescript-eslint` does not have a built-in rule that validates the left-hand side of `in` against the type of the right-hand side. Writing a custom type-aware ESLint rule is significantly more complex (requires the TypeScript type-checker integration) and not worth the effort when `no-restricted-syntax` + type guards already cover the problem completely.

## Feedback

Notes:

* ...

Voting:

| Reviewer | Vote | Comments |
|----------|------|----------|
| | | |
| | | |
| | | |